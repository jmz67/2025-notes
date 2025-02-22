Flask-RESTful 提供了一种简单的方法来控制你在响应中实际渲染的数据。通过 fields 模块，你可以使用任何对象（ORM 模型，自定义类）作为资源。fields 模块还允许你格式化和过滤响应，从而不用担心暴露内部数据结构。此外，代码的可读性也得到了提升，因为你可以清晰地看到哪些数据会被渲染以及如何格式化。

### 基本用法（Basic Usage）

```python
from flask_restful import Resource, fields, marshal_with

resource_fields = {
    "name": fields.String,
    "address": fields.String,
    "data_updated": fields.DateTime(dt_format='rfc822'),
}

class Todo(Resource):
    @marshal_with(resource_fields, envelop='resource')
    def get(self, **kwargs):
        return do_get_todo() # Some function that queries the db 
```

resource_fields 定义了哪些字段会被序列化并返回。

marshal_with 装饰器，将数据对象通过字段过滤后返回。它支持单个对象，字段和对象列表。

envelope 参数：可选参数，用于将结果包装在一个键下。例如返回的 JSON 数据会包含一个 resource 的键。

```
C:\Users\admin\Desktop\test>curl http://127.0.0.1:5000/todo
{
    "resource": {
        "name": "John Doe",
        "address": "123 Main St",
        "date_updated": "Sat, 15 Feb 2025 09:39:38 -0000"
    }
}
```

> 等效的显式写法：

```python
class Todo(Resource):
    def get(self, **kwargs):
        return marshal(db_get_todo(), resource_fields), 200
```

### 重命名属性

有时，公开的字段名和内部字段名不同。你可以通过 attribute 参数配置这种映射。

```python
fields = {
    'name': fields.String(attribute='private_name'),
    'address': fields.String,
}
```

也可以将 lambda 或任何可调用对象指定为属性：

```python
fields = {
    "name": fields.String(attribute=lambda x: x._private_name),
    "address": fields.String,
}
```

也可以使用 attribute 访问嵌套属性

```python
fields = {
    'name': fields.String(attribute='people_list.0.person_dictionary.name'),
    'address': fields.String,
}
```

