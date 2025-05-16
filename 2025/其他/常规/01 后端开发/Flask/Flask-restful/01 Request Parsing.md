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

如果你想要以列表的形式接受一个键的多个值，则可以传递 `action='append'`

```python
parser.add_argument('name', action='append')
```

这将允许你进行如下查询

```python
curl http://api.example.com -d "name=bob" -d "name=sue" -d "name=joe"
```

And your args will look like this 

```python
args = parser.parse_args()
args["name"] # ["bob", "sue", "joe"]
```

### Argument Location 

By default, the `RequestParser` tries to parse values from `flask.Request.values`, and `flask.Request.json`.

Use the `location` argument to `add_argument()` to specify alternate locations to pull the values from. Any variable on the [`flask.Request`](https://flask.palletsprojects.com/en/2.3.x/api/#flask.Request "(in Flask v2.3.x)") can be used. For example：

```python
# look only in the POST body 
parser.add_argument("name", type=int, location="form")

# look only in the querysrtring 
parser.add_argument("PageSize", type=int, location="args")

# From the request headers 
parser.add_argument("User-Agent", location="args")

# From http cookies
parser.add_argument('session_id', location='cookies')

# From file uploads
parser.add_argument('picture', type=werkzeug.datastructures.FileStorage, location='files')
```

### 多位置参数

RequestParser 允许你从多个位置获取参数，例如请求头，请求体等，我们可以通过将一个列表传递给 location 参数来指定多个位置。

```python
parser.add_argument("text", location=['headers', 'values'])
```

**大小写敏感性**：如果列表中包含 `headers`，参数名称将不再区分大小写，必须与标题大小写（title case）完全匹配。例如，`Content-Type` 和 `content-type` 将被视为不同参数。

**特殊情况**：如果单独指定 `location='headers'`（不作为列表），参数名称仍然保持大小写不敏感。

### 解析器继承 Parser Inheritance 

在开发 RESTful API 时， 你可能会为每个资源 resource 编写不同的解析器。如果这些解析器有共同的参数，可以通过继承来避免重复定义。

```python
from flask_restful import reqparse 

# 父解析器
parser = reqparse.RequestParser()
parser.add_argument('foo', type=int)

# 复制父解析器并扩展
parser_copy = parser.copy()
parser_copy.add_argument('bar', type=int)

# parser_copy 现在包含 'foo' 和 'bar'
```

覆盖参数：可以使用 replace_argument() 方法覆盖父解析器中的参数。

```python
parser_copy.replace_argument('foo', required=True, location='json')
```

移除参数：可以使用 remove_argument() 方法完全移除某个参数。

```python
parser_copy.remove_argument('foo')
```

### 错误处理 Error Handling

RequestParser 默认会在遇到第一个错误时终止解析，并返回错误信息。但有时你可能希望将所有错误信息一次性返回给客户端。

**批量错误处理：**

可以通过以下两种方式启用批量错误处理：

1. **全局配置：**

在 Flask 应用中设置 BUNDLE_ERRORS 配置项为 True ：

```python
from flask import Flask 

app = Flask(__name__)
app.config['BUNDLE_ERRORS'] = True
```

但请注意，这是一个全局设置，会覆盖所有 `RequestParser` 实例中的 `bundle_errors` 选项。

2. **实例配置：**

在创建 RequestParser 时，通过 bundle_errors=True 参数启用批量错误处理：

```python
parser = reqparse.RequestParser(bundle_errors=True)
```

