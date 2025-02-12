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

使用 check_same_thread=False 允许 FastAPI 在不同的线程中使用相同的 SQLite 数据库。这是必要的，因为我们的单个请求大概率会使用多个线程（例如依赖项）。

Don't worry, with the way the code is structured, we'll make sure we use **a single SQL Model _session_ per request** later, this is actually what the `check_same_thread` is trying to achieve.

**创建表**

```python
def create_db_and_tables():
	SQLModel.metadata.create_all(engine)
```

**创建一个会话依赖 session dependency**

一个 Session 将对象存储在内存中，并跟踪数据中所需要的任何更改，然后使用引擎和数据库进行交互。

我们将创建一个 FastAPI 依赖项，它将保证为每个请求提供一个新的 Session 。这确保了我们对每个请求使用单个会话，而减少冲突。

Then we create an `Annotated` dependency `SessionDep` to simplify the rest of the code that will use this dependency.

```python
def get_session():
	with Session(engine) as session:
		yield session

SessionDep = Annotated[Session, Depends(get_session)]
```

**启动时创建数据库表**

