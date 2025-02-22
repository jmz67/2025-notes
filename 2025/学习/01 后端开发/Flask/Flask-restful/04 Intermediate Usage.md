本页介绍了如何构建一个稍微复杂一点的 flask-restful 应用，它将涵盖在设置基于 flask-restful 的真实世界 API 时的一些最佳实践。

### 项目结构

组织 flask-restful 应用的方式有很多种，但这里我们将描述一种能够很好地扩展到大型应用并保持良好组织结构的方式。基本思想是将应用拆分为三个主要的部分：路由，资源以及任何通用基础函数。

以下是一个示例目录结构：

```
myapi/
    __init__.py
    app.py          # 此文件包含你的应用和路由
    resources/
        __init__.py
        foo.py      # 包含 /Foo 的逻辑
        bar.py      # 包含 /Bar 的逻辑
    common/
        __init__.py
        util.py     # 一些通用基础函数
```

common 目录可能只包含一组用于应用中通用需求的辅助函数。它也可以包含例如资源所需的任何自定义输入输出类型。

在资源文件中，我们只需要定义资源对象。以下是一个 foo.py 的示例：

```python
from flask_restful import Resource

class Foo(Resource):
    def get(self):
        pass 

    def post(self):
        pass 
```

这个设置的关键在于 app.py 文件：

```python
from flask import Flask 
from flask_restful import Api 
from myapi.resources.foo import Foo 
from myapi.resources.bar import Bar 
from myapi.resources.baz import Baz 

app = Flask(__name__)
api = Api(app)

api.add_resource(Foo, '/Foo', '/Foo/<string:id>')
api.add_resource(Bar, '/Bar', '/Bar/<string:id>')
api.add_resource(Baz, '/Baz', '/Baz/<string:id>')
```

你可以想象，在一个特别大或复杂的 API 中，这个文件最终会成为一个非常有价值的文件，因为它列出了 API 中的所有路由和资源。你还会使用这个文件来设置任何配置值（before_request() 、after_request() ）。基本上，这个文件配置了你的整个 API。

common 目录中的内容只是你希望用来支持资源模块的东西。

### 使用蓝图

查看 flask 文档中的蓝图部分，了解什么是蓝图以及为什么应该使用它们。以下是如何将一个 Api 连接到蓝图的示例：

```python
from flask import Flask, Blueprint 
from flask_restful import Api, Resource, url_for

app = Flask(__name__)
api_bp = Blueprint('api', __name__)
api = Api(api_bp)

class TodoItem(Resource):
    def get(self, id):
        return {
            "task": 'Say "Hello, World!"'
        }

api.add_resource(TodoItem, '/todos/<int:id>')
app.register_blueprint(api_bp)
```

api = Api(api_bp) 创建一个 flask-restful 的 Api 实例，并将其绑定到蓝图 api_bp 上。这意味着所有通过 api 添加到资源都会注册的蓝图上。

### 完整的参数解析示例

在文档的其他地方，我们已经详细描述了如何使用 reqparse 示例。在这里，我们将设置一个具有多个输入参数的资源，以此展示更多选项。我们将定义一个名为用户的资源。

```python
from flask_restful import fields, marshal_with, reqparse, Resource

def email(email_str):
    """如果有效，返回 email_str，否则抛出异常。"""
    if valid_email(email_str):
        return email_str 
    else:
        raise ValueError("{} 不是一个有效的电子邮件".format(email_str))

post_parser = reqparse.RequestParser()
post_parser.add_argument(
    "username", dest="username",
    location='form', required=True,
    help='用户的用户名',
)

post_parser.add_argument(
    "email", dest="email",
    location="form", type="email"
    help='用户的电子邮件'
)

post_parser.add_argument(
    "user_priority", dest="user_priority",
    type=int, location="form",
    default=1, choices=range(5), help='用户的优先级',
)

user_fields = {
    'id': fields.Integer,
    'username': fields.String,
    'email': fields.String,
    'user_priority': fields.Integer,
    'custom_greeting': fields.FormattedString('嘿，{username}！'),
    'date_created': fields.DateTime,
    'date_updated': fields.DateTime,
    'links': fields.Nested({
        'friends': fields.Url('user_friends'),
        'posts': fields.Url('user_posts'),
    }),
}

class User(Resource):
    @marshal_with(user_fields)
    def post(self):
        args=post_parser.parse_args()
        user=create_user(args.username, args.email, args.user_priority)
        return user 

    @marshal_with(user_fields)
    def get(self, id):
        args = post_parser.parse_args()
        user = fetch_user(id)
        return user 
```

### 将构造函数参数传递给资源

你的资源实现可能需要外部依赖项。这些依赖项最好通过构造函数传递，以此实现松耦合。Api.add_resource() 方法有两个关键字参数：resource_class_args 和 resource_class_kwargs 。它们的值将被转发并传递到你的资源实现的构造函数中。

```python
from flask_restful import Resource 

class TodoNext(Resource):
    def __init__(self, **kwargs):
        # smart_engine 是个黑盒依赖项
        self.smart_engine = kwargs["smart_engine"]

    def get(self):
        return self.smart_engine.next_todo()
```

