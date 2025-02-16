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

```