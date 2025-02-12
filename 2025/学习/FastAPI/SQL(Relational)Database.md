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

