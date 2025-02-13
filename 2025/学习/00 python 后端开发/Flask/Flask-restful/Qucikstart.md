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

```



