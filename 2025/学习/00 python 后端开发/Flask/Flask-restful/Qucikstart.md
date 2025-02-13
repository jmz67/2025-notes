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