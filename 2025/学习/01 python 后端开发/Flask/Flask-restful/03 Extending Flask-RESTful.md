我们意识到每个人在使用 REST 框架的时候都会有不同的需求。Flask-RESTful 尽可能保持灵活性，但有时您可能会发现内置功能无法满足您的需求。在这种情况下，Flask-RESTful 提供了一些扩展点来帮助您。

### 内容协商 Content Neotiation 

内容协商就像是一个翻译的过程。客户端（比如浏览器或是一个 App）向服务器发送请求，同时告诉服务器它希望接受的数据格式（比如 JSON XML 或 CSV）。服务器根据客户端的要求，返回对应格式的数据。

Flask-RESTful 默认支持 JSON ，那么如何让 Flask-RESTful 支持其他格式呢？

如果开发者需要支持其他格式（比如 CSV 或 XML），可以通过一种叫做“装饰器”的方式来扩展 Flask-RESTful 的功能。装饰器就像是给函数添加一个“外衣”，让它能够做更多的事情。、

```python
@api.representation('application/json')
def output_json(data, code, headers=None):
    resp = make_response(json.dumps(data), code)
    resp.headers.extend(headers or {})
    return resp
```

- **`@api.representation('application/json')`**：这行代码告诉 Flask-RESTful，当客户端请求 JSON 格式的数据时，使用下面的函数来处理。
- **`output_json` 函数**：这个函数的作用是把数据转换成 JSON 格式，并返回给客户端。
    - `data` 是要返回的数据。    
    - `code` 是 HTTP 状态码（比如 200 表示成功，404 表示找不到）。    
    - `headers` 是一些额外的信息，比如告诉客户端数据的类型。

