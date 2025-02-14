```python
from typing import Annotated 

from fastapi import FastAPI, Header 

app = FastAPI()

@app.get("/items/")
async def read_items(user_agent: Annotated[str | None, Header()] = None):
    return {
        "User-Agent": user_agent
    }
```

### 自动转换

Header 比 Path，Query，和 Cookie 提供了更多功能。大部分标准请求体用连字符分隔，也就是减号（-）。但是 user-agent 这样的变量在 python 中是无效的，因此默认情况下，Header 把参数名中的字符由下划线改为了连字符来提取并存档请求头。

同时，HTTP 的请求头不区分大小写，可以使用 python 标准样式（也就是 snake_case）进行声明。因此，可以像在 Python 代码中一样使用 `user_agent` ，无需把首字母大写为 `User_Agent` 等形式。如需禁用下划线自动转换为连字符，可以把 `Header` 的 `convert_underscores` 参数设置为 `False`：

```python
from typing import Annotated

from fastapi import FastAPI, Header

app = FastAPI()


@app.get("/items/")
async def read_items(
    strange_header: Annotated[str | None, Header(convert_underscores=False)] = None,
):
    return {"strange_header": strange_header}
```

警告：注意，使用这个模式的时候要慎重，有些 HTTP 代理和服务器不支持使用带有下划线的请求头。

```
C:\Users\admin\Desktop\NtHealth\wenzhengSystem>curl -X GET http://127.0.0.1:8000/items/ -H "strange_header: test_value_curl"
{"strange_header":"test_value_curl"}
```

## Header 参数模型

如果你有一组相关的 header 参数，你可以创建一个 pydantic 模型来声明它们。这将允许你在多个地方能够重用模型，并且可以一次性声明所有参数的验证和元数据。

### 使用 Pydantic 模型的 Header 参数

```python

```