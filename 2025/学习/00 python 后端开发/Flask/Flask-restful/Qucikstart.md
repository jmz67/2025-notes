一个最小的 Flask-RESTful-API 是这样的：

```python
from flask import Flask 
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

class HelloWorld(Resource):
    def get(self):
        return {
            "hello": "world"
        }

api.add_resource(HelloWorld, "/")

if __name__ == "__main__":
    app.run(debug=True)
```

### Resourceful Routing

Flask-RESTful 

### Endpoints 

很多时候，在一个 API 中，你的资源会有多个 url。你可以通过多个 url 指向 Api 对象上的方法。Each one will be routed to your Resource.

```python
api.add_resource(
    HelloWorld,
    '/',
    '/hello'
)
```

You can also match parts of the path as variables to your resource methods.

```python
api.add_resource(
    Todo,
    '/todo/<int:todo_id>', endpoint="todo_ep"
)
```

### Argument Parsing 

While Flask provides easy access to request data (i.e. querystring or POST form encoded data), it is still a pain to validate form data. Flask-RESTful has built-in support for request data validation using a library similar to [argparse](http://docs.python.org/dev/library/argparse.html).

```python
from flask_restful import requarse

parser = requarse.RequestParser()
parser.add_argument("rate", type=int, help="Rate to charge for this resource")
args = parser.parse_args()
```

```python
from flask import Flask
from flask_restful import Api, Resource, reqparse

app = Flask(__name__)
api = Api(app)

# 创建请求解析器
parser = reqparse.RequestParser()
parser.add_argument('rate', type=int, help='Rate to charge for this resource', required=True)

class TodoResource(Resource):
    def post(self):
        # 解析请求数据
        args = parser.parse_args()
        
        # 获取解析后的参数
        rate = args['rate']
        
        # 假设返回 rate
        return {'message': f'Resource rate is set to {rate}'}, 200

# 将资源添加到 API 路由
api.add_resource(TodoResource, '/todos')

if __name__ == '__main__':
    app.run(debug=True)
```

```
curl -X POST -H "Content-Type: application/json" -d "{\"rate\": 10}" http://127.0.0.1:5000/todos
```

### Data Formatting

在这里我们将介绍如何在 Flask-RESTful 中进行数据格式化，以便将 Python 对象序列化为合适在 HTTP 响应中返回的数据格式。

```python
from flask import Flask
from flask_restful import Api, Resource, fields, marshal_with

# 创建 Falsk 应用和 API 实例
app = Flask(__name__)
api = Api(app)
 
# 定义返回的字段结构
resource_fields = {
    'task': fields.String, # 返回任务描述，类型为字符串
    'uri': fields.Url('todo_ep') # 返回一个 URL 字段，指向 todo_ep 端点
}
  
# 定义 Todo 数据模型
class TodoDao(object):
    def __init__(self, todo_id, task):
        self.todo_id = todo_id  # 每个 Todo 项的 ID
        self.task = task         # 任务描述
        self.status = 'active'   # 状态字段，不会出现在响应中

# 创建资源类，表示一个 RESTful API 资源
class Todo(Resource):
    # 使用 marshal_with 装饰器格式化返回的数据
    @marshal_with(resource_fields)
    def get(self, **kwargs):
        # 返回一个 TodoDao 对象的实例
        return TodoDao(todo_id='my_todo', task='Remember the milk')

# 创建另一个资源类，用于处理返回所有 Todo 项的请求
class TodoList(Resource):
    def get(self):
        # 返回多个 Todo 项
        todos = [
            TodoDao(todo_id='my_todo1', task='Buy milk'),
            TodoDao(todo_id='my_todo2', task='Write code'),
            TodoDao(todo_id='my_todo3', task='Read book')
        ]
        return todos

# 注册资源路由
api.add_resource(Todo, '/todo/<string:todo_id>', endpoint='todo_ep')  # 指定 URL 的端点名称
api.add_resource(TodoList, '/todos')  # 获取所有 Todo 项

# 运行应用
if __name__ == '__main__':
    app.run(debug=True)
```

