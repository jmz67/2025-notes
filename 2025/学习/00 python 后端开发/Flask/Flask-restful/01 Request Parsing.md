Flask-RESTful's request parsing interface, reqparse, is modeled after the argparse interface. It is designed to provide simple and uniform access to any variable on the flask request object in Flask.

### 基本参数

下面是请求解析器的一个简单示例，它寻找两个参数字典：一个整数一个字符串

```python
from flask_restful import reqparse

parser = reqparse.RequestParser()
parser.add_argument('rate', type=int, help="Rate cannot be converted")
parser.add_argument('name')
args = parse.parse_args()
```

请注意：默认参数的类型是 unicode 字符串。在 python3 里面是 str 在 python2 是 unicode 。

如果你指定了 help 的值，它将被当作错误信息呈现每当进行参数解析的时候类型错误被发现的时候。如果你未指定帮助信息，默认的行为是返回类型错误的消息本身。

**By default, arguments are not required. Also, arguments supplied in the request that are not part of the RequestParser will be ignored.**

**Also note: Arguments declared in your request parser but not set in the request itself will default to None.**

### Required Arguments 

To require a value be passed for an argument, just add `required=True` to the call to `add_argument()` .

```python
parser.add_argument('name', required=True, help = "Name cannot be blank")
```

### Multiple Values & Lists

如果你想要以列表的形式接受一个键的多个值