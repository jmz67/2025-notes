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

