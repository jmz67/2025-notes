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

Header 比 Path，Query，和 Cookie 提供了更多功能。大部分标准请求体用连字符分隔，也就是减号（-）。但是 user-agent 这样的变量在 python 中是无效的，因此默认情况下，Header 把参数名中的字符由下划线改为了连字符