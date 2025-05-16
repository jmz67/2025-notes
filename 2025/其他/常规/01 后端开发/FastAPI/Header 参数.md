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
from typing import Annotated

from fastapi import FastAPI, Header

from pydantic import BaseModel

app = FastAPI()

class CommonHeaders(BaseModel):
    host: str 
    save_data: bool
    if_modified_since: str | None = None 
    traceparent: str | None = None 
    x_tag: list[str] = []

@app.get("/items/")
async def read_items(headers: Annotated[CommonHeaders, Header()]):
    return headers
```

```
C:\Users\admin\Desktop\NtHealth\wenzhengSystem>curl -X GET http://127.0.0.1:8000/items/ ^
More? -H "Host: example.com" ^
More? -H "Save-Data: true" ^
More? -H "If-Modified-Since: Tue, 25 Jul 2023 10:00:00 GMT" ^
More? -H "Traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00" ^
More? -H "X-Tag: tag1" ^
More? -H "X-Tag: tag2"

{"host":"example.com","save_data":true,"if_modified_since":"Tue, 25 Jul 2023 10:00:00 GMT","traceparent":"00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00","x_tag":["tag1","tag2"]}
```

**FastAPI** 将从请求中接收到的 **headers** 中**提取**出**每个字段**的数据，并提供您定义的 Pydantic 模型。

### 禁止额外的 Headers

在某些特殊的情况下（可能不常见），您可能希望**限制**您想要接收的 headers。

具体是什么情况呢？

**1. 增强安全性 (Security Enhancement)**

- **防止 Header 注入攻击:** 恶意攻击者可能会尝试通过发送未预期的、恶意的 Header 来注入代码或绕过安全检查。 通过明确禁止额外的 Header，您可以**缩小攻击面**，减少潜在的注入风险。例如，攻击者可能尝试发送 `X-Custom-Security-Bypass: true` 这样的 Header 来尝试绕过您的安全策略。如果您禁止额外的 Header，这类尝试就会被直接拒绝。
    
- **强制使用预期的安全 Header:** 在某些安全敏感的应用中，您可能强制要求客户端必须发送特定的安全相关的 Header，例如用于身份验证、授权或防范 CSRF 攻击的 Header。 禁止额外的 Header 可以确保只有您预期的、经过安全审查的 Header 会被接受，从而**提高整体安全性**。
    

**2. API 接口规范和标准化 (API Contract and Standardization)**

- **明确 API 接口契约:** 当您构建一个需要被多个客户端或团队使用的 API 时，明确定义请求的 Header 就变得非常重要。 禁止额外的 Header 可以**强制客户端遵循您的 API 规范**，确保客户端不会发送服务器端无法处理或不期望接收的 Header。这有助于保持 API 接口的**清晰性和一致性**。
    
- **跨系统集成和标准化:** 在大型系统中，不同的服务可能需要相互通信。 通过强制执行 Header 规范，您可以确保不同系统之间的数据交换是**标准化和可预测的**。 这可以减少集成过程中的错误和不兼容性问题。例如，在一个微服务架构中，服务 A 和服务 B 之间可能需要通过特定的 Header 传递上下文信息。 禁止额外的 Header 可以确保这种信息传递的可靠性和规范性。

您可以使用 Pydantic 的模型配置来禁止（ `forbid` ）任何额外（ `extra` ）字段：

