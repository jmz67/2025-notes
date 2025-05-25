
### Threading 和 async 

threading：像一个公司里雇了多个员工，靠操作系统调度，大家都有工资（线程开销大）。 
async：像一个员工兼职多个工作，每个工作互不干扰，他在不同时间处理不同的任务（协程超高效率）。

但是有个很坑的地方，无论是哪个都不是真正的两个人同时干活，因为公司只有一台电脑！（Python 的 GIL（全局解释器锁）限制了**同一时间只能有一个线程执行 Python 字节码**，从而阻碍了**多线程在多核 CPU 上实现真正的并行计算**。）

虽然说我们的 async 是开了很多协程这样，但实际上也是假并发，一个协程在执行 python 字节码的时候，其他协程必须等他 await 才能被调度。GIL 是针对解释器的，协程执行也是占用线程吗，所以一时间也只能运行一个协程。

那实际上协程和新开一个线程没什么区别啊感觉，区别实际在于协程的切换在用户态，不需系统调度，开销就好很多啦。协程的协程栈只有几 kb 而线程栈有好几 mb 创建和销毁的开销不小。协程在 IO 的时候会自动让出控制权，而线程 IO 时仍可能占住 GIL 。

> **协程在遇到 IO 操作时会主动 `await`，立即让出控制权；而线程在执行 IO 操作时**，**只有某些情况下才会释放 GIL，否则可能“白白占着 GIL 等 IO”，导致其他线程饿死。**

---

### 分布式锁初体验 

实际的场景是这样的，我们有大量文档需要进行嵌入处理，当然不可能在一次请求中等待他去做完，我们会把这个任务放到后台 celery 中去做。那么就面对一个问题，如何分发任务，任务如何进行合理的处理（不会多个 celery 处理同一个任务这样）。实际上  **celery 和 redis 的机制**（有待补充）确定了任务只要放到 redis 上去了就不会出现任务被重复消费的情况。问题主要在于我们不要重复的分发一个任务（这里是文档嵌入倒是还好，如果是扣钱或者订单什么的，就有点恶心了）。

如何确保我们不重复的分发任务呢？我们还是使用 redis ，在创建任务之前给每个任务使用文档的 id 来个命名（键值）。然后从 redis 中读取是否已经存在这样一个键了，如果有说明已经有这样一个任务了，那就报错好了，如果没有，那么就使用 setex 方法创建这样一个键值对存起来，然后将任务分发 delay 下去。

在我的任务逻辑里面，同样的拿到这个键值之后，在耗时任务（这里的耗时是文档嵌入的耗时）完成之后，我们直接 `redis_client.delete(indexing_cache_key)` 将这个任务清空就好。这样一顿操作下来，我们就实现了一个分布式锁，保证了任务的不重复运行。

示例代码：

```python
# 假设 doc_id 是文档的唯一标识
lock_key = f"embedding_task_lock:{doc_id}"

# 尝试获取锁，设置过期时间 10 分钟
success = redis_client.set(lock_key, "1", nx=True, ex=600)

if not success:
    raise AlreadyExistsException("任务已存在，拒绝重复分发")

# 成功获得锁，分发 Celery 任务
embedding_task.delay(doc_id)
```

在 `embedding_task` 的最后：

```python
@celery_app.task
def embedding_task(doc_id):
    try:
        # 执行嵌入逻辑
        ...
    finally:
        # 删除锁
        redis_client.delete(f"embedding_task_lock:{doc_id}")
```

但是这样还是存在问题，当我们的服务尤其是 celery down 掉之后，我们的任务就丢失了，如果**没有开启持久化**（比如 RDB 或 AOF），Redis 重启后任务锁会丢失，那你就会以为这个任务可以重新提交，导致重复执行。

更稳健的做法：

建立一个数据库任务表：

```sql
CREATE TABLE document_embedding_tasks (
    doc_id VARCHAR PRIMARY KEY,
    status VARCHAR,          -- pending, running, done, failed
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    error_msg TEXT
);
```

提交任务时候，双检查机制

```python
doc_id = "xxx"
lock_key = f"embedding_task_lock:{doc_id}"

# 先看数据库是否已有任务记录
task = db.get_task_by_doc_id(doc_id)
if task and task.status in ["pending", "running"]:
    raise AlreadyExistsError("任务已经存在")

# 再使用 Redis 做分布式锁，防止并发冲突
if not redis_client.set(lock_key, "1", nx=True, ex=600):
    raise AlreadyExistsError("任务锁存在，可能并发提交")

# 写入数据库
db.insert_or_update_task(doc_id, status="pending")

# 提交任务
embedding_task.delay(doc_id)
```

任务执行过程中

```python
@celery_app.task
def embedding_task(doc_id):
    db.update_task_status(doc_id, "running")
    try:
        # 嵌入逻辑
        ...
        db.update_task_status(doc_id, "done")
    except Exception as e:
        db.update_task_status(doc_id, "failed", error_msg=str(e))
        raise
    finally:
        redis_client.delete(f"embedding_task_lock:{doc_id}")
```

- **Redis** 用于快速、临时的“幂等性锁”，防止并发重复提交。
- **数据库** 是你的任务状态“单一可信源”（Single Source of Truth），即使 Redis 崩溃也不会丢状态。
- 支持失败恢复、错误追踪、人工干预，**更适合关键业务场景**（如订单、扣费、合同等）。

---

### python 中有哪些可变元素和不可变元素

python 中的对象分为两类：

不可变类型：int float bool str tuple frozenset NoneType 
可变类型：list dict set bytearray user-defined-class 

不可变对象一旦创建，其值无法更改
可变对象可以在原地修改其内容，id() 不变

python 的函数参数传递不是按值传递（copy 值），也不是按引用传递（cpp 的 refrence），它是一种叫做：

>✅ **“Call by Object Reference”**  也叫：**Call by Sharing（共享传参）**

函数的参数是对象的引用（地址），这个引用是赋值不可变的。

赋值不可变的意思是：函数内部的参数名（变量名）是局部变量，它指向传入的对象（引用）
不能通过重新赋值


#### 函数参数默认值的陷阱

```python
def append_to_list(value, lst=[]):
    lst.append(value)
    return lst
```

- 这里的 `lst=[]` 是一个**可变默认参数**。
- 在 Python 中，默认参数的值只会在**函数定义时计算一次**，而不是每次调用都重新计算。
- 所以 `lst` 在多次调用之间其实是**共享同一个列表对象**。

#### 可变对象在函数中是原地修改

如果传入的是一个可变对象，函数内部对其操作会影响外部变量，因为传入的是引用

```python
def f(x):
    x.append(1)

a = []
f(a)
print(a)  # 👉 [1]
```

但是不可变对象会新建引用

```python
def f(x):
    x += 1

a = 10
f(a)
print(a)  # 👉 10（没变）
```

#### += 和 + 的区别

很多候选人混淆 `lst += [x]` 与 `lst = lst + [x]`：

- `lst += [x]` 是原地修改（调用 `__iadd__()`），会影响原始对象。
- `lst = lst + [x]` 是生成新对象（调用 `__add__()`），不会影响原始对象。

```python
def test(lst):
    lst += [1]  # 原地修改

def test2(lst):
    lst = lst + [1]  # 新建对象赋值

a = [0]
test(a)
print(a)   # 👉 [0, 1]

b = [0]
test2(b)
print(b)   # 👉 [0] ✅ 没被修改
```

#### 如何避免默认可变参数陷阱？（务必提！）

```python
def append_to_list(value, lst=None):
    if lst is None:
        lst = []
    lst.append(value)
    return lst
```

#### 是否是 Python 的设计缺陷？

不是。Python 的设计者 Guido van Rossum 明确表示这是一个**有意为之的设计**，并非 Bug。因为默认参数本身是对象引用，设计目标是让高级用户可以用对象持久化状态（比如缓存），只不过初学者容易踩坑。

Guido 的原话在 Python 邮件列表中大意如下：

> "This behavior is intentional and sometimes useful — mutable default arguments can serve as an efficient way to accumulate state across function calls."

场景一：缓存函数内部的计算结果（memoization）

```python
def fib(n, cache={}):
    if n in cache:
        return cache[n]
    if n < 2:
        cache[n] = n
    else:
        cache[n] = fib(n-1) + fib(n-2)
    return cache[n]
```

- 这个函数中的 `cache` 是一个默认参数，但因为它只在定义时创建一次，所以在多次递归调用之间共享同一个字典。
- 这就实现了“原地缓存”（memoization）效果，极大地提高效率。
- 这在 C 或 Java 中要手动维护，但在 Python 中几行就能搞定。

这个题在以下大厂中都有被问过或变体出现过：

- 🟦 **字节跳动（ByteDance）**：常问函数参数传递与默认值问题。
- 🟥 **美团**：常考默认参数与 list 的副作用。
- 🟨 **滴滴**：强调内存 id 变化与对象行为。
- 🟧 **阿里/蚂蚁金服**：经常追问 `id()`、引用和作用域。
- 🟩 **腾讯**：喜欢考察 `+` 与 `+=` 的区别，尤其是在列表或字符串上。

https://www.cnblogs.com/hechengQAQ/p/17315387.html

