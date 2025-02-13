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

```

