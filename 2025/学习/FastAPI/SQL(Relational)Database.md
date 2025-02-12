SQLModel 是建立在 SQLAlchemy 和 Pydantic 之上的。

```bash
pip install sqlmodel
```

```python
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select


class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    age: int | None = Field(default=None, index=True)
    secret_name: str

# Code below omitted 👇
```

**创建引擎**

SQLModel 引擎（实际上就是 sqlalchemy 引擎）负责保持到数据库的连接。

You would have **one single `engine` object** for all your code to connect to the same database.

```python
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)
```

使用 check_same_thread=False 允许 FastAPI 在不同的线程中使用相同的 SQLite 数据库。这是必要的，y'wei

