#### 如何 debug Celery 

[Pycharm下 debug Celery - ZhuGaochao - 博客园](https://www.cnblogs.com/bigtreei/p/14777178.html)

我们的启动命令是：

```shell
poetry run celery -A app.celery worker -P solo --without-gossip --without-mingle -Q dataset,generation,mail,ops_trace --loglevel INFO
```

对应于文章中的方法，我们的启动方式实际上就是：

```shell
celery -A app.celery worker -P solo --without-gossip --without-mingle -Q dataset,generation,mail,ops_trace --loglevel INFO
```

这个命令是用来启动一个 Celery worker 的，具体参数的含义如下：

基础部分

- `celery`：Celery 命令行工具，用于管理 Celery 相关的操作。
- `-A app.celery`：指定 Celery 应用程序的路径，`app.celery` 表示 Celery 应用程序的模块路径，即告诉 Celery 哪里可以找到你的 Celery 应用实例。
- `worker`：表示启动一个 Celery worker，worker 是 Celery 中用于执行任务的工作进程。

### 并发设置
- `-P solo`：指定使用 Solo 池作为并发执行方式。Solo 池是一个内联池，任务会逐一顺序执行，适用于不需要并发处理的场景，比如一些 CPU 密集型任务，且任务之间有依赖关系需要按顺序执行的情况。

### 网络通信相关
- `--without-gossip`：禁用 worker 之间的 gossip 通信。Gossip 通信主要用于 worker 之间交换心跳信息等，禁用它可以减少不必要的网络通信开销，尤其在有大量 worker 的情况下，可以避免因 gossip 消息过多导致的网络压力和性能问题。
- `--without-mingle`：禁用 worker 启动时的 mingle 功能。Mingle 是在 worker 启动时进行的，用于同步 worker 之间的状态信息，禁用它可以加快 worker 的启动速度，同样适用于有较多 worker 的场景。

### 队列设置
- `-Q dataset,generation,mail,ops_trace`：指定该 worker 要监听的队列，即它只会从这些队列中获取任务来执行。`dataset`、`generation`、`mail`、`ops_trace` 是队列的名称，通过这种方式可以实现任务的分类处理，让不同的 worker 处理不同类型的任务，提高任务处理的效率和针对性。

### 日志级别
- `--loglevel INFO`：设置日志级别为 INFO，表示只记录 INFO 级别及以上（如 WARNING、ERROR）的日志信息。这有助于在生产环境中过滤掉一些不必要的调试信息，使日志更加简洁，便于监控和排查问题。