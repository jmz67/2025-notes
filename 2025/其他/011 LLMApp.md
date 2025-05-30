# 00 OpenAI

在这里我们将介绍原生模型接口的使用，和一些被 OpenAI 定义的基础规则。


# 01 Milvus

In this section, we will discuss everything about Milvus.

## 1.1 增删改查
## 1.2 LangChain Milvus

> Milvus 是一个数据库用来存储，索引和管理由深度神经网络和其他机器学习（ML）模型生成的大量嵌入向量。

### Setup

```
%pip install -qU langchain_milvus
```

最新版本的 pymilvus 附带了一个本地矢量数据库 Milvus Lite，非常适合原型制作。如果您有大量的数据，例如超过一百万个文档，我们建议在 docker 或 kubernetes 上设置一个性能更高的 Milvus 服务器。

### Initialization

```python
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# 使用本地模型路径
model_name = "/data4/model/bge-m3"  # 本地模型路径
model_kwargs = {'device': 'npu:7'}
encode_kwargs = {'normalize_embeddings': True}

# langchain_community.embeddings.HuggingFaceBgeEmbeddings 
# 方法可以改造本地嵌入模型以适配 langchain vector_store
hf = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)
```

```python
from langchain.vectorstores.milvus import Milvus

vector_store = Milvus(
    embedding_function=hf,  
    connection_args={"host": "172.16.136.222",
                     "port": "19530",
                     "user": "root",
                     "password": "1234qwer"
                     },
)
```

#### 创建 collection 

```python
from langchain_core.documents import Document

vector_store = Milvus.from_documents(
    [Document(page_content="foo!")],
    hf, # embeddings
    collection_name="langchain_example",
    connection_args={"host": "172.16.136.222",
                    "port": "19530",
                    "user": "root",
                    "password": "1234qwer"
                    },
)
```

虽然说我们没有定义这个 collection 的字段什么的，但是上述代码会自动创建一个 collection 。

![[Pasted image 20241104163731.png]]

下面是我们如何检索已经存储的集合

```python
vector_store_loaded = Milvus(
		hf,
		connection_args = {},
		collection_name = "langchain_example"
)
```


### Manage vector store

#### 添加实体进入 vector store

注意下面的代码不适合在 `auto_id=Ture` 的 Collection 中进行。

```python
from uuid import uuid4

from langchain_core.documents import Document

document_1 = Document(
    page_content="I had chocalate chip pancakes and scrambled eggs for breakfast this morning.",
    metadata={"source": "tweet"},
)

document_2 = Document(
    page_content="The weather forecast for tomorrow is cloudy and overcast, with a high of 62 degrees.",
    metadata={"source": "news"},
)

document_3 = Document(
    page_content="Building an exciting new project with LangChain - come check it out!",
    metadata={"source": "tweet"},
)

document_4 = Document(
    page_content="Robbers broke into the city bank and stole $1 million in cash.",
    metadata={"source": "news"},
)

document_5 = Document(
    page_content="Wow! That was an amazing movie. I can't wait to see it again.",
    metadata={"source": "tweet"},
)

document_6 = Document(
    page_content="Is the new iPhone worth the price? Read this review to find out.",
    metadata={"source": "website"},
)

document_7 = Document(
    page_content="The top 10 soccer players in the world right now.",
    metadata={"source": "website"},
)

document_8 = Document(
    page_content="LangGraph is the best framework for building stateful, agentic applications!",
    metadata={"source": "tweet"},
)

document_9 = Document(
    page_content="The stock market is down 500 points today due to fears of a recession.",
    metadata={"source": "news"},
)

document_10 = Document(
    page_content="I have a bad feeling I am going to get deleted :(",
    metadata={"source": "tweet"},
)

documents = [
    document_1,
    document_2,
    document_3,
    document_4,
    document_5,
    document_6,
    document_7,
    document_8,
    document_9,
    document_10,
]
uuids = [str(uuid4()) for _ in range(len(documents))]

vector_store.add_documents(documents=documents, ids=uuids)
```

#### 删除集合

```python
# 删除集合
from pymilvus import connections, utility, db

# 连接到 Milvus
connections.connect(
    alias="default",
    host="172.16.136.222",
    port="19530",
    user="root",
    password="1234qwer"
)  

utility.drop_collection("langchain_example")
```

#### 删除数据

务必注意一定要是列表和整数

```python
vector_store.delete(ids=[453241765711880108])
```


更多函数请查看官网 API 指南：

[Milvus — 🦜🔗 LangChain documentation](https://python.langchain.com/api_reference/milvus/vectorstores/langchain_milvus.vectorstores.milvus.Milvus.html)

# 02 Langchain
## 02.1 Messages

Messages are the unit of communication in chat models. They are used to represent the  input and output of a chat model, as well as any additional context or metadata that may be associated with a conversation.

Each message has a role and context with additional metadata that varies depending on the chat model provider.

Langchain provides a unified message format that can be used across chat models, allowing users to work with different chat models without worrying about the specific details of the message format used by each model provider.

**What is inside a message?**

A message typically consists of the following pieces of information:

- Role: The role of the message.
- Content: The content of the message
- Additional metadata: id, name, token usage and other model-specific metadata

Roles are used to distinguish between different types of messages in a conversation and help the chat model understand how to respond to a given sequence of messages.

| **Role**      | **Description**                                                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **system**    | Used to tell the chat model how to behave and provide additional context. Not supported by all chat model providers.                                                                                                                         |
| **user**      | Represents input from a user interacting with the model, usually in the form of text or other interactive input.                                                                                                                             |
| **assistant** | Represents a response from the model, which can include text or a request to invoke tools.                                                                                                                                                   |
| **tool**      | A message used to pass the results of a tool invocation back to the model after external data or processing has been retrieved. Used with chat models that support [tool calling](https://python.langchain.com/docs/concepts/tool_calling/). |
### Content

Currently, most chat models support text as the primary content type, with some models also supporting multimodal data. However, support for multimodal data is still limited across most chat model providers.

For more information see:

- [SystemMessage](https://python.langchain.com/docs/concepts/messages/#systemmessage) -- for content which should be passed to direct the conversation
- [HumanMessage](https://python.langchain.com/docs/concepts/messages/#humanmessage) -- for content in the input from the user.
- [AIMessage](https://python.langchain.com/docs/concepts/messages/#aimessage) -- for content in the response from the model.
- [Multimodality](https://python.langchain.com/docs/concepts/multimodality/) -- for more information on multimodal content.

### LangChain Messages

Langchain 提供了一种统一的消息格式，可以跨所有聊天模型使用，允许用户使用不同的聊天模型，而不必要担心每个模型提供者使用的消息格式的具体细节。

Langchain 的消息是来自  [BaseMessage](https://python.langchain.com/api_reference/core/messages/langchain_core.messages.base.BaseMessage.html) 子类（subclass）的Python 对象。

一共有五种消息类型：

- SystemMessage
- HumanMessage
- AIMessage
- AIMessageChunk：和 assistant 角色相关，用于流式响应
- ToolMessage：和 tool 角色有关

其他重要的信息包括：

- RemoveMessage：不和任何角色有关，这是一个抽象的消息，主要用于 LangGraph 中管理聊天记录。[RemoveMessage](https://python.langchain.com/docs/concepts/messages/#removemessage) 
- **Legacy** [FunctionMessage](https://python.langchain.com/docs/concepts/messages/#legacy-functionmessage): corresponds to the **function** role in OpenAI's **legacy** function-calling API.

#### SystemMessage 

A `SystemMessage` is used to prime the behavior of the AI model and provide additional context, such as instructing the model to adopt a specific persona or setting the tone of the conversation.

```python
form langchain_core.messages import HumanMessage

model.invoke([HumanMessage(content='Hello, how are you?')])
```

> 当你使用一个字符作为输入调用聊天模型的时候，LangChain 会自动将这个字符转换为一个 HumanMessage 对象。这常用于快速的测试中：

```python
model.invoke("Hello, how are you?")
```


### OpenAI Format

聊天模型也可以接收 OpenAI 的输入格式

```python
chat_model.invoke(
    {
        "role": "user",
        "content": "Hello, how are you?"
    },
    {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking."
    },
    {
        "role": "user",
        "content": "Can you tell me a joke?"
    }
)
```

目前，模型的输出将使用 Langchain 消息的形式，因此如果输出也需要 OpenAI 格式的话，则需要将输出转换为 OpenAI 格式。

可以使用 `convert_to_openai_messages` 函数 [convert_to_openai_messages](https://python.langchain.com/api_reference/core/messages/langchain_core.messages.utils.convert_to_openai_messages.html)

```python
from langchain_core.messages import (
    convert_to_openai_messages,
    AIMessage,
    SystemMessage,
    ToolMessage,
)

messages = [
    SystemMessage([{"type": "text", "text": "foo"}]),
    {"role": "user", "content": [{"type": "text", "text": "whats in this"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,'/9j/4AAQSk'"}}]},
    AIMessage("", tool_calls=[{"name": "analyze", "args": {"baz": "buz"}, "id": "1", "type": "tool_call"}]),
    ToolMessage("foobar", tool_call_id="1", name="bar"),
    {"role": "assistant", "content": "thats nice"},
]
oai_messages = convert_to_openai_messages(messages)
# -> [
#   {'role': 'system', 'content': 'foo'},
#   {'role': 'user', 'content': [{'type': 'text', 'text': 'whats in this'}, {'type': 'image_url', 'image_url': {'url': "data:image/png;base64,'/9j/4AAQSk'"}}]},
#   {'role': 'assistant', 'tool_calls': [{'type': 'function', 'id': '1','function': {'name': 'analyze', 'arguments': '{"baz": "buz"}'}}], 'content': ''},
#   {'role': 'tool', 'name': 'bar', 'content': 'foobar'},
#   {'role': 'assistant', 'content': 'thats nice'}
# ]
```



## 02.2 Chat model



### 使用 chat model 去调用工具

工具调用允许聊天模型通过调用工具来响应给定的提示。但是请注意，实际上模型不直接执行工具的操作，模式只是生成工具的参数，而实际运行（或不运行）工具取决于用户自己。

工具调用是一种从模型生成结构化输出的通用技术，即使你不打算调用任何工具，也可以使用它。一个非常典型的案例是，**通过工具调用去从非结构化文本中提取文本。**

![[Pasted image 20241105103955.png]]
一个典型的例子：[[011 LLMApp#Build an Extraction Chain|Build a Extraction Chain]]

LangChain 实现了定义工具、将工具传递给 llm 以及表示工具调用的标准接口。本指南将介绍如何将工具绑定到 LLM，然后调用 LLM 来生成这些参数。
#### 定义工具

对于一个能够调用工具的大模型，我们需要传入工具 schemas，这些模式描述了工具的功能和它的参数。支持工具调用特性的聊天模型实现了一个 `bind_tools()` 方法，用于将工具模式传递给模型。

Tool schemas can be passed in as Python functions (with typehints and docstrings), Pydantic models, TypedDict classes, or LangChain [Tool objects](https://python.langchain.com/api_reference/core/tools/langchain_core.tools.BaseTool.html#langchain_core.tools.BaseTool). Subsequent invocations of the model will pass in these tool schemas along with the prompt.

##### Python 函数
我们的工具模式可以是 Python 函数：

```python
# The function name, type hints, and docstring are all part of the tool
# schema that's passed to the model. Defining good, descriptive schemas
# is an extension of prompt engineering and is an important part of
# getting models to perform well.

def add(a: int, b: int) -> int:
    """Add two integers.

    Args:
        a: First integer
        b: Second integer
    """
    return a + b


def multiply(a: int, b: int) -> int:
    """Multiply two integers.

    Args:
        a: First integer
        b: Second integer
    """
    return a * b
```

##### LangChain Tool
LangChain also implements a `@tool` decorator that allows for further control of the tool schema, such as tool names and argument descriptions. See the how-to guide [here](https://python.langchain.com/docs/how_to/custom_tools/#creating-tools-from-functions) for details.

##### TypedDict class

```python
from typing_extensions import Annotated, TypedDict


class add(TypedDict):
    """Add two integers."""

    # Annotations must have the type and can optionally include a default value and description (in that order).
    a: Annotated[int, ..., "First integer"]
    b: Annotated[int, ..., "Second integer"]


class multiply(TypedDict):
    """Multiply two integers."""

    a: Annotated[int, ..., "First integer"]
    b: Annotated[int, ..., "Second integer"]


tools = [add, multiply]
```

要将这些 shcemas 实际绑定到聊天模型，我们将使用 `.bind_tools()` 方法。这样的处理将 `add` 和 `multiply` 的 schemas 转换为了模型可用的格式。这样的工具模式将在每次模式被调用的时候被传递。

```python
llm_with_tools = llm.bind_tools(tools)

query = "what is 3 * 12?"

llm_with_tools.invoke(query)
```

```
AIMessage(
content='', 

additional_kwargs={
	'tool_calls': [{'id': 'call_iXj4DiW1p7WLjTAQMRO0jxMs', 
	'function': {'arguments': '{"a":3,"b":12}', 
				'name': 'multiply'}, 
				'type': 'function'}], 
	'refusal': None
}, 

response_metadata={
	'token_usage': {
		'completion_tokens': 17, 
		'prompt_tokens': 80, 
		'total_tokens': 97}, 
	
	'model_name': 'gpt-4o-mini-2024-07-18', 
	'system_fingerprint': 'fp_483d39d857', 
	'finish_reason': 'tool_calls', 'logprobs': None
}, 

id='run-0b620986-3f62-4df7-9ba3-4595089f9ad4-0', 

tool_calls=[
	{
	'name': 'multiply', 
	'args': {'a': 3, 'b': 12}, 
	'id': 'call_iXj4DiW1p7WLjTAQMRO0jxMs', 
	'type': 'tool_call'
	}
], 

usage_metadata={
	'input_tokens': 80, 
	'output_tokens': 17, 
	'total_tokens': 97
}
)
```

As we can see our LLM generated arguments to a tool! You can look at the docs for [bind_tools()](https://python.langchain.com/api_reference/openai/chat_models/langchain_openai.chat_models.base.BaseChatOpenAI.html#langchain_openai.chat_models.base.BaseChatOpenAI.bind_tools) to learn about all the ways to customize how your LLM selects tools, as well as [this guide on how to force the LLM to call a tool](https://python.langchain.com/docs/how_to/tool_choice/) rather than letting it decide.

#### 工具调用
If tool calls are included in a LLM response, they are attached to the corresponding message or message chunk as a list of tool call objects in the `.tool_calls` attribute.

Note that chat models can call multiple tools at once.

A `ToolCall` is a typed dict that includes a tool name, dict of argument values, and (optionally) an identifier. Messages with no tool calls default to an empty list for this attribute.

```python
query = "what is 3 * 12? Also, what is 11 + 49?"

llm_with_tools.invoke(query).tool_calls
```

```
[{'name': 'multiply',
  'args': {'a': 3, 'b': 12},
  'id': 'call_1fyhJAbJHuKQe6n0PacubGsL',
  'type': 'tool_call'},
 {'name': 'add',
  'args': {'a': 11, 'b': 49},
  'id': 'call_fc2jVkKzwuPWyU7kS9qn1hyG',
  'type': 'tool_call'}]
```

The `.tool_calls` attribute should contain valid tool calls. Note that on occasion, model providers may output malformed tool calls (e.g., arguments that are not valid JSON). When parsing fails in these cases, instances of InvalidToolCall are populated in the `.invalid_tool_calls` attribute. An `InvalidToolCall` can have a name, string argument, identifier, and error message.

**Parsing**
If desired, output parsers can further process the output. For example, we can convert existing values populated on `.tool_calls` to Pydantic objects using the PydanticToolsParser:

```python
from langchain_core.output_parsers import PydanticToolsParser
from pydantic import BaseModel, Field


class add(BaseModel):
    """Add two integers."""

    a: int = Field(..., description="First integer")
    b: int = Field(..., description="Second integer")


class multiply(BaseModel):
    """Multiply two integers."""

    a: int = Field(..., description="First integer")
    b: int = Field(..., description="Second integer")


chain = llm_with_tools | PydanticToolsParser(tools=[add, multiply])
chain.invoke(query)
```

```
[multiply(a=3, b=12), add(a=11, b=49)]
```

### 从模型中返回结构化数据

让模型返回与特定模式匹配的输出通常是有用的。一个常见的用例是从文本中提取数据以插入数据库或和其他下游系统一起使用。本指南将涵盖一些从模型中获得结构化输出的策略。
#### with_structured_output()

这是获得结构化输出的最简单和最可靠的方法。`with_structured_output()` 是为了为结构化输出（如工具/函数调用或 JSON 模式）提供 native api 的模型实现的，并在底层利用了这些功能。所以你得确保你的模型支持这样的功能。

此方法接受 a schema（模式） 作为输入，该模式指定所需输出属性的名称，类型和描述。该方法返回一个类似模型的 Runnable，不同之处在于它的输出不是字符串和消息，而是与给定模式对应的对象。模式可以指定为 TypedDict 类、JSON schema 或 Pydantic 类。如果使用 TypedDict 或 JSON Schema，那么 Runnable 将返回一个字典，如果使用 Pydantic 类，那么将返回一个 Pydantic 对象。

作为一个例子，我们使用模型来生成一个笑话，并将其设置 set up 和笑点分开：

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model='qwen2-7b')
```

**返回 Pydantic class** 

如果我们希望模型返回 Pydantic 对象，我们只需要传入所需的 Pydantic 类。使用 Pydantic 的主要优点是模型生成的输出将被验证。如果缺少任何必需的字段或任何字段的类型错误，Pydantic 将引发错误。

```python
from typing import Optional

from pydantic import BaseModel, Field

class Joke(BaseModel):
    """Joke to tell user."""

    setup: str = Field(description="The setup of the joke")
    punchline: str = Field(description="The punchline to the joke")
    rating: Optional[int] = Field(
        default=None, description="How funny the joke is, from 1 to 10"
    )

structured_llm = llm.with_structured_output(Joke)

structured_llm.invoke("Tell me a joke about cats")
```

> 除了 Pydantic 类的结构之外，Pydantic 类的名称，文档字符串以及参数的名称和提供的描述都非常重要。大多数情况下，`with_structure_output` 使用模型的工具或者是函数去调用 API，我们可以有效的将所有的这些信息添加到模型提示符中。

**TypedDict or JSON Schema**

如果你不想使用 Pydantic ，明确不希望对参数进行验证，或者希望能够流式传输模型的输出，则可以使用 TypedDict 类来定义 Schema。We can optionally use a special `Annotated` syntax supported by LangChain that allows you to specify the default value and description of a field. Note, the default value is _not_ filled in automatically if the model doesn't generate it, it is only used in defining the schema that is passed to the model.

```python
from typing_extensions import Annotated, TypedDict

# TypedDict
class Joke(TypedDict):
    """Joke to tell user."""

    setup: Annotated[str, ..., "The setup of joke"]

    # Alternatively, we could have specified setup as:

    # setup: str                    # no default, no description
    # setup: Annotated[str, ...]    # no default, no description
    # setup: Annotated[str, "foo"]  # default, no description

    punchline: Annotated[str, ..., "The punchline of the joke"]
    rating: Annotated[Optional[int], None, "How funny the joke is, from 1 to 10"]


structured_llm = llm.with_structured_output(Joke)

structured_llm.invoke("Tell me a joke about cats")
```

```
{'setup': 'Why was the cat sitting on the computer?',  
'punchline': 'Because it wanted to keep an eye on the mouse!',  
'rating': 7}
```

**JSON Schema Dict**

```python
json_schema = {
    "title": "joke",
    "description": "Joke to tell user.",
    "type": "object",
    "properties": {
        "setup": {
            "type": "string",
            "description": "The setup of the joke",
        },
        "punchline": {
            "type": "string",
            "description": "The punchline to the joke",
        },
        "rating": {
            "type": "integer",
            "description": "How funny the joke is, from 1 to 10",
            "default": None,
        },
    },
    "required": ["setup", "punchline"],
}
structured_llm = llm.with_structured_output(json_schema)

structured_llm.invoke("Tell me a joke about cats")
```

**从多种模式中选择**

让模型从多个模式中进行选择的最简单方法是创建具有 union 型属性的父模式

```python
from typing import Union


# Pydantic
class Joke(BaseModel):
    """Joke to tell user."""

    setup: str = Field(description="The setup of the joke")
    punchline: str = Field(description="The punchline to the joke")
    rating: Optional[int] = Field(
        default=None, description="How funny the joke is, from 1 to 10"
    )


class ConversationalResponse(BaseModel):
    """Respond in a conversational manner. Be kind and helpful."""

    response: str = Field(description="A conversational response to the user's query")


class FinalResponse(BaseModel):
    final_output: Union[Joke, ConversationalResponse]


structured_llm = llm.with_structured_output(FinalResponse)

structured_llm.invoke("Tell me a joke about cats")
```

```
FinalResponse(final_output=Joke(setup='Why was the cat sitting on the computer?', punchline='Because it wanted to keep an eye on the mouse!', rating=7))
```

**Few-shot prompting**

对于复杂的 schema，在提示符中添加少量的示例是非常有用的。这可以通过几种方式来实现，最简单和最通用的方法是在提示词中添加示例到系统消息中：

```python
from langchain_core.prompts import ChatPromptTemplate

system = """
You are a hilarious comedian. Your specialty is knock-knock jokes. \
Return a joke which has the setup (the response to "Who's there?") and the final punchline (the response to "<setup> who?").

Here are some examples of jokes:

example_user: Tell me a joke about planes
example_assistant: {{"setup": "Why don't planes ever get tired?", "punchline": "Because they have rest wings!", "rating": 2}}

example_user: Tell me another joke about planes
example_assistant: {{"setup": "Cargo", "punchline": "Cargo 'vroom vroom', but planes go 'zoom zoom'!", "rating": 10}}

example_user: Now about caterpillars
example_assistant: {{"setup": "Caterpillar", "punchline": "Caterpillar really slow, but watch me turn into a butterfly and steal the show!", "rating": 5}}
"""

prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{input}")])

few_shot_structured_llm = prompt | structured_llm
few_shot_structured_llm.invoke("what's something funny about woodpeckers")
```

```
{'setup': 'Woodpecker',
 'punchline': "Woodpecker who? Woodpecker who can't find a tree is just a bird with a headache!",
 'rating': 7}
```

#### 直接提示和解析模型输出

不是所有模型都支持 `.with_structured_output()` ，因为并非所有模型都支持工具调用或 JSON 模式。对于这样的模型，您需要直接提示模型使用特定的格式，并使用输出解析器从原始模型输出中提取结构化响应。

**使用 PydanticOutputParser**

下面的示例使用内置的 PydanticOutputParser 来解析提示与给定 Pydantic 模式匹配的聊天模型的输出。注意，我们将 format_instructions 直接添加到解析器方法的提示符中：

```python
from typing import List

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field


class Person(BaseModel):
    """Information about a person."""

    name: str = Field(..., description="The name of the person")
    height_in_meters: float = Field(
        ..., description="The height of the person expressed in meters."
    )


class People(BaseModel):
    """Identifying information about all people in a text."""

    people: List[Person]


# Set up a parser
parser = PydanticOutputParser(pydantic_object=People)

# Prompt
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Answer the user query. Wrap the output in `json` tags\n{format_instructions}",
        ),
        ("human", "{query}"),
    ]
).partial(format_instructions=parser.get_format_instructions())
```

```python
query = "潘辉是26岁且有175cm高。"

chain = prompt | llm | parser

chain.invoke({"query": query})
```

#### Build an Extraction Chain
[Build an Extraction Chain | 🦜️🔗 LangChain](https://python.langchain.com/docs/tutorials/extraction/)

我们需要描述什么样子的信息我们要从中文本中抽取。我们将使用 Pydantic 来定义一个案例 schema 去抽取个人信息。

```python
from typing import Optional

from pydantic import BaseModel, Field

class Person(BaseModel):
    """Infromation about a person."""

    # Doc-string for the entity Person.
    # This doc-string is sent to the LLM as the description of the schema Person,
    # and it can help to improve extraction results.

    # Note that:
    # 1. Each field is an optional -- this allows the model to decline to extract it!
    # 2. Each field has a description -- this description is used by the LLM.
    # Having a good description can help improve extraction results.

    name: Optional[str] = Field(default=None, description="The name of the person.")
    hair_color: Optional[str] = Field(
        default=None, description="The color of the person's hair if known"
    )
    height_in_meters: Optional[str] = Field(
        default=None, description="Height measured in meters"
    )
```

在定义 schema 的时候，有两个最佳的实践：

1. 记录 attributes 和 schema 本身，这些信息将被发送给大模型，用于提高大模型对我们代码的理解，提高信息提取的质量。
2. 不要强迫大模型去编造信息，在上面我们使用 Optional 作为属性，允许在大模型不知道答案的时候输出 `None` 。

```python
from typing import Optional 

from langchain_core.prompts import ChatPromptTempalte, MessagePlaceholder
from pydantic import BaseModel, Field

# Define a custom prompt to provide instructions and any additional context.
# 1. You can add examples into the prompt template to improve extraction quality
# 2. Introduce additional paramters to take context into account (e.g., inculde metadata
# about the document from which the text was extracted.)

prompt = ChatPromptTempalte.from_messages(
    [
        (
            "system",
            "You are an expert extraction algorithm."
            "Only extract relevant information from the text."
            "If you do not konw the value of an attribute asked to extract,"
            "return null for the attribute's value."
        ),
        ("human", "{text}"),
    ]
)
```

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI()

runnable = prompt | llm.with_structured_output(schema=Person)
```

**多个实体**

在很多情况下，我们要处理的不只是单个实体而是多个实体。这可以使用 pydantic 通过将数据模型嵌套在另一个数据模型中轻松实现。

```python
from typing import List, Optional
from pydantic import BaseModel, Field

class Person(BaseModel):
    """Information about a person."""

    name: Optional[str] = Field(default=None, description="The name of the person")
    hair_color: Optional[str] = Field(
        default=None, description="The color of the person's hair if known"
    )
    height_in_meters: Optional[str] = Field(
        default=None, description="Height measured in meters"
    )

class Data(BaseModel):
    """Extracted data about people."""

    # Creates a model so that we can extract multiple entities.
    people: List[Person]
```

>[!attention]
> 这里的提取可能并不完美。后续可以添加 few-shot 来提高回答质量。

```python
runnable = prompt | llm.with_structured_output(schema=Data)

text = "My name is Jeff, my hair is black and i am 6 feet tall. Anna has the same color hair as me."
runnable.invoke({"text": text})
```

```
Data(people=[Person(name='Jeff', hair_color=None, height_in_meters=None), Person(name='Anna', hair_color=None, height_in_meters=None)])
```

#### 如何使用参考样例进行提取

实体提取的质量通常可以通过添加参考样例来改善。

[How to use reference examples when doing extraction | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/extraction_examples/)


#### 如何处理长文本提取

当处理像 PDF 这样的长文本的时候，可能会遇到超出语言模型上下文窗口的文本。要处理这样的文本，我们可以考虑以下几个策略：

1. 换个大模型：换个支持长文本的大模型
2. 蛮力：将文档文块，然后从每个块中提取信息
3. RAG：分块每个块，然后给每个块加索引，然后只从看起来比较相关的块中提取信息

我感觉看长度吧，越长就越用往下的方法。

```python
import re

import requests
from langchain_community.document_loaders import BSHTMLLoader

# Download the content
response = requests.get("https://en.wikipedia.org/wiki/Car")

# Write it to a file
with open("car.html", "w", encoding="utf-8") as f:
    f.write(response.text)

# Load it with an HTML parser
loader = BSHTMLLoader("car.html")
document = loader.load()[0]

# Clean up code
# Replace consecutive new lines with a single new line
document.page_content = re.sub("\n\n+", "\n", document.page_content)
```

[How to handle long text when doing extraction | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/extraction_long_text/)

未完待续


#### 中医质控结构化评估案例

这是我在工作中遇到的一个任务，其恰好需要生成结构化的输出，并将输出保存在新的 json 文件中。话不多说，直接看代码：

```python
import pandas as pd 

from langchain_core.prompts.chat import (
	ChatPromptTemplate,
	SystemMessagePromptTemplate,
)

from langchain_openai.chat_models import ChatOpenAI
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Literal 

class TreatmentValidation(BaseModel):
	is_appropriate: Literal["符合", "不符合"] = Field(description="判断是否符合")

parser = PydanticOutputParser(pydantic_object=TreatmentValidation)

model = ChatOpenAI(
	base_url="http://47.99.172.64:23017/v1",
	api_key="local-key"
)

template = """
请基于上下文：{input} 和规则：{instruction}，判断是否符合。
你必须遵守以下的原则：
1. 请基于中医理论和上下文进行回答。
2. 输出的必须是 不符合 或者是 符合。
3. 不要提供额外的解释或者信息。
{format_instructions}
"""

system_message_prompt = SystemMessagePromptTemplate.from_template(template)

chat_prompt = ChatPromptTemplate.from_messages([system_message_prompt]).partial(format_instructions=parser.get_format_instructions())

prompt_and_model = chat_prompt | model

file_path = f'/data2/workspace_jupyter/raw_data/质控数据全量/01中医病名与证候是否相符.json'

data = pd.read_json(file_path)

result = []

# 遍历读取到数据的每一行
for index, row in data.iterrows():
	input = row['input']
	instruction = row['instruction']

	result = prompt_and_model.invoke({
		"input": input,
		"instruction": instruction,
	})
	print(result)

	results.append(result.content.encode("utf-8").decode("utf-8"))
```

至此我们生成了新的 `<class 'pandas.core.frame.DataFrame'>`

```python
output_file_path = f'/data2/workspace_jupyter/raw_data/质控数据全量/基础模型生成答案/基础模型-症状与中医病名是否相符.json'  
data.to_json(output_file_path, orient='records', lines=False, force_ascii=False, indent=4)
print("Results saved to:", output_file_path)
```

在这里重点说明一下 `to_json` 方法的参数，其实也就是一个重点，记得加 `indent=4` 这会让你的 json 文件具有可读性。

我们再做一下修改，让它可以遍历文件夹中的 json 文件，然后批量输出到新的文件夹中：

```python
import os 
import pandas as pd 

from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate
)

from langchain_openai.chat_models import ChatOpenAI
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Literal

class TreatmentValidation(BaseModel):
    is_appropriate: Literal["符合", "不符合"] = Field(description="判断是否符合")

parser = PydanticOutputParser(pydantic_object=TreatmentValidation)

model = ChatOpenAI(
    base_url="http://172.16.136.144:30005/v1",
    api_key="local-key"
)

template = """
请基于上下文：{input} 和规则：{instruction}，判断是否符合。
你必须遵守以下的原则：
1. 请基于中医理论和上下文进行回答。
2. 输出的必须是 不符合 或者是 符合。
3. 不要提供额外的解释或者信息。
{format_instructions}
"""

system_message_prompt = SystemMessagePromptTemplate.from_template(template)
chat_prompt = ChatPromptTemplate.from_messages([system_message_prompt])

prompt_and_model = chat_prompt | model

# 批量处理文件夹中的所有文件
input_folder = '/data2/workspace_jupyter/raw_data/质控数据全量/'  # 输入文件夹路径
output_folder = '/data2/workspace_jupyter/raw_data/基础模型生成答案/'  # 输出文件夹路径

# 确保输出文件夹存在
os.makedirs(output_folder, exist_ok=True)

# 获取所有 JSON 文件
input_files = [f for f in os.listdir(input_folder) if f.endswith('.json')]

# 批量处理每个文件
for file_name in input_files:
    input_file_path = os.path.join(input_folder, file_name)
    
    # 读取 JSON 文件
    data = pd.read_json(input_file_path)
    
    results = []
    
    for index, row in data.iterrows():
        input = row['input']
        instruction = row['instruction']
        
        # 调用模型获取结果
        result = prompt_and_model.invoke({
            "input": input,
            "instruction": instruction,
            "format_instructions": parser.get_format_instructions(),
        })
        
        # 打印结果（调试）
        print(result.content)
        
        # 解析结果
        parsed_result = parser.parse(result.content)
        
        # 将结果添加到列表
        results.append(parsed_result.is_appropriate.encode("utf-8").decode("utf-8"))
    
    # 将结果添加到 DataFrame 中的新列
    data['base-model-output'] = results

    # 构造输出文件路径
    output_file_path = os.path.join(output_folder, f"基础模型-{file_name}")
    
    # 保存结果为新的 JSON 文件
    data.to_json(output_file_path, orient='records', lines=False, force_ascii=False, indent=4)
    print(f"Results saved to: {output_file_path}")
```

##### 遍历文件夹获取准确率分数

```python
import os
import pandas as pd
import json


# 指定文件夹路径
folder_path = '/data2/workspace_jupyter/raw_data/质控数据全量/训练模型生成答案/'

# 获取文件夹中的所有JSON文件
json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]

import re

# 提取文件名中的数字并按数字顺序排序
def extract_number_from_filename(filename):
    # 使用正则表达式提取文件名中的数字
    match = re.search(r'(\d+)', filename)
    return int(match.group(1)) if match else 0

# 对文件按数字进行排序
json_files.sort(key=extract_number_from_filename)

# 遍历文件夹中的每个JSON文件
for json_file in json_files:
    file_path = os.path.join(folder_path, json_file)
    
    # 读取原始JSON文件
    df = pd.read_json(file_path)
    
    # 计算output和base-model-output值相等的数量
    total_count = len(df)
    matching_count = len(df[df['output'] == df['train-model-output']])
    
    # 计算合规率
    compliance_rate = matching_count / total_count if total_count > 0 else 0
    
    # 输出文件名和合规率
    print(f"文件：{json_file}，合规率：{compliance_rate:.2%}")
```


## Prompt Template
---
Prompt template help to translate user input and parameters into instructions for a language model. This can be used to guide a model's response, helping it understand the context and generate relevant and coherent language-based output.

Prompt Templates take as input a dictionary, where each key represents a variable in the prompt template to fill in.

Prompt template output a **PromptValue**. This PromptValue can be passed to an LLM or ChatModel, and can also be cast to string or list of messages. The reason this PromptValue exists is to make it easy to switch between strings and messages.

There are a few different types of prompt template:

**String Prompt Template**
These prompt template are used to format a single string, and generally are used for simpler inputs. For example, a common way to construct and use a PromptTemplate is as follows:

```python
from langchain_core.prompts import PromptTemplate 

prompt_template = PromptTemplate.from_template("Tell me a joke about {topic}")

prompt_template.invoke({"topic":"cats"})
```

[PromptTemplate — 🦜🔗 LangChain documentation](https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.prompt.PromptTemplate.html#prompttemplate)

If you wanna konw more about PromptTemplate, you can read the doc above. Here we will give some common method that PromptTemplate have. 

A prompt template consists of string template. It accepts a set of paramrters from the user that can be used to generate a prompt for a language model.
The template can be formatted using either f-string (default), jinjia2, or mustache.

We will use f-string. Because we do not konw how to use jinjia2 and mustache.

```python
from langchain_core.prompts import PromptTemplate

# Instantiation using from_template (recommended)
prompt = PromptTemplate.from_template("Say {foo}")
prompt.format(foo="bar")

# Instantiation using initializer
prompt = PromptTemplate(template="Say {foo}")
```



**ChatPromptTemplates**
These prompt templates are used to fromat a list of messages. These templates consist of list of templates themselves. For example, a common way to construct and use a ChatPromptTemplate is as follows:

```python
from langchain_core.prompts import ChatPromptTemplate

prompt_template = ChatPromptTemplate([
    ("system", "you are a helpful assistant"),
    ("user", "tell me a joke about {topic}")
])

prompt_template.invoke({"topic": "cats"})
```

In the above example, this ChatPromptTemplate will construct two meassges when called. The first is a system message, that has no variables to fromat. The second is a HumanMessage, and will be formatted by the topic variable the user passes in.

**MessagesPlaceholder**
This prompt template is responsible for adding a list of messages in a particular place. In the above ChatPromptTemplate, we saw how we could format two messages, each one a string. But what if we wanted the user to pass in a list of messages that we would slot into a particular spot? This is how you use MessagesPlaceholder.

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage

prompt_template = ChatPromptTemplate([
    ("system", "You are a helpful assistant"),
    MessagesPlaceholder('msgs')
])

prompt_template.invoke({'msgs': [HumanMessage(content='hi!')]})
```

```python
prompt_template = ChatPromptTemplate([
    ("system", "You are a helpful assistant"),
    ("placeholder", "{msgs}") # <-- This is the changed part
])
```

### few shot examples
#### How to use few shot examples
Providing the LLM with a few such examples is called few-shotting, and is a simple yet powerful way to guide generation and in some cases drastically improve model performance.

Configure a formatter that will format the few-shot examples into a string. This formatter should be a PromptTemplate object.

```python
from langchain_core.prompts import PromptTemplate

example_prompt = PromptTemplate.from_template("Question: {question}\n{answer}")
```

**Creating the example set**
Next, we'll create a list of few-shot examples. Each example should be a dictionary representing an example input to the formatter prompt we defined above.

```pythpn
examples = [
    {
        "question": "Who lived longer, Muhammad Ali or Alan Turing?",
        "answer": """
Are follow up questions needed here: Yes.
Follow up: How old was Muhammad Ali when he died?
Intermediate answer: Muhammad Ali was 74 years old when he died.
Follow up: How old was Alan Turing when he died?
Intermediate answer: Alan Turing was 41 years old when he died.
So the final answer is: Muhammad Ali
""",
    },
    {
        "question": "When was the founder of craigslist born?",
        "answer": """
Are follow up questions needed here: Yes.
Follow up: Who was the founder of craigslist?
Intermediate answer: Craigslist was founded by Craig Newmark.
Follow up: When was Craig Newmark born?
Intermediate answer: Craig Newmark was born on December 6, 1952.
So the final answer is: December 6, 1952
""",
    },
    {
        "question": "Who was the maternal grandfather of George Washington?",
        "answer": """
Are follow up questions needed here: Yes.
Follow up: Who was the mother of George Washington?
Intermediate answer: The mother of George Washington was Mary Ball Washington.
Follow up: Who was the father of Mary Ball Washington?
Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
So the final answer is: Joseph Ball
""",
    },
    {
        "question": "Are both the directors of Jaws and Casino Royale from the same country?",
        "answer": """
Are follow up questions needed here: Yes.
Follow up: Who is the director of Jaws?
Intermediate Answer: The director of Jaws is Steven Spielberg.
Follow up: Where is Steven Spielberg from?
Intermediate Answer: The United States.
Follow up: Who is the director of Casino Royale?
Intermediate Answer: The director of Casino Royale is Martin Campbell.
Follow up: Where is Martin Campbell from?
Intermediate Answer: New Zealand.
So the final answer is: No
""",
    },
]
```

```python
print(example_prompt.invoke(examples[0]).to_string())
```

```
Question: Who lived longer, Muhammad Ali or Alan Turing?

Are follow up questions needed here: Yes.
Follow up: How old was Muhammad Ali when he died?
Intermediate answer: Muhammad Ali was 74 years old when he died.
Follow up: How old was Alan Turing when he died?
Intermediate answer: Alan Turing was 41 years old when he died.
So the final answer is: Muhammad Ali
```

Finally, create a FewShotPromptTemplate object. This object **takes in the few-shot examples and the formatter for the few-shot examples.** When this FewShotPromptTemplate is formatted, it formats the passed example using the example_prompt, then and adds them to the final prompt before suffix:

```python
from langchain_core.prompts import FewShotPromptTemplate

prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    suffix="Question: {input}",
    input_variables=["input"],
)

print(
    prompt.invoke({"input": "Who was the father of Mary Ball Washington?"}).to_string()
)
```

```
Question: Who lived longer, Muhammad Ali or Alan Turing?

Are follow up questions needed here: Yes.
Follow up: How old was Muhammad Ali when he died?
Intermediate answer: Muhammad Ali was 74 years old when he died.
Follow up: How old was Alan Turing when he died?
Intermediate answer: Alan Turing was 41 years old when he died.
So the final answer is: Muhammad Ali


Question: When was the founder of craigslist born?

Are follow up questions needed here: Yes.
Follow up: Who was the founder of craigslist?
Intermediate answer: Craigslist was founded by Craig Newmark.
Follow up: When was Craig Newmark born?
Intermediate answer: Craig Newmark was born on December 6, 1952.
So the final answer is: December 6, 1952


Question: Who was the maternal grandfather of George Washington?

Are follow up questions needed here: Yes.
Follow up: Who was the mother of George Washington?
Intermediate answer: The mother of George Washington was Mary Ball Washington.
Follow up: Who was the father of Mary Ball Washington?
Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
So the final answer is: Joseph Ball


Question: Are both the directors of Jaws and Casino Royale from the same country?

Are follow up questions needed here: Yes.
Follow up: Who is the director of Jaws?
Intermediate Answer: The director of Jaws is Steven Spielberg.
Follow up: Where is Steven Spielberg from?
Intermediate Answer: The United States.
Follow up: Who is the director of Casino Royale?
Intermediate Answer: The director of Casino Royale is Martin Campbell.
Follow up: Where is Martin Campbell from?
Intermediate Answer: New Zealand.
So the final answer is: No


Question: Who was the father of Mary Ball Washington?
```

**Using an example selector**
We will reuse the example set and the formatter from the previous section. However, instead of feeding the examples directly into the FewShotPromptTemplate object, we will feed them into an implementation of ExampleSelector called SemanticSimilarityExampleSelector instance. This class selects few-shot examples from the initial set based on their similarity to the input. It uses an embedding model to compute the similarity to the input and the few-shot examples, as well as a vector store to perform the nearest neighbor search.

To show what it looks like, let us initialize an instance and call it in isolation:

```python
from langchain_milvus import Milvus
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# 使用本地模型路径
model_name = "/data4/model/bge-m3" 
model_kwargs = {'device': 'npu:7'}
encode_kwargs = {'normalize_embeddings': True}

# langchain_community.embeddings.HuggingFaceBgeEmbeddings 方法可以改造本地嵌入模型以适配 langchain vector_store
hf = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

example_selector = SemanticSimilarityExampleSelector.from_examples(
    # This is the list of examples available ro select from.
    examples,
    hf,
    Milvus,
    # This is the number of examples to produce.
    k=1
)

# Select the most similar example to the input.
question = "Who was the father of Mary Ball Washington?"
selected_examples = example_selector.select_examples({"question": question})

print(f"Examples most similar to the input: {question}")

for example in select_examples:
    print("\n")
    for k, v in example.items():
        print(f"{k}: {v}")
```

```
Examples most similar to the input: Who was the father of Mary Ball Washington?


answer: 
Are follow up questions needed here: Yes.
Follow up: Who was the mother of George Washington?
Intermediate answer: The mother of George Washington was Mary Ball Washington.
Follow up: Who was the father of Mary Ball Washington?
Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
So the final answer is: Joseph Ball

question: Who was the maternal grandfather of George Washington?
```

Now, let us create a FewShotPromptTemplate object. This objext takes in the example selector and the fromatter prompt for the few-shot examples.

```python
prompt = FewShotPromptTemplate(
    example_selector=example_selector,
    example_prompt=example_prompt,
    suffix="Question: {input}",
    input_variables=["input"],
)

print(
    prompt.invoke({"input": "Who was the father of Mary Ball Washington?"}).to_string()
)
```

```
Question: Who was the maternal grandfather of George Washington?

Are follow up questions needed here: Yes.
Follow up: Who was the mother of George Washington?
Intermediate answer: The mother of George Washington was Mary Ball Washington.
Follow up: Who was the father of Mary Ball Washington?
Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
So the final answer is: Joseph Ball


Question: Who was the father of Mary Ball Washington?
```

#### How to use few shot examples in chat models

```python
from langchain_openai import ChatOpenAI

from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate

examples = [
    {"input": "2 🦜 2", "output": "4"},
    {"input": "2 🦜 3", "output": "5"},
]

example_prompt = ChatPromptTemplate.from_messages(
    [
        ("human", "{input}"),
        ("ai", "{output}")
    ]
)

few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples
)

final_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a wondrous wizard of math."),
        few_shot_prompt,
        ("human", "{input}"),
    ]
)

chain = final_prompt | model 

chain.invoke({"input": "What is 2 🦜 9?"})
```

```
AIMessage(content='11', response_metadata={'token_usage': {'completion_tokens': 1, 'prompt_tokens': 60, 'total_tokens': 61}, 'model_name': 'gpt-4o-mini', 'system_fingerprint': None, 'finish_reason': 'stop', 'logprobs': None}, id='run-5ec4e051-262f-408e-ad00-3f2ebeb561c3-0', usage_metadata={'input_tokens': 60, 'output_tokens': 1, 'total_tokens': 61})
```

### How to partially format prompt templates

[How to partially format prompt templates | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/prompts_partial/)

### How to compose prompts together

[How to compose prompts together | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/prompts_composition/)

## 02.3 Memory 

![[Pasted image 20241114223256.png]]


### 02.3.0 QuickStart
LangChain provided easy techniques for adding memory to LLMs. Every memory system in a chain is tasked with two fundamental operations: reading and storing.

It is pivotal to understand that each chain has innate steps that demand particular inputs. While a user provides some of this data, the chain can also source other pieces of information from its memory.

In every operation of the chain, there are two crucial interactions with its memory:

After collecting the initial user data but before executing, the chain retrieves information from its memory, adding to the user's input.

After the chain has completed but before returning the answer, a chain will write the inputs and outputs of the current run to memory so that they can be referred to in future runs.

There are two pivotal choices you will need to make when creating a memory system:

- The method of storing state
- The approach to querying the memory state

#### Preserving the State
Beneach the surface, the foundational memory of generative AI models is structured as a sequence of chat messages. These messages can be stored in temporary in-memory lists or anchored in a more durable database. For those leaning toward long-term storage, there is a wide range of database integration available, streamling the process and saving you from the hassle of manual integration.

With five to six lines of code, you can easily integrate a MongoDBChatMessageHistory that is unique baed on a session_id parameter:

```python
# Provide the connection string to connect to the MongoDB database.
connection_string = "mongodb://mongo_user:password123@mongo:27017"

chat_message_history = MongoDBChatMessageHistory(
    session_id="test_session",
    connection_string=connection_string,
    database_name="my_db",
    collection_name="chat_histories"
)

chat_message_history.add_user_message('i love programming!')
chat_message_history.add_ai_message('what do you like about it?')

chat_message_history.messages 
# [HumanMessage(content='I love programming!!',
 # AIMessage(content='What do you like about it?')]
```

#### Querying the State
A basic memory framwork might merely relay the lastest messages with every interaction. A slightly more nuanced setup might distill a crisp synopsis of the last set of messages. An even more advanced setup would discern specific entities from dialogue and relay only data about those entities highlighted in the ongoing session.

Different applications require varying demands on memory querying. LangChain’s memory toolkit will help you to create simplistic memory infrastructures while empowering you to architect bespoke systems when necessary.

### 02.3.1 ConversationBufferMemory
---
There are various types of memory within LangChain, and one of the most popular is ConversationBufferMemory. This allows you to store multiple chat messages with no restriction on chat history size.

Start by importing ConversationBufferMemory, and you can then add context with the save_context function. The `load_memory_variables` function returns a Python dictionary containing the Human and AI messages:

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory()
memory.save_context({'input': "hi"}, {'output': 'whats up'})
memory.load_memory_variables({})
# {'history': 'Human: hi\nAI: whats up'}
```

You can also return the Langchain schema messages, i.e., SystemMessage, AIMessage or HumanMessage, by adding `return_messages=True` to `ConversationBufferMemory`:

```python
memory = ConversationBufferMemory(return_messages=True)
memory.save_context({'input': "hi"}, {'output': 'whats up'})
memory.load_memory_variables({})

# {'history': [HumanMessage(content='hi'),
# AIMessage(content='whats up')]}
```

Let us add memory directly to a chain in LCEL:

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai.chat_models import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from operator import itemgetter

# Initialize memory to store conversation history
memory = ConversationBufferMemory(return_messages=True)

# Initialize the language model
model = ChatOpenAI(temperature=0)

# Define the prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "Act as a chatbot that helps users with their queries."),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

# Construct the chain
chain = (
    {
        "input": lambda x: x["input"],  # Extract the user input
        "history": RunnableLambda(memory.load_memory_variables) | itemgetter("history"),  # Load conversation history
    }
    | prompt  # Format the prompt
    | model  # Generate a response using the model
    | StrOutputParser()  # Parse the response into a string
)
```

Notice the `MessagePlaceholder` has a `variable_name` of history. This is aligned with the memory key within ConversationBufferMemory, allowing the previous chat history to be directly formatted into the ChatPromptTemplate.

After setting up the LCEL chain, let us invoke it and save the messages to the memory variable:

```python
inputs = {"input": "Hi my name is James!"}
result = chain.invoke(inputs)
memory.save_context(inputs, {'output': result})
print(memory.load_memory_variable({}))

# {'history': [HumanMessage(content='Hi my name is James!'),
# AIMessage(content='Hello James! How can I assist you today?')]}
```

The memory has two messages, a HumanMessage and an AIMessage; both are saved to memory by using the save_context function. Let’s test whether the LCEL chain is able to use previous context to answer new questions:

```python
inputs = {"input": "What is my name?"} 
second_result = chain.invoke(inputs) 
print(second_result) 
# Your name is James.
```

### How to add chat history

In a conversational RAG application, queries issued to the retriever should be informed by the context of the conversation. LangChain provides a `create_history_aware_retriever` constructor to simplify this. It constructs a chain that accepts keys `input` and `chat_history` as input, and has the same output schema as a retriever. `create_history_aware_retriever` requires as inputs:

1. LLM
2. Retriever
3. Prompt

For the retriever we will use WebBaseLoader to load the content of a web page. Here we instantiate a `InMemoryVectorStore` vectorstore and then use its `.as_retriever` method to build a retriever that can be incorporated into LCEL chains.

```python
import bs4
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

loader = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )
    ),
)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)
vectorstore = InMemoryVectorStore(embedding=OpenAIEmbeddings())
vectorstore.add_documents(splits)
retriever = vectorstore.as_retriever()
```

```python
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder

contextualize_q_system_prompt = (
    "Given a chat history and the latest user question "
    "which might reference context in the chat history, "
    "formulate a standalone question which can be understood "
    "without the chat history. Do NOT answer the question, "
    "just reformulate it if needed and otherwise return it as is."
)

contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)
```

We can then instantiate the history-aware retriever:

```python
history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)
```

This chain prepends a rephrasing of the input query to our retriever, so that the retrieval incorcorates the context of the conversation.

Now we can build our full QA chain.

As in the [RAG tutorial](https://python.langchain.com/docs/tutorials/rag/), we will use [create_stuff_documents_chain](https://python.langchain.com/api_reference/langchain/chains/langchain.chains.combine_documents.stuff.create_stuff_documents_chain.html) to generate a `question_answer_chain`, with input keys `context`, `chat_history`, and `input`-- it accepts the retrieved context alongside the conversation history and query to generate an answer.

We build our final `rag_chain` with [create_retrieval_chain](https://python.langchain.com/api_reference/langchain/chains/langchain.chains.retrieval.create_retrieval_chain.html). This chain applies the `history_aware_retriever` and `question_answer_chain` in sequence, retaining intermediate outputs such as the retrieved context for convenience. It has input keys `input` and `chat_history`, and includes `input`, `chat_history`, `context`, and `answer` in its output.

```python
system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer "
    "the question. If you don't know the answer, say that you "
    "don't know. Use three sentences maximum and keep the "
    "answer concise."
    "\n\n"
    "{context}"
)
qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
```

#### Stateful Management of chat history
---
We have added application logic for incorporating chat history, but we are still manually plumbing it through our application. In production, the QA application we usually persist the chat history into a database, and be able to read and update it appropriately.

[LangGraph](https://langchain-ai.github.io/langgraph/) implements a built-in [persistence layer](https://langchain-ai.github.io/langgraph/concepts/persistence/), making it ideal for chat applications that support multiple conversational turns.

Wrapping our chat model in a minimal LangGraph application allows us to automatically persist the message history, simplifying the development of multiturn application.

```python
from typing import Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict




```



## 02.4 LCEL
[LangChain Expression Language (LCEL) | 🦜️🔗 LangChain](https://python.langchain.com/docs/concepts/lcel/)


### How to add default invocation args to a Runnable

Sometimes we wanna invoke a Runnable within a RunnableSequence with constant arguments that are not part of the output of the preceding Runnable in the sequence, and which are not part of user input. We can use the `Runnable.bind()` method to set these arguments ahead of time.

**Binding stop sequences**

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Write out the following equation using algebraic symbols then solve it. Use the format\n\nEQUATION:...\nSOLUTION:...\n\n",
        ),
        ("human", "{equation_statement}"),
    ]
)

model = ChatOpenAI(temperature=0)

runnable = (
    {"equation_statement": RunnablePassthrough()} | prompt | model | StrOutputParser()
)

print(runnable.invoke("x raised to the third plus seven equals 12"))
```

```
EQUATION: x^3 + 7 = 12

SOLUTION: 
Subtract 7 from both sides:
x^3 = 5

Take the cube root of both sides:
x = ∛5
```

and want to call the model with certain stop words so that we shorten the output as is useful in certain types of prompting techniques. While we can pass some arguments into the constructor, other runtime args use `.bind()` as follows:

```python
runnable = (
    {"equation_statement": RunnablePassthrough()}
    | prompt
    | model.bind(stop="SOLUTION")
    | StrOutputParser()
)

print(runnable.invoke("x raised to the third plus seven equals 12"))
```

```
EQUATION: x^3 + 7 = 12
```

You now know how to bind runtime arguments to a Runnable.

### How to configure runtime chain internals
[How to configure runtime chain internals | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/configure/)

Sometimes you may wanna experiment with, or even expose to the end user, multiple different ways of doing things within your chains. This can include tweaking parameters such as temperature or even swapping out one model for another. In order to make this experience as easy as possible, we have defined two methods.

1. configurable_fields
This lets you configure particular fields of a runnable. This is related to the `.bind` method on runnables, but allows you to specify parameters for given step in a chain at runtime rather than specifying them beforehand.
2. configurable_alternatives
 With this method, you can list out alternatives for any particular runnable that can be set during runtime, and swap them for those specified alternatives.



## Tools

Langchain 工具包含对工具的描述以及要调用的函数的实现。

### 创建工具

在构建 agent 的时候，我们需要提供可以使用的工具列表。除了实际调用的工具之外，工具由以下几个组件组成：

- name str 不同的工具必须是不同的名字
- description str 描述工具是用来干啥的，作为大模型或者智能体的上下文
- args_schema pydantic.BaseModel 可选但是推荐，如果使用回调器那就是必须的。它可以用来提供更多信息，例如 few-shot 例子，或者是 validation for expected parameters.
- return_direct boolen 只和智能体有关，当为 True 时，在调用给定的工具之后，智能体将停止并将结果直接返回给用户。

Langchain 支持从以下方式创建工具：

1. 函数
2. Langchain Runnable
3. 通过 BaseTool 子类化，这是最灵活的方法，它提供了最大程度的控制，但代价是更多的工作和代码。

对于大部分用例来说，从函数创建工具就足够了，并且可以通过一个简单的 `@tool` 装饰器。如果需要更多配置，例如同步和异步的实现，也可以使用 `StructureTool.from_function` 类的方法。

当然我们都会说明。

#### 从函数创建工具

**@tool decorator**

这个装饰器是定义自定义工具的最简单的方法。装饰器默认使用函数名作为工具名，但可以传递一个字符串作为第一个参数来覆盖这一点。另外，装饰器将使用函数的文档字符串作为工具的描述，所以必须提供一个文档字符串。

```python
from langchain_core.tools import tool

@tool 
def multiply(a: int, b: int) -> int:
    """Multiply two numbers."""
    return a * b

print(multiply.name)
print(multiply.description)
print(multiply.args)
```

```
multiply
Multiply two numbers.
{'a': {'title': 'A', 'type': 'integer'}, 'b': {'title': 'B', 'type': 'integer'}}
```

```python
from langchain_core.tools import tool

@tool
async def amultiply(a: int, b: int) -> int:
    """Multiply two numbers."""
    return a * b
```

[How to create tools | 🦜️🔗 LangChain](https://python.langchain.com/docs/how_to/custom_tools/)

### How to pass tool outputs to chat models

Some model are capable of tool calling generating arguments that conform to a specific user-provided schema. This guide will demonstrate how to use those tool calls to actually call a function and properly pass the results back to the model.

![[Pasted image 20241112154947.png]]
![[Pasted image 20241112154952.png]]

```python
from langchain_core.tools import tool 

@tool 
def add(a: int, b: int) -> int:
    """Add a and b."""
    return a + b 

@tool 
def multiply(a: int, b: int) -> int:
    """Multiplies a and b."""
    return a * b 

tools = [add, multiply]

llm_with_tools = llm.bind_tools(tool)
```

Now let us get the model to call a tool. We will add it to a list of messages that we will treat as conversation history:

```python
from langchain_core.messages import HumanMessage

query = "What is 3 * 12? Also, What is 11 + 49?"

messages = [HumanMessage(query)]

ai_msg = llm_with_tools.invoke(messages)

print(ai_msg.tool_calls)

messages.append(ai_msg)
```

```
[{'name': 'multiply', 'args': {'a': 3, 'b': 12}, 
'id': 'call_GPGPE943GORirhIAYnWv00rK', 'type': 'tool_call'}, 
{'name': 'add', 'args': {'a': 11, 'b': 49}, 
'id': 'call_dm8o64ZrY3WFZHAvCh1bEJ6i', 'type': 'tool_call'}]
```

Next let us invoke the tool functions using the args the model populated!

Conveniently, if we invoke a Langchain tool with a toolcall, we will automatically get back a ToolMessage that can be fed back to the model:

```python
for tool_call in ai_msg.tool_calls:
    selected_tool = {"add": add, "multiply": multiply}[tool_call["name"].lower()]
    tool_msg = selected_tool.invoke(tool_call)
    messages.append(tool_msg)

messages
```

```
[

HumanMessage(content='What is 3 * 12? Also, what is 11 + 49?'),

AIMessage(content='', additional_kwargs={'tool_calls': [{'id': 'call_loT2pliJwJe3p7nkgXYF48A1', 'function': {'arguments': '{"a": 3, "b": 12}', 'name': 'multiply'}, 'type': 'function'}, {'id': 'call_bG9tYZCXOeYDZf3W46TceoV4', 'function': {'arguments': '{"a": 11, "b": 49}', 'name': 'add'}, 'type': 'function'}]}, response_metadata={'token_usage': {'completion_tokens': 50, 'prompt_tokens': 87, 'total_tokens': 137}, 'model_name': 'gpt-4o-mini-2024-07-18', 'system_fingerprint': 'fp_661538dc1f', 'finish_reason': 'tool_calls', 'logprobs': None}, id='run-e3db3c46-bf9e-478e-abc1-dc9a264f4afe-0', tool_calls=[{'name': 'multiply', 'args': {'a': 3, 'b': 12}, 'id': 'call_loT2pliJwJe3p7nkgXYF48A1', 'type': 'tool_call'}, {'name': 'add', 'args': {'a': 11, 'b': 49}, 'id': 'call_bG9tYZCXOeYDZf3W46TceoV4', 'type': 'tool_call'}], usage_metadata={'input_tokens': 87, 'output_tokens': 50, 'total_tokens': 137}),
 
ToolMessage(content='36', name='multiply', tool_call_id='call_loT2pliJwJe3p7nkgXYF48A1'),

ToolMessage(content='60', name='add', tool_call_id='call_bG9tYZCXOeYDZf3W46TceoV4')

]
```

```python
llm_with_tools.invoke(messages)
```

```python
AIMessage(content='The result of \\(3 \\times 12\\) is 36, and the result of \\(11 + 49\\) is 60.', response_metadata={'token_usage': {'completion_tokens': 31, 'prompt_tokens': 153, 'total_tokens': 184}, 'model_name': 'gpt-4o-mini-2024-07-18', 'system_fingerprint': 'fp_661538dc1f', 'finish_reason': 'stop', 'logprobs': None}, id='run-87d1ef0a-1223-4bb3-9310-7b591789323d-0', usage_metadata={'input_tokens': 153, 'output_tokens': 31, 'total_tokens': 184})
```

Note that each `ToolMessage` must include a `tool_call_id` that matches an `id` in the original tool calls that the model generates. This helps the model match tool responses with tool calls.

### How to add a human-in-the-loop for tools
There are certain tools that we donnot trust a model to execute on its own. One thing we can do in such situation is require human approval before the tool is invoked.

We recommend using `langgraph` for powering such a capability. 

Let us create a few simple tools and a tool-calling chain first.

```python

```


## Output Parser

推荐使用工具或者函数调用而不是输出解析器。

输出解析器负责接受模型的输出，并将其转换为更适合下游任务的格式。在使用llm生成结构化数据，或对聊天模型和 llm 的输出进行规范化时非常有用。



## Retrievers 检索器

![[Pasted image 20241104215917.png]]
现在我们有许多不同类型的检索系统，包括向量库，图数据库和关系数据库。随着大语言模型的兴起，检索系统已经成为了人工智能应用比如说 RAG 的重要组成部分。由于其重要性和可变性，LangChain 为不同类型的检索系统交互提供了统一的接口。
这样的接口实际上很简单：
- 输入：query 查询（字符串）
- 输出：A list of documents (standardized LangChain [Document](https://api.python.langchain.com/en/latest/documents/langchain_core.documents.base.Document.html) objects)

对检索器的唯一要求是能够接受查询并返回文档。特别的是，LangChain 的检索器只需要实现 `_get_relevance_documents` 方法，这个方法接受一个 `query: str` 并返回和查询最相关的 Document 对象列表。用于获取相关文档的底层逻辑由检索器指定，可以是对应用最有用的任何逻辑。
LangChain 检索器是一个 [runnable](https://python.langchain.com/docs/how_to/lcel_cheatsheet/) ，这是一个 LangChain 的标准接口。它意味着它有一些常用方法如 `invoke` 用于与之交互。检索器可以通过 query 调用：
```python
docs = retriever.invoke(query)
```

检索器会返回 一列 Document 列表，其有两个属性：
- page_content：文档的内容，也就是一个字符串
- metadata：与此文档相关的任意元数据，比如，文档 id ，文件名，源等等

### 常用的检索器

#### 搜索 API
需要注意的是，检索器并不需要实际存储文档。例如我们可以在简单返回搜索结果的搜索 API 之上构建检索器。
See our retriever integrations with [Amazon Kendra](https://python.langchain.com/docs/integrations/retrievers/amazon_kendra_retriever/) or [Wikipedia Search](https://python.langchain.com/docs/integrations/retrievers/wikipedia/).

#### 关系数据库或图形数据库

#### 词汇搜索

#### 向量存储 vector store

向量存储是一种强大而有效的索引和检索非结构化数据的方法。通过 `as_retriver()` 方法，可以将 vectorstore 作为检索器。

```python
vectorstore = MyVectorStore()
retriver = vectorstore.as_retriver()
```

### 先进的检索模型
#### 集成检索

由于检索器接口非常简单，只返回给定搜索查询的 Document 对象列表，因此可以使用集成来组合多个检索器。当您有多个擅长查找不同类型相关文档的检索器时，这尤其有用。创建一个集合检索器是很容易的，它将多个检索器与线性加权分数结合起来：

```python
# Initialize the ensemble retriever  
ensemble_retriever = EnsembleRetriever(  
	retrievers=[bm25_retriever, vector_store_retriever], weights=[0.5, 0.5]  
)
```

在集成的时候，我们如何组合来自多个检索器的搜索结果？这激发了重新排序的概念，它采用多个检索器的输出，并使用更复杂的算法 [sigir_main.dvi](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) （倒数秩融合 RRF）将它们组合起来。


## Document loaders

## Text splitters

## 02.10 Agent

### 02.01 Build an Agent with AgentExecutor (Legacy)

This section will cover building with the legacy LangChain AgentExecutor. These are fine for getting started, but past a certain point, you will likely want flexibility and control that they do not offer. For working with more advanced agents, we'd recommend checking out LangGraph Agents or the migration guide.

By themselves, language models can not take actions-they just output text. A big use case for LangChain is creating agents. Agents are systems that use an LLM as reasoning engine to determine which actions to take and what the inputs to those actions should be. The results of those actions can then be fed back into the agent and it determines whether more actions are needed, or whether it is okay to finish.

In this  tutorial, we will build an agent that can interact with multiple different tools: one being a local database, the other being a search engine. You will be able to ask this agent questions, watch it call tools, and have conversations with it.

```
export TAVILY_API_KEY='...'
```

```python
from langchain_community.tools.tavily_search import TavilySearchResults
```

```python
search = TavilySearchResults(max_results=2)
```

```python
search.invoke("what is the weather in SF")
```

```
[{'url': 'https://www.weatherapi.com/',
  'content': "{'location': {'name': 'San Francisco', 'region': 'California', 'country': 'United States of America', 'lat': 37.78, 'lon': -122.42, 'tz_id': 'America/Los_Angeles', 'localtime_epoch': 1714000492, 'localtime': '2024-04-24 16:14'}, 'current': {'last_updated_epoch': 1713999600, 'last_updated': '2024-04-24 16:00', 'temp_c': 15.6, 'temp_f': 60.1, 'is_day': 1, 'condition': {'text': 'Overcast', 'icon': '//cdn.weatherapi.com/weather/64x64/day/122.png', 'code': 1009}, 'wind_mph': 10.5, 'wind_kph': 16.9, 'wind_degree': 330, 'wind_dir': 'NNW', 'pressure_mb': 1018.0, 'pressure_in': 30.06, 'precip_mm': 0.0, 'precip_in': 0.0, 'humidity': 72, 'cloud': 100, 'feelslike_c': 15.6, 'feelslike_f': 60.1, 'vis_km': 16.0, 'vis_miles': 9.0, 'uv': 5.0, 'gust_mph': 14.8, 'gust_kph': 23.8}}"},
 {'url': 'https://www.weathertab.com/en/c/e/04/united-states/california/san-francisco/',
  'content': 'San Francisco Weather Forecast for Apr 2024 - Risk of Rain Graph. Rain Risk Graph: Monthly Overview. Bar heights indicate rain risk percentages. Yellow bars mark low-risk days, while black and grey bars signal higher risks. Grey-yellow bars act as buffers, advising to keep at least one day clear from the riskier grey and black days, guiding ...'}]
```

We will also create a retriever over some data of our own.

```python
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import FATSS
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

loader = WebBaseLoader("https://docs.smith.langchain.com/overview")

docs = loader.load()
documents = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200
).split_documents(docs)

vector = FATSS.from_documents(documents, OpenAIEmbeddings)
retriever = vector.as_retriever()
```

```python
retriever.invoke("how to upload a dataset")[0]
```

```
Document(
page_content=
'# The data to predict and grade over    evaluators=[exact_match], # The evaluators to score the results    experiment_prefix="sample-experiment", # The name of the experiment    metadata={      "version": "1.0.0",      "revision_id": "beta"    },)import { Client, Run, Example } from \'langsmith\';import { runOnDataset } from \'langchain/smith\';import { EvaluationResult } from \'langsmith/evaluation\';const client = new Client();// Define dataset: these are your test casesconst datasetName = "Sample Dataset";const dataset = await client.createDataset(datasetName, {    description: "A sample dataset in LangSmith."});await client.createExamples({    inputs: [        { postfix: "to LangSmith" },        { postfix: "to Evaluations in LangSmith" },    ],    outputs: [        { output: "Welcome to LangSmith" },        { 
output: "Welcome to Evaluations in LangSmith" },    ],    datasetId: dataset.id,});// Define your evaluatorconst exactMatch = async ({ run, example }: { run: Run; example?:', 

metadata={
	'source': 'https://docs.smith.langchain.com/overview', 
	'title': 'Getting started with LangSmith | \uf8ffü¶úÔ∏è\uf8ffüõ†Ô∏è LangSmith', 
	'description': 'Introduction', 'language': 'en'
	}
)
```

Now that we have populated our index that we will do doing retrieval over, we can easily turn it into a tool (the format needed for an agent to properly use it)

```python
from langchain.tools.retriever import create_retriever_tool

retriever_tool = create_retriever_tool(
    retriever,
    "langsmith_search",
    "Search for information about LangSmith. For any questions about LangSmith, you must use this tool!"
)
```

Now that we have created both, we can create a list of tools that we will use downstream.

```python
tools = [search, retriever_tool]
```

Next let us how to use a language model by to call tools. LangChain supports many different language models that you can use interchangably-select the one you want to use below!

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    base_url="http://47.99.172.64:23017/v1",
    api_key="local-key"
)

from langchain_core.messages import HumanMessage

response = model.invoke([HumanMessage(content='hi!')])
response.content
```

```
'Hello! How can I assist you today?'
```

```python
model_with_tools = model.bind_tools(tools)
```

We can now call the model. Let us first call it with normal message, and see how it responds. We can look at both the `content` field as well as the `tool_calls` field.

```python
response = model_with_tools.invoke([HumanMessage(content='Hi!')])
print(f'ContentString: {response.content}')
print(f'ToolCalls: {response.tool_calls}')
```

```
ContentString: Hello! How can I assist you today?
ToolCalls: []
```

Now let us try calling it with some input that would expect a tool to be called.

```python
response = model_with_tools.invoke([HumanMessage(content="What's the weather in SF?")])

print(f"ContentString: {response.content}")
print(f"ToolCalls: {response.tool_calls}")
```

```
ContentString: 
ToolCalls: [{'name': 'tavily_search_results_json', 'args': {'query': 'current weather in San Francisco'}, 'id': 'call_4HteVahXkRAkWjp6dGXryKZX'}]
```

We can see that there's now no content, but there is a tool call! It wants us to call the Tavily Search tool.

This isn't calling that tool yet - it's just telling us to. In order to actually calll it, we'll want to create our agent.

**create the agent**

```python
from langchain import hub

prompt = hub.pull('hwchase17/openai-functions-agent')
prompt.messages
```

```
[
	SystemMessagePromptTemplate(
	prompt=PromptTemplate(input_variables=[], template='You are a helpful assistant')
	),
	
	MessagesPlaceholder(variable_name='chat_history', optional=True),
	
	HumanMessagePromptTemplate(
	prompt=PromptTemplate(input_variables=['input'], template='{input}')
	),
	
	MessagesPlaceholder(variable_name='agent_scratchpad')
]
```

```python
from langchain.agents import create_tool_calling_agent

agent = create_tool_calling_agent(model, tools, prompt)
```

```python
from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(agent=agent, tools=tools)
```

**Run the agent**

We can now run the agent on a few queries! Note that for now, these are all stateless queries (it will not remeber previous interactions).

First up, let us how it responds when there is no need to call a tool:

```python
agent_executor.invoke({'input': 'hi!'})
```

```
{'input': 'hi!', 'output': 'Hello! How can I assist you today?'}
```

In order to see exactly what is happening under the hood (and make sure it is not calling a tool) we can take a look at the [LangSmith trace](https://smith.langchain.com/public/8441812b-94ce-4832-93ec-e1114214553a/r)

Let us try it out on an example where it should be invoking the retriever

```python
agent_executor.invoke({"input": "how can langsmith help with testing?"})
```

```
{
'input': 'how can langsmith help with testing?',
'output': 'LangSmith is a platform that aids in building production-grade Language Learning Model (LLM) applications. It can assist with testing in several ways:\n\n1. **Monitoring and Evaluation**: LangSmith allows close monitoring and evaluation of your application. This helps you to ensure the quality of your application and deploy it with confidence.\n\n2. **Tracing**: LangSmith has tracing capabilities that can be beneficial for debugging and understanding the behavior of your application.\n\n3. **Evaluation Capabilities**: LangSmith has built-in tools for evaluating the performance of your LLM. \n\n4. **Prompt Hub**: This is a prompt management tool built into LangSmith that can help in testing different prompts and their responses.\n\nPlease note that to use LangSmith, you would need to install it and create an API key. The platform offers Python and Typescript SDKs for utilization. It works independently and does not require the use of LangChain.'
}
```

```python
agent_executor.invoke({"input": "whats the weather in sf?"})
```

```
{'input': 'whats the weather in sf?',
 'output': 'The current weather in San Francisco is partly cloudy with a temperature of 16.1°C (61.0°F). The wind is coming from the WNW at a speed of 10.5 mph. The humidity is at 67%. [source](https://www.weatherapi.com/)'}
```

**Adding in memory**

As mentioned earlier, this agent is stateless. This means it does not remember previous interactions. To give it memory we need to pass in previous `chat_history`. 

Note: it needs to be called `chat_history` because of the prompt we are using. If we use a different prompt, we could change the variable name

```python
# Here we pass in an empty list of messages for chat_history because it is the first message in the chat
agent_executor.invoke({"input": "hi! my name is bob", "chat_history": []})
```

```
{'input': 'hi! my name is bob',
 'chat_history': [],
 'output': 'Hello Bob! How can I assist you today?'}
```

```python
from langchain_core.messages import AIMessage, HumanMessage
```

```python
agent_executor.invoke(
    {
        "chat_history": [
            HumanMessage(content="hi! my name is bob"),
            AIMessage(content="Hello Bob! How can I assist you today?"),
        ],
        "input": "what's my name?",
    }
)
```

```python
{'chat_history': [HumanMessage(content='hi! my name is bob'),
  AIMessage(content='Hello Bob! How can I assist you today?')],
 'input': "what's my name?",
 'output': 'Your name is Bob. How can I assist you further?'}
```

If we want to keep track of these messages **automatically**, we can wrap this in a RunnableWithMessageHistory.

```python
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]
```

Because we have multiple inputs, we need to specify two things:

- `input_messages_key` : The input key to use to add to the conversation history.
- `history_messages_key` : The key to add the loaded messages into.

```python
agent_with_chat_history = RunnableWithMessageHistory(
    agent_executor,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
)
```

```python
agent_with_chat_history.invoke(
    {"input": "hi! I'm bob"},
    config={"configurable": {"session_id": "<foo>"}},
)
```

```python
{'input': "hi! I'm bob",
 'chat_history': [],
 'output': 'Hello Bob! How can I assist you today?'}
```

```python
agent_with_chat_history.invoke(
    {"input": "what's my name?"},
    config={"configurable": {"session_id": "<foo>"}},
)
```

```python
{
 'input': "what's my name?",
 
 'chat_history': [HumanMessage(content="hi! I'm bob"),
  AIMessage(content='Hello Bob! How can I assist you today?')],
 
 'output': 'Your name is Bob.'
}
```

## Tavily Search

```python
%pip install -qU "langchain-community>=0.2.11" tavily-python -i https://pypi.tuna.tsinghua.edu.cn/simple
```

```python
import os

os.environ["TAVILY_API_KEY"] = "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"
```

```python
import os

# Check if the TAVILY_API_KEY is set
api_key = os.environ.get("TAVILY_API_KEY")

if api_key:
    print("TAVILY_API_KEY is set!")
else:
    print("TAVILY_API_KEY is not set.")
```


[Using LangChain to Create a Powerful Question & Answering Tool | by Jonathan Papir | papir805 | Medium](https://medium.com/papir805/using-langchain-to-create-a-powerful-question-answering-tool-9250f703951b)


## 实例

### 数据库操作

#### 建立一个基于 SQL 数据的问答系统

允许 LLM 系统查询结构化数据与非结构化文本数据在性质上是不同的。在后者中，通常生成可针对矢量数据库进行搜索的文本，而对于结构化数据，LLM 的方法通常是在 DSL（如SQL）中编写和执行查询。在本指南中，我们将介绍在数据库中的表格数据上创建问答系统的基本方法。我们将介绍使用链和代理的实现。这些系统将允许我们对数据库中的数据提出问题，并得到自然语言的答案。

这两者的主要区别在于，我们的智能体可以尽它想要多的次数去在数据库中循环地进行查询。

**安全警告**

Building Q&A systems of SQL databases requires executing model-generated SQL queries. There are inherent risks in doing this. Make sure that your database connection permissions are always scoped as narrowly as possible for your chain/agent's needs. This will mitigate though not eliminate the risks of building a model-driven system. For more on general security best practices, [see here](https://python.langchain.com/docs/security/).

##### 项目结构

从高处俯瞰整个项目，大概分为这么三个步骤：

1. 将问题转换为 SQL 查询
2. 执行 SQL 查询
3. 结合 SQL 查询的结果利用大模型进行回复

![[Pasted image 20241120140226.png]]

##### 环境配置


##### Chains

链条，也就是 LangChain Runnables 的组合，支持步骤可以预测的应用程序，我们可以创建一个简单的链，它接受一个问题并执行以下操作：

- convert the question into a SQL query;
- execute the query;
- use the result to answer the original question.

这种安排不支持某些场景，例如，当用户输入 hello 的时候，我们也会执行上述步骤。还有就是，当涉及多个查询的时候，这套流程也不行了。我们将在 Agent 的部分解决这些问题。在这里，我们只搞链。

###### 将问题转换为 SQL 查询

Langchain 牛逼了，有一个内置的链叫做：[create_sql_query_chain](https://python.langchain.com/api_reference/langchain/chains/langchain.chains.sql_database.query.create_sql_query_chain.html) 

```python
import getpass
import os

os.environ["OPENAI_API_KEY"] = getpass.getpass()

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")
```


```python
from langchain.chains import create_sql_query_chain

chain = create_sql_query_chain(llm, db)
response = chain.invoke({"question": "How many employees are there"})

response
```

```
'SELECT COUNT("EmployeeId") AS "TotalEmployees" FROM "Employee"\nLIMIT 1;'
```

```
db.run(response)
```

```
'[(8,)]'
```

我们可以查看 LangSmith 轨迹来更好地理解这条链在干什么，我们也可以直接检查链中的提示词。Looking at the prompt (below), we can see that it is:

- Dialect-specific. In this case it references SQLite explicitly.
- Has definitions for all the available tables.
- Has three examples rows for each table.

This technique is inspired by papers like [this](https://arxiv.org/pdf/2204.00498.pdf), which suggest showing examples rows and being explicit about tables improves performance. We can also inspect the full prompt like so:

```python
chain.get_prompts()[0].pretty_print()
```


```
You are a SQLite expert. Given an input question, first create a syntactically correct SQLite query to run, then look at the results of the query and return the answer to the input question.
Unless the user specifies in the question a specific number of examples to obtain, query for at most 5 results using the LIMIT clause as per SQLite. You can order the results to return the most informative data in the database.
Never query for all columns from a table. You must query only the columns that are needed to answer the question. Wrap each column name in double quotes (") to denote them as delimited identifiers.
Pay attention to use only the column names you can see in the tables below. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table.
Pay attention to use date('now') function to get the current date, if the question involves "today".

Use the following format:

Question: Question here
SQLQuery: SQL Query to run
SQLResult: Result of the SQLQuery
Answer: Final answer here

Only use the following tables:
[33;1m[1;3m{table_info}[0m

Question: [33;1m[1;3m{input}[0m
```


###### 执行 SQL 查询

```python

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool

execute_query = QuerySQLDataBaseTool(db=db)
write_query = create_sql_query_chain(llm, db)
chain = write_query | execute_query
chain.invoke({"question": "How many employees are there"})
```

###### 回复答案


```python
from operator import itemgetter

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough

answer_prompt = PromptTemplate.from_template(
    """Given the following user question, corresponding SQL query, and SQL result, answer the user question.

Question: {question}
SQL Query: {query}
SQL Result: {result}
Answer: """
)

chain = (
    RunnablePassthrough.assign(query=write_query).assign(
        result=itemgetter("query") | execute_query
    )
    | answer_prompt
    | llm
    | StrOutputParser()
)

chain.invoke({"question": "How many employees are there"})
```


###### 下一步

对于更复杂的查询生成，我们可能需要创建少量提示或添加查询检查步骤。想了解像这样的高级技术，请查看：

- [Prompting strategies](https://python.langchain.com/docs/how_to/sql_prompting/): Advanced prompt engineering techniques.
- [Query checking](https://python.langchain.com/docs/how_to/sql_query_checking/): Add query validation and error handling.
- [Large databases](https://python.langchain.com/docs/how_to/sql_large_db/): Techniques for working with large databases.







# LangChain CG

### Tool calling

Many AI applications interact directly with humans. In these cases, it is appropriate for models to respond in natural language. But what about cases where we want a model to also interact directly with systems. such as dadabases or an API? These systems often have a particular input schema; for example, APIs frequently have a required payload structure. This need motivates the concept of tool calling. You can use tool calling to request model response that match a particular schema.

> You will sometimes hear the term `function calling`. We use this term interchangeably with `tool calling`.

![[Pasted image 20241116204603.png]]

**Key concepts**

**(1) Tool Creation:** Use the `@tool` decorator to create a tool. A tool is an association between a function and its schema. **(2) Tool Binding:** The tool needs to be connected to a model that supports tool calling. This gives the model awareness of the tool and the asscociated input schema required by the tool. **(3) Tool Calling:** When approoriate, **the model can decide** to call a tool and ensure its response conforms to the tool's input shcema. **(4) Tool Execution:** The tool can executed using the arguments provided by the model.

![[Pasted image 20241116210700.png]]

```python
# Tool creation
tools = [my_tool]
# Tool binding
model_with_tools = model.bind_tools(tools)
# Tool calling
response = model_with_tools.invoke(user_input)
```

```python
from langchain_core.tools import tool

@tool 
def multiply(a: int, b: int) -> int:
    """Multiply a and b."""
    return a * b
```

```python
model_with_tools = model.bind_tools([tools_list])
```

![[Pasted image 20241116211637.png]]

A key principle of tool calling is that the model decides when to use a tool based on the input's relevance. The model doesn't always need to call a tool. For example, given an unrelated input, the model would not call the tool:

```python
result = llm_with_tools.invoke("Hello world!")
```

The result would be an `AIMessage` containing the model's response in natural language. However, if we pass an input relevant to the tool, the model should choose to call it:

```python
result = llm_with_tools.invoke("What is 2 multiplied by 3?")
```

As before, the output `result` will be an `AIMessage`. But, if the tool was called, `result` will have a `tool_calls` attribute. This attribute includes everything needed to execute the tool, including the tool name and input arguments:

```python
result.tool_calls
{'name': 'multiply', 'args': {'a': 2, 'b': 3}, 'id': 'xxx', 'type': 'tool_call'}
```

[Tools](https://python.langchain.com/docs/concepts/tools/) implement the [Runnable](https://python.langchain.com/docs/concepts/runnables/) interface, which means that they can be invoked (e.g., `tool.invoke(args)`) directly.

[LangGraph](https://langchain-ai.github.io/langgraph/) offers pre-built components (e.g., [`ToolNode`](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.tool_node.ToolNode)) that will often invoke the tool in behalf of the user.

**Best practices**

When designing [tools](https://python.langchain.com/docs/concepts/tools/) to be used by a model, it is important to keep in mind that:

- Models that have explicit [tool-calling APIs](https://python.langchain.com/docs/concepts/tool_calling/) will be better at tool calling than non-fine-tuned models.
- Models will perform better if the tools have well-chosen names and descriptions.
- Simple, narrowly scoped tools are easier for models to use than complex tools.
- Asking the model to select from a large list of tools poses challenges for the model.

### Runnable interface

[Runnable interface | 🦜️🔗 LangChain](https://python.langchain.com/docs/concepts/runnables/)

The Runable interface is the foundation for working with LangChain components, and it is implemented across many of them, such as language models, output parsers, retrievers, compiled LangGraph and more.

This guide covers the main concepts and methods of the Runnable interface, which allows develops to interact with various LangChain components in a consistent and predictable manner.

> **RELATED RESOURCES**
> - The ["Runnable" Interface API Reference](https://python.langchain.com/api_reference/core/runnables/langchain_core.runnables.base.Runnable.html#langchain_core.runnables.base.Runnable) provides a detailed overview of the Runnable interface and its methods.
> - A list of built-in `Runnables` can be found in the [LangChain Core API Reference](https://python.langchain.com/api_reference/core/runnables.html). Many of these Runnables are useful when composing custom "chains" in LangChain using the [LangChain Expression Language (LCEL)](https://python.langchain.com/docs/concepts/lcel/).

The Runnable way defines a standard interface that allows a Runnable component to be:

- [Invoked](https://python.langchain.com/docs/how_to/lcel_cheatsheet/#invoke-a-runnable): A single input is transformed into an output.
- [Batched](https://python.langchain.com/docs/how_to/lcel_cheatsheet/#batch-a-runnable): Multiple inputs are efficiently transformed into outputs.
- [Streamed](https://python.langchain.com/docs/how_to/lcel_cheatsheet/#stream-a-runnable): Outputs are streamed as they are produced.
- Inspected: Schematic information about Runnable's input, output, and configuration can be accessed.
- Composed: Multiple Runnables can be composed to work together using [the LangChain Expression Language (LCEL)](https://python.langchain.com/docs/concepts/lcel/) to create complex pipelines.

Please review the [LCEL Cheatsheet](https://python.langchain.com/docs/how_to/lcel_cheatsheet/) for some common patterns that involve the Runnable interface and LCEL expressions.

#### Input and output types

Every Runnable is characterized by an input and output type. These input and output types can be any Python object, and are defined by the Runnable itself.

| Component    | Input Type                                       | Output Type           |
| ------------ | ------------------------------------------------ | --------------------- |
| Prompt       | dictionary                                       | PromptValue           |
| ChatModel    | a string, list of chat messages or a PromptValue | ChatMessage           |
| LLM          | a string, list of chat messages or a PromptValue | String                |
| OutputParser | the output of an LLM or ChatModel                | Depends on the parser |
| Retriever    | a string                                         | List of Documents     |
| Tool         | a string or dictionary, depending on the tool    | Depends on the tool   |
#### RunnableConfig

Any of the methods that are used to execute the runnable (invoke, batch, stream, astram_events) accept a second argument called `RunnableConfig` . This argument is a dictionary that contains configuration for the Runnable that will be used at run time during the execution of the runnable.

A `RunnableConfig` can have any of the following properties defined:

![[Pasted image 20241116165313.png]]
Passing config to the invoke method is done like so:

```
some_runnable.invoke(
   some_input, 
   config={
      'run_name': 'my_run', 
      'tags': ['tag1', 'tag2'], 
      'metadata': {'key': 'value'}
      
   }
)
```

### 检索

[Retrieval | 🦜️🔗 LangChain](https://python.langchain.com/docs/concepts/retrieval/)

检索系统是许多 AI 应用的基础，能够高效地从大型数据集中识别相关信息。这些系统支持多种数据格式：

- 非结构化文本，如文档，这些通常存储在向量数据库或者是词法搜索的索引中。
- 结构化数据通常保存在具有定义模式的关系型或图数据库中。

尽管数据格式的多样性不断增加，现代 AI 应用正在逐渐致力于通过自然语言界面使得所有类型的数据都可以被访问。在这个过程中，模型发挥了关键作用，它们将自然语言查询转换为和底层搜索索引或数据库兼容的格式。这种转换使得和复杂数据结构的交互更加直观和灵活。

![[Pasted image 20241122104903.png]]

(1) **查询分析**：一种过程，通过该过程，模型将搜索查询进行转换或构建，以优化检索效果。

(2) **信息检索**：利用搜索查询从各种检索系统中获取信息。

#### 查询分析

尽管用户通常倾向于使用自然语言和检索系统进行交互，这些系统可能需要特定的查询语法或从某些关键字中获益。查询分析在用户的原始输入和优化的搜索查询之间充当桥梁。查询分析的一些常见应用包括：

- 查询重写：通过重写或扩展查询来改进语义或是词法搜索效果 semantic or lexical searches
- 查询构建：某些查询索引可能需要结构化查询（例如说，用于数据库的 SQL）

查询分析利用模型将用户的原始输入转换或构建为优化的搜索查询。
##### 查询重写

检索系统应能够理想地处理各种用户输入，从简单且措辞不当的查询到复杂的多方面问题。为了实现这种多功能性，一种常见的方法是使用模型将原始用户查询转换为更有效的搜索查询。这种转换可以从简单的关键词提取到复杂的查询扩展和重构不等。以下是使用模型进行查询分析在无结构数据检索中的一些关键优势：

- **查询澄清：** 模型可以将模糊或措辞不清的查询重新表述，以提高查询的清晰度。
- **语义理解：** 它们可以捕捉查询背后的意图，超越字面上的关键词匹配。
- **查询扩展：** 模型可以生成相关的术语或概念，扩大搜索范围。
- **复杂查询处理：** 它们可以将多部分的问题分解为更简单的子查询。

已经开发出多种技术，以利用模型进行查询重写，包括：

[Multi-query](https://python.langchain.com/docs/how_to/MultiQueryRetriever/)

重写用户问题，为其提供多种表述，为每个重写后的问题检索文档，返回所有查询的唯一文档。

使用场景：当你希望通过提供问题的多种表述来确保检索中的高召回率时。

[Decomposition](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb)

将一个问题分解成一系列的子问题或是子查询，这些子问题可以按顺序解决（使用第一个问题的答案加上检索结果来回答第二个问题）或者是并行解决。

使用场景：当一个问题需要被分为更小的子问题的时候

[Step-back](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb)

首先提示 LLM 提出一个关于高层次概念或原则的一般性回退问题，并检索与之相关的事实。利用这种基础来帮助回答用户的问题。[Paper](https://arxiv.org/pdf/2310.06117).

使用场景：当需要更高层次的概念理解的时候

[HyDE](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb)

1. 使用大型语言模型（LLM）将问题转化为假设的文档，这些文档能够回答该问题。
2. 利用嵌入的假设文档进行文档-文档相似度搜索，以检索实际文档。
3. 基于文档-文档相似度搜索能够产生更相关匹配的前提，从检索到的实际文档中挑选最相关的内容。
4. 将挑选出的相关内容整合，形成对原始问题的回答。

使用场景：当我们在使用原始用户输入去检索相关文档的时候遇到困难

让我们来举个例子实现查询分解这种形式的 query 重写，查询分解可以通过使用提示和结构化输出来简单实现，这将强制列出一系列子问题，然后这些子问题可以在下游的检索系统上顺序或是并行的执行。

```python
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Define a pydantic model to enforce the output structure
class Questions(BaseModel):
    questions: List[str] = Field(
        description="A list of sub-questions related to the input query."
    )

# Create an instance of the model and enforce the output structure
model = ChatOpenAI(model="gpt-4o", temperature=0) 
structured_model = model.with_structured_output(Questions)

# Define the system prompt
system = """You are a helpful assistant that generates multiple sub-questions related to an input question. \n
The goal is to break down the input into a set of sub-problems / sub-questions that can be answers in isolation. \n"""

# Pass the question to the model
question = """What are the main components of an LLM-powered autonomous agent system?"""
questions = structured_model.invoke([SystemMessage(content=system)]+[HumanMessage(content=question)])
```

##### 查询构建

查询分析还可以专注于将自然语言查询转换为专业的查询语言或是过滤条件。这种转换对于有效地和存储结构化或半结构化数据的各种类型数据库进行交互至关重要。

**结构化数据示例：**

对于关系数据库和图数据库，使用领域特定语言（DSLs）来查询数据。

- **Text-to-SQL**: [Converts natural language to SQL](https://paperswithcode.com/task/text-to-sql) 将自然语言转换为 SQL，用于关系数据库。
- **Text-to-Cypher**: [Converts natural language to Cypher](https://neo4j.com/labs/neodash/2.4/user-guide/extensions/natural-language-queries/) 将自然语言转换为 Cypher，用于图数据库。

**半结构化数据示例：**

对于向量存储，查询可以结合语义搜索与元数据过滤。

- **自然语言到元数据过滤器**: 将用户查询转换为合适的元数据过滤条件。[appropriate metadata filters](https://docs.pinecone.io/guides/data/filter-with-metadata).

这些方法利用模型来弥合用户意图与不同数据存储系统具体查询需求之间的差距。以下是一些流行的技术：

- [Self Query](https://python.langchain.com/docs/how_to/self_query/)
  - **使用时机**: 当用户提出的问题更适合通过基于元数据而非文本相似性的文档检索来回答时。
  - **描述**: 这种方法使用大型语言模型（LLM）将用户输入转换为两部分内容：(1) 一个用于语义查找的字符串，(2) 一个伴随的元数据过滤器。这非常有用，因为很多时候问题是关于文档的元数据（而不是内容本身）。

- **Text to SQL**
  - **使用时机**: 当用户提出的问题需要从可以通过 SQL 访问的关系数据库中获取信息时。
  - **描述**: 这种方法使用大型语言模型（LLM）将用户输入转换为 SQL 查询。

- **Text-to-Cypher**
  - **使用时机**: 当用户提出的问题需要从可以通过 Cypher 访问的图数据库中获取信息时。
  - **描述**: 这种方法使用大型语言模型（LLM）将用户输入转换为 Cypher 查询。



# 03 提示词工程

## Chunking Text

分块是将大块文本分解为更小，更容易管理的单元或者块的过程。这些块可以基于各种标准，比如句子，段落，主题，复杂性或长度。通过将文本分成更小的部分，人工智能模型可以更有效地处理，分析和生成响应。
什么时候应该分块，什么时候又不应该分块？当遇见大型文档，当需要复杂的分析，当遇见多主题的文档的时候通常需要分块。当遇见短文件，只需要简单分析，遇见单一主题文件的时候就不太需要分块了，毕竟当文档专注于单个主题的时候，分块不会为流程增加价值。

当遇见不好的分块的时候，我们会失去语境，同时过多的分块会增加计算，使得效率低下。

### Chunking Strategies

- 按句子拆分
保留原始内容的上下文和结构，使llm更容易理解和处理信息。基于句子的分块处理对于总结、翻译和情感分析等任务特别有用。
- 按段落分割
这种方法在处理较长的内容的时候特别有效，因为它允许 LLM 一次专注于一个内聚单元。基于段落的分块是文档分析，主题建模和信息提取等应用的理想选择。
- 按主题或部分分割
这种方法可以帮助 AI 模型更好地识别和理解内容中的注意和思想。基于主题的分块非常适合文本分类，内容推荐和聚类等任务。
- 按复杂度划分
对于某些应用程序，根据文本的复杂性（如阅读水平或内容的技术性）拆分文本可能会有所帮助。通过将相似的复杂性级别分组在一起，LLM 可以更有效地处理和分析文本。这种方法对于可读性分析、内容分析等任务非常有用
- 按长度分割  
这种技术在处理非常长或复杂的文档时特别有用，因为它允许llm更有效地处理内容。基于长度的分块适用于大规模文本分析、搜索引擎索引和文本预处理等应用程序。  
- 使用标记器按标记进行分割  
在许多自然语言处理任务中，使用标记器是至关重要的一步，因为它支持将文本拆分为单个标记的过程。标记器将文本分成更小的单元，如单词、短语或符号，然后可以对其进行分析

![[Pasted image 20241104211456.png]]
### 几种简单的分块方法

**基于 SpaCy 的句子检验**

```
pip install spacy

python -m spacy download en_core_web_sm
```

```python
import spacy

nlp = spacy.load("en_core_web_sm")

text = "This is a sentence. This is another sentence."

doc = nlp(text)

for sent in doc.sents:
	print(sent.text)
```

可惜这是一个适用于英语的模型。

**建立一个简单的分块算法**

```python
with open("", "r") as f:
	text = f.read()
chunks = [text[i: i + 200] for i in range(0, len(text)), 200]
for chunk in chunks:
	print("-"*20)
	print(chunk)
```

显然这不是一个好的分块算法。

**滑动窗口分块**

滑动窗口的步长为 1 的时候，块之间存在大量重复信息，同时块之间信息丢失的风险也大大降低。
如果准确性和保留语义上下文比最小化 token 输入或向对象发出请求数量更加重要，则可能需要更大的重叠。

```python
# 3-5 滑动窗口
def sliding_window(text, window_size, step_size):
	if window_size > len(text) or step_size < 1:
		return []
	return [text[i: i+window_size] for i in range(0, len(text)-window_size+1, step_size)]
```

### 文本分块的包

在使用诸如 GPT-4 之类的 llm 时，始终要注意最大上下文长度：
maximum_context_length = input_tokens + output_tokens  

有各种各样的标记器可以将文本分解为可管理的单元，最流行的是 NLTK， spaCy 和 tiktoken。  
NLTK 和 spaCy 都为文本处理提供了全面的支持，但我们在这里将专注于 tiktoken。

#### 使用 tiktoken 进行文本分块

#### langchain RecursiveCharacterTextSplitter

详细可见上面 Langchain 


## Autonomous Agents with Memory and Tools

## CoT

## Agent


## DSPY

我清楚地记得，几个月前提示工程（Prompt Engineering）还是一股热潮。整个就业市场都充斥着“提示工程师”的职位，但现在却不是这样了。提示工程并不是一种艺术或科学，而更像是“聪明的汉斯现象”，即人类提供必要的上下文，让系统能更好地回答问题。人们甚至写了书籍或博客，例如“用 GPT 获取最佳效果的 50 大提示”等等。然而，大规模实验已经清楚地表明，没有单一的提示或策略适用于所有问题，只是有些提示在单独使用时看起来更有效，但综合分析时却表现不佳，属于碰运气的情况。

因此，今天我们要讨论的是 **DSPy**：一种 **“将声明式语言模型调用编译为自我优化流水线”** 的框架。这是斯坦福开发的一个框架，用于构建自我改进的流水线，在其中将 LLM 视为一个模块，并通过类似 PyTorch 中的抽象方式由编译器进行优化。

正如我上面提到的，互联网上充斥着各种推广书籍和博客的内容。而其中大多数只是在向你兜售一堆无用的信息。当然，可能有少数确实有效，但这并不是构建应用程序的好方法。**了解某些方法什么时候不起作用同样重要**。我们需要定义一个安全的假设空间，明确系统在哪些情况下有效，哪些情况下无效。

甚至还有一些论文表明，使用特定情感化的提示可以提升 LLM 的性能。对我来说，我对这种论文的真实性仍然持保留态度。这种方法能持续多久？是否适用于所有主题？是否存在某些主题，使用这种情感化提示反而可能导致更差的结果？类似的论文有很多，无意间发布了一些不成熟的研究。比如《Embers of Autoregression》，其中很多内容后来被证明是错误的。

但更大的问题是，那种需要告诉系统“如果你不马上给出答案，我可能会被解雇”或者“我的奶奶生病了”等类似内容的方式，算是什么样的科学/系统化方法？这只是人们在随机地尝试破解 LLM 的行为而已。

**提示词工程的问题

再举个例子，当我说“使用硬负例添加 5-shot CoT 和 RAG”时，从概念上讲这是非常清楚的，但在实践中却很难实现。LLMs 对提示非常敏感，因此将这种结构放入提示中大多数情况下并不起作用。LLMs 的行为对提示的撰写方式非常敏感，这使得引导它们变得相当困难。

因此，当我们构建一个流水线时，不只是尝试说服 LLM 以某种方式生成输出，而是更多地希望输出被限制为可以作为更大流水线中其他模块输入的形式。

为了解决这个问题，已经有很多研究在进行，但它们在许多方面都存在局限性。大多数方法依赖字符串模板，这些模板脆弱且难以扩展。当语言模型随着时间变化时，提示可能会失效。比如说适合于千问的提示词就不适合 gpt 的，或是版本变化之后提示词失效。

如果我们希望将模块插入到不同的流水线中，它就无法工作。我们希望它能与新工具、新数据库或新的检索器进行交互，但却无法实现。

这正是 **DSPy** 试图解决的问题，它将 LLM 视为一个模块，并根据它如何与流水线中其他组件交互来自动调整其行为。

**DSPy 模式：与其“提示”LLM，不如“编程”LLM**  

DSPy 的目标是：别再纠结怎么调教 LLM 的提示了，把注意力放到如何设计一个好的整体系统上。

**那该怎么做到呢？**

想象一下，我们可以把 LLM 想象成一种“设备”：它们会按照指令来执行任务，就像一种“深度学习的抽象工具”。

举个例子：在 PyTorch 里，我们定义了一个“卷积层”，这个卷积层可以处理来自其他层的输入数据。你只需要把这些层像乐高积木一样一层一层地搭起来，就能对输入数据进行不同层次的处理。重点是，我们完全不用去操心什么 CUDA 核心啊、底层的复杂指令啊，这些都已经封装在“卷积层”这个模块里了。

我们希望对 LLM 也能这样操作——把它们看成像积木一样的模块，通过不同的组合，让它们表现出我们想要的行为，比如 Chain of Thought（CoT，连锁思维）、ReAct 等等。

要让 LLM 表现出我们想要的效果，需要做一些改变：

![[Pasted image 20241125142634.webp]]

**NLP 签名**  

NLP 签名就是我们给 LLM 下的“任务说明”，它告诉 LLM 我们想要它做什么，但并不涉及具体怎么做。它只是定义了目标，而不是如何提示 LLM 去完成这些目标。可以理解为 DSPy 知道一个转换应该做什么，而不是如何通过提示让 LLM 去做。

![[Pasted image 20241125142748.webp]]

- 签名负责处理结构化的格式化和解析逻辑。  
- 签名可以被编译成自我改进的、适应流水线的提示或微调。  

**DSPy 会根据以下内容推断字段的作用：**

- 字段的名字，例如，DSPy 会用上下文学习将“问题”和“答案”区分开来。
- 它们的“痕迹”（输入/输出示例）

**注意**：这些并不是预先写死的，而是系统在编译过程中根据情况自己判断出来的。

**模块**  

模块就是我们利用签名来构建的功能块。比如，如果我们想要做一个连锁思维（CoT）模块，我们就用这些签名来创建它。这样，系统就能自动生成高质量的提示，帮助我们实现一些特定的提示技巧。

**更技术化的定义**：模块是一个参数化的层，通过抽象提示技巧来表达一个签名。简单来说，就是把提示技巧包装成一个可以重复使用的功能块。

![[Pasted image 20241125142918.webp]]

**模块的使用**  

一旦模块被声明，它就像一个可以调用的函数一样运行。

**参数**：为了表达特定的签名，每次调用 LLM 时需要指定：

- 需要调用的具体 LLM
- 提示的指令
- 每个签名字段的字符串前缀
- 用作少量示例提示和/或微调数据的示范

**优化器**  

为了让这个系统正常工作，优化器会处理整个流水线，并根据某个特定的标准来优化它。在这个过程中，优化器会自动找出最合适的提示，甚至会更新语言模型的权重。

**高层次的想法**是，我们会用一个优化器来编译我们的代码，让语言模型的调用变得更高效，这样流水线中的每个模块都会被优化成一个自动生成的提示，或者为我们的任务定制的新微调权重。

**实际示例**  

单个搜索查询通常不足以完成复杂的问答任务。例如，在 HotPotQA 中，有一个关于“Right Back At It Again”这本书作者出生城市的问题。一个搜索查询通常能正确识别作者为“Jeremy McKinnon”，但无法提供关于他出生日期的相关信息。

在检索增强型自然语言处理（NLP）文献中，解决这个挑战的标准方法是构建多跳搜索系统，如 GoldEn（Qi 等人，2019）和 Baleen（Khattab 等人，2021）。这些系统会读取检索到的结果，并在必要时生成额外的查询来收集更多信息，最终得出答案。使用 DSPy，我们可以轻松地通过几行代码模拟这种系统。

目前，要实现这一点，我们需要编写非常复杂的提示，并以非常混乱的方式将它们结构化。但问题是，一旦我改变了问题的类型，可能需要完全重新设计系统，但使用 DSPy 就不会有这个问题。

```python
import dspy

turbo = dspy.OpenAI(model='gpt-3.5-turbo')
colbertv2_wiki17_abstracts = dspy.ColBERTv2(url='http://20.102.90.50:2017/wiki17_abstracts')

dspy.settings.configure(lm=turbo, rm=colbertv2_wiki17_abstracts)
```

我们可以利用前面提到的 HotPotQA 数据集，它是一个包含复杂问答对的数据集，通常需要通过多跳推理来回答。我们可以通过 DSPy 提供的 HotPotQA 类来加载这个数据集：

```python
from dspy.datasets import HotPotQA

# Load the dataset.
dataset = HotPotQA(train_seed=1, train_size=20, eval_seed=2023, dev_size=50, test_size=0)

# Tell DSPy that the 'question' field is the input. Any other fields are labels and/or metadata.
trainset = [x.with_inputs('question') for x in dataset.train]
devset = [x.with_inputs('question') for x in dataset.dev]

len(trainset), len(devset)

#Output
(20, 50)
```

**构建签名**  

现在我们已经加载了数据，接下来让我们开始为 Baleen 流水线中的子任务定义签名。

我们首先创建一个 `GenerateAnswer` 签名，它将以上下文和问题作为输入，输出答案。

```python
class GenerateAnswer(dspy.Signature):
    """Answer questions with short factoid answers."""

    context = dspy.InputField(desc="may contain relevant facts")
    question = dspy.InputField()
    answer = dspy.OutputField(desc="often between 1 and 5 words")


class GenerateSearchQuery(dspy.Signature):
    """Write a simple search query that will help answer a complex question."""

    context = dspy.InputField(desc="may contain relevant facts")
    question = dspy.InputField()
    query = dspy.OutputField()
```

[Prompting Is Dead: DSPy For Prompting | AIGuys](https://medium.com/aiguys/prompt-engineering-is-dead-dspy-is-new-paradigm-for-prompting-c80ba3fc4896)


# 04 LangGraph


```python
from typing import Annotated, Literal, TypedDict

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph, MessagesState
from langgraph.prebuilt import ToolNode



```

## 快速开始

### 构建一个基础的聊天机器人

首先要创建一个 StateGraph，这个对象将聊天机器人的结构定义为 “状态机”。我们将添加节点来表示 llm 和聊天机器人可以调用的函数，并添加 edge 来指定聊天机器人该如何在这些函数之间进行转换。

```python
from typing import Annotated

from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class State(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (in this case, it appends messages to the list, rather than overwriting them)
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)
```

>[!note]
>The first thing you do when you define a graph is define the `State` of the graph. The `State` consists of the schema of the graph as well as [reducer functions](https://langchain-ai.github.io/langgraph/concepts/low_level/#reducers) which specify how to apply updates to the state. In our example `State` is a `TypedDict` with a single key: `messages`. The `messages` key is annotated with the [`add_messages`](https://langchain-ai.github.io/langgraph/reference/graphs/#langgraph.graph.message.add_messages) reducer function, which tells LangGraph to append new messages to the existing list, rather than overwriting it. State keys without an annotation will be overwritten by each update, storing the most recent value.

至此，我们的图了解了两个事情：

1. 我们定义的每个节点都将接收当前状态作为输入，并返回更新该状态的值。
2. 消息将被追加到当前列表中，而不是直接覆盖。这是通过 Annotated 语法中预构建的 add_messages 函数进行通信的。

接下来，我们将添加一个 `chatbot` 节点，一个节点代表着一个工作单元。它们实际上是常规的 Python 代码。

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url = "http://172.16.136.144:30005/v1",
    api_key = "local-key"
)

def chatbot(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

# The first argument is the unique node name
# The second argument is the function or object 
# that will be called whenever the node is used.
graph_builder.add_node("chatbot", chatbot)
```

请注意在这里 chatbot 节点是将当前状态作为输入，并 returns a dictionary containing an updated `messages` list under the key "messages". **This is the basic pattern for all LangGraph node functions.**

The `add_messages` function in our `State` will append the llm's response messages to whatever messages are already in the state.

Next, add an `entry` point. This tells our graph **where to start its work** each time we run it.

```python
graph_builder.add_edge(START, "chatbot")
```

相似的，我们可以设计一个 `finish` 点，这意味着我们的 graph 将在任意时间这个节点跑起来的时候，我们都可以退出。

```python
graph_builder.add_edge("chatbot", END)
```

最后我们希望可以运行我们的图，为此在图形构建器上调用 `compile()` 。这将创建一个 `CompiledGraph`  we can use invoke on our state.

```python
graph = graph_builder.compile()
```

可视化：

```python
from IPython.display import Image, display

try:
    display(Image(graph.get_graph().draw_mermaid_png()))
except Exception:
    # This requires some extra dependencies and is optional
    pass
```

Now let's run the chatbot!

**Tip:** You can exit the chat loop at any time by typing "quit", "exit", or "q".

```python
def stream_graph_updates(user_input: str):
    for event in graph.stream({"messages": [("user", user_input)]}):
        for value in event.values():
            print("Assistant:", value["messages"][-1].content)


while True:
    try:
        user_input = input("User: ")
        if user_input.lower() in ["quit", "exit", "q"]:
            print("Goodbye!")
            break

        stream_graph_updates(user_input)
    except:
        # fallback if input() is not available
        user_input = "What do you know about LangGraph?"
        print("User: " + user_input)
        stream_graph_updates(user_input)
        break
```

### 使用工具增强聊天机器人的能力

为了处理我们的机器人无法凭借记忆来回答问题这样困境，我们将集成一个网络搜索工具。我们的机器人可以使用这个工具来查找相关的信息并提供更好的响应。

```python
from langchain_community.tools.tavily_search import TavilySearchResults

tool = TavilySearchResults(max_results=2)
tools = [tool]
tool.invoke("What's a 'node' in LangGraph?")
```

```
[{'url': 'https://medium.com/@cplog/introduction-to-langgraph-a-beginners-guide-14f9be027141',
  'content': 'Nodes: Nodes are the building blocks of your LangGraph. Each node represents a function or a computation step. You define nodes to perform specific tasks, such as processing input, making ...'},
  
 {'url': 'https://saksheepatil05.medium.com/demystifying-langgraph-a-beginner-friendly-dive-into-langgraph-concepts-5ffe890ddac0',
  'content': 'Nodes (Tasks): Nodes are like the workstations on the assembly line. Each node performs a specific task on the product. In LangGraph, nodes are Python functions that take the current state, do some work, and return an updated state. Next, we define the nodes, each representing a task in our sandwich-making process.'}]
```

接下来我们将定义我们的图，下面的代码和第一部分完全相同，只是我们在 LLM 中添加了 `bind_tools` 。这让大模型能够在想要去使用我们的搜索引擎的时候知道正确的 JSON 格式。

```python
from typing import Annotated

from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langchain.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[List, add_messages]

graph_builder = StateGraph(State)

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(
    base_url = "http://172.16.136.144:30005/v1",
    api_key = "local-key"
)

llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {'messages': [llm_with_tools.invoke(state['messages'])]}

graph_builder.add_node("chatbot", chatbot)
```

接下来，我们需要创建一个函数，以便在调用工具的时候实际运行这些工具。

```python
import json

from langchain_core.messages import ToolMessage


class BasicToolNode:
    """A node that runs the tools requested in the last AIMessage."""

    def __init__(self, tools: list) -> None:
        self.tools_by_name = {tool.name: tool for tool in tools}

    def __call__(self, inputs: dict):
        if messages := inputs.get("messages", []):
            message = messages[-1]
        else:
            raise ValueError("No message found in input")
        outputs = []
        for tool_call in message.tool_calls:
            tool_result = self.tools_by_name[tool_call["name"]].invoke(
                tool_call["args"]
            )
            outputs.append(
                ToolMessage(
                    content=json.dumps(tool_result),
                    name=tool_call["name"],
                    tool_call_id=tool_call["id"],
                )
            )
        return {"messages": outputs}


tool_node = BasicToolNode(tools=[tool])
graph_builder.add_node("tools", tool_node)
```

```python
from typing import Literal


def route_tools(
    state: State,
):
    """
    Use in the conditional_edge to route to the ToolNode if the last message
    has tool calls. Otherwise, route to the end.
    """
    if isinstance(state, list):
        ai_message = state[-1]
    elif messages := state.get("messages", []):
        ai_message = messages[-1]
    else:
        raise ValueError(f"No messages found in input state to tool_edge: {state}")
    if hasattr(ai_message, "tool_calls") and len(ai_message.tool_calls) > 0:
        return "tools"
    return END


# The `tools_condition` function returns "tools" if the chatbot asks to use a tool, and "END" if
# it is fine directly responding. This conditional routing defines the main agent loop.
graph_builder.add_conditional_edges(
    "chatbot",
    route_tools,
    # The following dictionary lets you tell the graph to interpret the condition's outputs as a specific node
    # It defaults to the identity function, but if you
    # want to use a node named something else apart from "tools",
    # You can update the value of the dictionary to something else
    # e.g., "tools": "my_tools"
    {"tools": "tools", END: END},
)
# Any time a tool is called, we return to the chatbot to decide the next step
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")
graph = graph_builder.compile()
```

### 给机器人添加记忆

我们的聊天机器人现在可以使用工具来回答用户的问题，但它不记得以前交互的上下文。这限制了它进行连贯、多回合对话的能力。

LangGraph 通过持久的检查点解决了这个问题。如果在编译图形时提供一个checkpointer，在调用图形时提供 thread_id， LangGraph 会在每一步之后自动保存状态。当您使用相同的 thread_id 再次调用图形时，图形将加载其保存的状态，允许聊天机器人从它离开的地方重新开始。

稍后我们将看到，检查点比简单的聊天内存强大得多——它允许您随时保存和恢复复杂的状态，以便进行 error recovery, human-in-the-loop workflows, time travel interactions 等等。但在我们过于超前之前，让我们添加检查点以启用多回合对话。

To get started, create a `MemorySaver` checkpointer.

```python
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
```

注意：我们使用了一个 in-memory checkpointer。它将所有的内容保存在内存里，在生成应用程序的时候，我们可以 change this to use `SqliteSaver` or `PostgresSaver` and connect to your own DB.

```python
from typing import Annotated

from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition


class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)


tool = TavilySearchResults(max_results=2)
tools = [tool]

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(
    base_url = "http://172.16.136.144:30005/v1",
    api_key = "local-key"
)

llm_with_tools = llm.bind_tools(tools)


def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}


graph_builder.add_node("chatbot", chatbot)

tool_node = ToolNode(tools=[tool])
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
# Any time a tool is called, we return to the chatbot to decide the next step
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")
```

```python
graph = graph_builder.compile(checkpointer=memory)
```

```python
user_input = "Hi there! My name is Will."

# The config is the **second positional argument** to stream() or invoke()!
events = graph.stream(
    {"messages": [("user", user_input)]}, config, stream_mode="values"
)
for event in events:
    event["messages"][-1].pretty_print()
```

```
================================[1m Human Message [0m=================================

Hi there! My name is Will.
==================================[1m Ai Message [0m==================================

Hello Will! It's nice to meet you. How can I assist you today? Is there anything specific you'd like to know or discuss?
```


```python
user_input = "Remember my name?"

# The config is the **second positional argument** to stream() or invoke()!
events = graph.stream(
    {"messages": [("user", user_input)]}, config, stream_mode="values"
)
for event in events:
    event["messages"][-1].pretty_print()
```

```
================================[1m Human Message [0m=================================

Remember my name?
==================================[1m Ai Message [0m==================================

Of course, I remember your name, Will. I always try to pay attention to important details that users share with me. Is there anything else you'd like to talk about or any questions you have? I'm here to help with a wide range of topics or tasks.
```

[From Basics to Advanced: Exploring LangGraph | by Mariya Mansurova | Towards Data Science](https://towardsdatascience.com/from-basics-to-advanced-exploring-langgraph-e8c1cf4db787)

### Human-in-the-loop
Agents can be unreliable and may need human input to successfully accomlish tasks. Similarly, for some actions, you may want to require human approval before running to ensure that everything is running as intended.

LangGraph supports `human-in-the-loop` workflows in a number of ways. In this section, we will use LangGraph's `interrupt_before` functionality to always break the tool node.

First, start from our existing code. The following is copied from Part3.

```python
from typing import Annotated

from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
from typing_extensions import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

memory = MemorySaver

class State(TypedDict):
    messages: Annotated[List, add_messages]

graph_builder = StateGraph(State)

tool = TavilySearchResults(max_results=2)
tools = [tool]
llm = ChatAnthropic(model="claude-3-5-sonnet-20240620")
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

graph_builder.add_node("chatbot", chatbot)

tool_node = ToolNode(tools=[tool])
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition
)

graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")
```

Now, compile the graph, specifying to `interrupt_before` the `tools` node.

```python
graph = graph_builder.compile(
    checkpoint=memory,
    interrupt_before=['tools'],
    # Note: can also interrupt after tools, if desired.
    # interrupt_after=['tools']
)
```

```python
user_input = "I'm learning LangGraph. Could you do some research on it for me."

config = {"configurable": {"thread_id": "1"}}
# The config is the second positional argument to stream() or invoke()!

events = graph.stream(
    {"messages": [("user", user_input)]}, config, stream_mode="values"
)

for event in events:
    if "messages" in event:
        event["messages"][-1].pretty_print()
```


### Build a Customer Support Bot

Customer support bots can free up teams's time by handing routine issues, but it can be hard to build a bot that reliably handles deiverse tasks in a way that doesnnot leave the user pulling their hair out.

In this tutorial, you will build a  customer support bot for an airline to help users research and make travel arrangements. You will learn use LangGraph's interrupts and checkpointers and more complex state to organize your assistant's tools and manage a user's flight bookings, hotel reservations, car rentals, and excursions. It assumes you are familiar with the concepts presented in the langgraph introductory tutorial.

By the end, you will have built a working bot and gained an understanding of langgraph's key concepts and architectures. You will be able to apply these design patterns to you other AI projects.

Run the next script to fetch a sqlite DB we have prepared for this tutorial and update it to look like it is current.

[Build a Customer Support Bot](https://langchain-ai.github.io/langgraph/tutorials/customer-support/customer-support/)

### Code generation with RAG and self-correction
We will implement some of these tests and improves an anwer on public and AI-generated tests for a particular question.

1. We start with a set of dicumentation specified by a user.
2. We use a long context LLM to ingest it and perform RAG to answer a question baesd on it.
3. We will invoke a tool to produce a strcutured output.
4. We will perform two unit tests (check imports and code execution) prior returning the solution to the user.

![[Pasted image 20241110222630.png]]


[Code generation with RAG and self-correction](https://langchain-ai.github.io/langgraph/tutorials/code_assistant/langgraph_code_assistant/)


## 04.2 Persistence

LangGraph has a built-in persistence layer, implemented through checkpointers. When you compile graph with a checkpoint, the checkpointer saves a checkpoint of the graph state at every super-step. Those checkpoint are saved to a thread, which can be accessed after graph execution. Because threads allow access to graph's state after execution, several powerful capabilities including human-in-loop. memory, time travel, and fault-tolerance are all possible.

**Threads**
A thread is unique ID or thread identifier assigned to each checkpoint saved by a checkpointer. When invoking graph with a checkpointer, you must specify a thread_id as part of the configurable portion of the config.

```python
{"configurable": {"thread_id": "1"}}
```


## 04.4 Human-in-the-loop
[Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)




## Code
### Tree of Thought

Tree of Thoughts, by Yao, is a general LLM agent search algorithm that combines reflection/evaluation and simple search (in this cases BFS, though you can apply DFS or other algorithms if you'd like).

![[Pasted image 20241116131926.png]]

It has three main steps:

1. Expand: generate 1 or more candidate solutions to the problem.
2. Score: measure the quality of the responses.
3. Prune: retain the top K best candidates.

Then return to Expand if no solution is found (or if the solution is of insufficient quality).

**Task Definition**

Our agent will try to play the Game of 24. Given 4 numbers, it must generate a math equation that uses each of these numbers exactly one time to evaluate to a value of 24.

```python
import operator
from typing import List, Literal, Union, NamedTuple, Optional
from pydantic import BaseModel, Field

OperatorType = Literal["+", "-", "*", "/"]
TokenType = Union[float, OperatorType]

## We use these schemas to prompt the LLM to genrate equations that evaluate to 24.

class Equation(BaseModel):
    """
    The formula combining the provided numbers to reach the target of 24.
    """

    tokens: List[TokenType] = Field(
        description="The stack of tokens and operators in reverse-polish notation. Example: [3, 4, '+', -1, '*'] would evaluate to (3 + 4) * -1 = -7."
    )

    def compute(self) -> float:
        # 定义一个字典，将字符串操作符映射到对应的 Python 内置运算函数
        op_funcs = {
            "+": operator.add,
            "-": operator.sub,
            "*": operator.mul,
            "/": operator.truediv, # 浮点数除法
        }
        stack = []
        for token in self.tokens:
            if isinstance(token, float):
                stack.append(token)
            else:
                b, a = stack.pop(), stack.pop()
                stack.append(op_funcs[token](a, b))

        return stack[0]

class GuessEquations(BaseModel):
    """Submit multiple equations as guesses."""

    reasoning: str = Field(
        description="The reasoning behind the submitted guesses. Explain how you arrived at these equations."
    )

    equations: List[Equation] = Field(
        description="The list of equations to submit as guesses."
    )


## These objects will represent a single "candidate" (or scored candidate) within our agent's state.
# You can update the candidate object to match your own task.


class Candidate(NamedTuple):
    candidate: Equation
    score: Optional[float] = None
    feedback: Optional[str] = None

    def __str__(self):
        try:
            computed = self.candidate.compute()
        except Exception as e:
            computed = f"Invalid equation: {self.candidate.tokens}; Error: {repr(e)}"

        return f"Equation({self.candidate.tokens}) = {computed} (Reward: {self.score})"


class ScoredCandidate(Candidate):
    candidate: Equation
    score: float
    feedback: str
```

We will use an example from the Game of 24 dataset.

```python
import requests
import csv

csv_data = requests.get(
    "https://storage.googleapis.com/benchmarks-artifacts/game-of-24/24.csv"
).content.decode("utf-8")
# Get just the Puzzles column (column index 1)
puzzles = [row[1].strip() for row in csv.reader(csv_data.splitlines()[1:])]

print(f"Example puzzles: {puzzles[:3]}")
```

```
Example puzzles: ['1 1 4 6', '1 1 11 11', '1 1 3 8']
```



### 建立一个多智能体的助手

[Hands on LangGraph — Building a multi agent assistant | by Lucas Dahan | Medium](https://medium.com/@lucas.dahan/hands-on-langgraph-building-a-multi-agent-assistant-06aa68ed942f)

我们可以将 langchain 🦜 看作是一个擅长处理多任务的朋友，但是有时候一个朋友不足以处理一个大的项目。That is where LangGraph appears. 它支持创建不同代理之间的交互图。简单来说，它更像一个大师来组织小组的项目。好的方面是，它通过不同的生成式 AI 智能体来一起工作，促进了一种更灵活和可扩展的方法，更重要的是，创建和添加新的智能体真的非常简单。

Now let’s dive in and get a practical guide to build your first LangGraph application.

#### 创建智能体

Let’s start by creating an `agents.py` file to define our three agents:

- The "analysis" agent for initial prompt classification
- The "code" agent for code-related queries
- The "general" agent for global topics

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Creating the first analysis agent to check the prompt structure
# This print part helps you to trace the graph decisions
def analyze_question(state):
    llm = ChatOpenAI(
        base_url = "http://172.16.136.144:30005/v1",
        api_key = "local-key"    
    )
    prompt = PromptTemplate.from_template("""
    You are an agent that need to define if a question is a technical code one or general one.
    Question: {input}
    Analyse the question. Only answer with "code" if the question is about technical development. If not just anwer "general".
    Your answer (code/general):
    """)

    chain = prompt | llm 

    response = chain.invoke({"input": state["input"]})

    decision = response.content.strip().lower()

    return {"decision": decision, "input": state["input"]}

# Creating the code agent that could be way more technical
def answer_code_question(state):
    llm = ChatOpenAI(
        base_url = "http://172.16.136.144:30005/v1",
        api_key = "local-key"    
    )
    prompt = PromptTemplate.from_template(
        "You are a software engineer. Answer this question with step by steps details : {input}"
    )
    chain = prompt | llm
    response = chain.invoke({"input": state["input"]})
    return {"output": response}

# Creating the generic agent
def answer_generic_question(state):
    llm = ChatOpenAI(
        base_url = "http://172.16.136.144:30005/v1",
        api_key = "local-key"    
    )
    prompt = PromptTemplate.from_template(
        "Give a general and concise answer to the question: {input}"
    )
    chain = prompt | llm
    response = chain.invoke({"input": state["input"]})
    return {"output": response}
```

在本例中，所有三个代理都使用 OpenAI 的模型。但是，LangGraph 允许在每个代理中集成各种模型、参数和任务。您可以使用更复杂的提示设置这些代理，甚至实现检索增强生成（retrieve - augmented Generation， RAG）技术来改进它们的功能。

#### 创建图

定义了智能体之后，我们将创建一个 graph.py 文件来编排它们的交互。LangGraph 的基本图像结构非常简单，这里我们将使用三个步骤：

- 将节点和我们的智能体关联以此能在图中找到它们
- 定义智能体的激活条件
- 为我们的图建立一个带有入口点和停止点的工作流

```python
from langgraph.graph import StateGraph, END
from typing import Annotated, TypedDict
from agents import analyze_question, answer_code_question, answer_generic_question

#You can precise the format here which could be helpfull for multimodal graphs
class AgentState(TypedDict):
    input: str
    output: str
    decision: str

#Here is a simple 3 steps graph that is going to be working in the bellow "decision" condition
def create_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("analyze", analyze_question)
    workflow.add_node("code_agent", answer_code_question)
    workflow.add_node("generic_agent", answer_generic_question)

    # 当工作流执行到 analyze 步骤的时候
    # 会检查 decision 键对应的值，根据值的不同，工作流会被引导到不同的后续处理节点
    workflow.add_conditional_edges(
        "analyze",
        lambda x: x["decision"],
        {
            "code": "code_agent",
            "general": "generic_agent"
        }
    )

    workflow.set_entry_point("analyze")
    workflow.add_edge("code_agent", END)
    workflow.add_edge("generic_agent", END)

    return workflow.compile()
```

正如你所见，结构简单且易于适应。我们可以添加新的代理，更改条件，修改工作流并创建更复杂的结构来处理特定的生成式 AI 用例。

#### 启动项目

我们将创建一个 main.py 文件，使我们的 LangGraph 项目栩栩如生。这个文件初始化图形，并为我们的第一个交互提供一个接口。

```python
from graph import create_graph
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END

class UserInput(TypedDict):
    input: str 
    continue_conversation: bool 

def get_user_input(state: UserInput) -> UserInput:
    user_input = input("\nEnter your question (use 'q' to quit): ")
    return {
        "input": user_input,
        "continue_conversation": user_input.lower() != 'q'
    }

def process_question(state: UserInput):
    graph = create_graph()
    result = graph.invoke({"input": state["input"]})
    print("\n--- Final answer ---")
    print(result["output"])
    return state

def create_conversation_graph():
    workflow = StateGraph(UserInput)

    workflow.add_node("get_input", get_user_input)
    workflow.add_node("process_question", process_question)

    workflow.set_entry_point("get_input")

    workflow.add_conditional_edges(
        "get_input",
        lambda x: "continue" if x["continue_conversation"] else "end",
        {
            "continue": "process_question",
            "end": END
        }
    )

    workflow.add_edge("process_question", "get_input")

    return workflow.compile()

def main():
    conversation_graph = create_conversation_graph()
    conversation_graph.invoke({"input": "", "continue_conversation": True})

if __name__ == "__main__":
    main()
```



# 05 RAG

## Parse&Chunk




## Re-ranker

### Sentence Embedding. Cross-encoder and Re-ranking

[Sentence Embeddings. Cross-encoders and Re-ranking – hackerllama](https://osanseviero.github.io/hackerllama/blog/posts/sentence_embeddings2/)

Sentence Transformers 支持两种类型的模型：Bi-encoder 和 Cross-encoder。双编码器更快，更可扩展，但是交叉编码器更加准确。尽管两者都处理类似的高级任务，但是何时使用它们是完全不同的。双编码器更适合搜索，交叉编码器更适合分类和高精度排序。

双编码器是将输入文本编码为固定长度向量的模型。当你计算两个句子之间的相似度时，我们通常将两个句子编码为两个向量，然后计算两个向量之间的相似度（例如使用余弦相似度）。我们训练双编码器来增加查询和它相关句子之间的相似度。来减少查询和不相关句子之间的相似度。这就是为什么双编码器更适合搜索。正如前一章节所示，双编码器快速且易于扩展。如果提供多个句子，双编码器将对每个句子进行独立编码。这意味着**句子嵌入是相互独立的**。这对搜索来说是件好事，因为我们可以并行地对数百万个句子进行编码。然而，这也意味着**双编码器对句子之间的关系一无所知**。

当我们使用交叉编码器的时候，我们会做一些不同的事情。交叉编码器同时对两个句子进行编码，然后输出分类分数。

![[Pasted image 20241104235135.png]]

交叉编码器速度较慢，占用更多内存，但也更加准确。交叉编码器是比较几十个句子的绝佳选择。如果我们想要比较数十万个句子，双编码器是更好的选择，否则交叉编码器可能需要花费数小时。如果我们又想要准确性又想要有效地比较数千个句子，该怎么办？这是在玩检索的时候，非常常见的情况。在这样的情况下，一种选择是首先使用双编码器来减少候选的数量（即，获得前 20 个最相关的示例），然后使用交叉编码器来再比较这 20 个句子，然后得到最终答案。这就是重新排序，是信息检索中的一种常见的技术。

考虑到交叉编码器更加准确，对于细微差异很重要的任务来说，交叉编码器大有可为。比如医疗或法律文件，措辞上的细微差异可能会改变句子的意思。

#### Cross-encoder
---
交叉编码器是非常慢的，它将分别比对每一对句子，对两个文本进行编码，然后输出一个分类标签。交叉编码器首先生成单个嵌入去捕获两个句子的表示和它们之间的关系。和双编码器相比，交叉编码器的嵌入是两两互相独立，而双编码器的嵌入是单个之间独立。

> Although cross-encoders have an intermediate embedding before the classification layer, it is not used for similarity search. This is because **the cross-encoder is trained to optimize the classification loss, not the similarity loss**. Hence, the embedding is specific to the classification task and not the similarity task.

这些交叉编码器可以用于不同的任务，例如，对于文章检索的情况（给定一个问题和一篇文章，这篇文章和问题相关吗？）让我们看一个简短的代码片段，其中包含了一个为此训练过的小型交叉编码器模型：

```python
%pip install sentence_transformer dataset
```

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2-v2', max_length=512)

scores = model.predict([('How many people live in Berlin?', 'Berlin had a population of 3,520,031 registered inhabitants in an area of 891.82 square kilometers.'), ('How many people live in Berlin?', 'Berlin is well known for its museums.')])

scores 
# array([ 7.152365 , -6.2870445], dtype=float32)
```

另一个用例，更类似于我们对双编码器所做的，使用交叉编码器来实现语义相似性。例如，给定两个句子，它们在语义上相似吗？虽然我们用双编码器也能处理相同的任务，但请记住，交叉编码器更准确，但速度更慢。

```python
model = CrossEncoder('cross-encoder/stsb-TinyBERT-L-4')
scores = model.predict([("The weather today is beautiful", "It's raining!"), 
                        ("The weather today is beautiful", "Today is a sunny day")])
scores
# array([0.46552283, 0.6350213 ], dtype=float32)
```

#### 检索和重排序
---
现在我们已经知道了交叉编码器和双编码器之间的区别，现在我们将通过进行一个两阶段的检索和重排来进行实践。

Let’s try our luck by implementing a paper search system! We’ll use a [AI Arxiv Dataset](https://huggingface.co/datasets/jamescalam/ai-arxiv-chunked) in an excellent tutorial from [Pinecone](https://www.pinecone.io/learn/series/rag/rerankers/) about rerankers. The goal is to be able to ask AI questions and get relevant paper sections to answer the questions.

```python
from datasets import load_dataset

dataset = load_dataset("jamescalam/ai-arxiv-chunked")
dataset["train"]
```

```

Found cached dataset json (/home/osanseviero/.cache/huggingface/datasets/jamescalam___json/jamescalam--ai-arxiv-chunked-0d76bdc6812ffd50/0.0.0/8bb11242116d547c741b2e8a1f18598ffdd40a1d4f2a2872c7a28b697434bc96)

Dataset({ features: ['doi', 'chunk-id', 'chunk', 'id', 'title', 'summary', 'source', 'authors', 'categories', 'comment', 'journal_ref', 'primary_category', 'published', 'updated', 'references'], num_rows: 41584 })
```

这是一个由 400 篇 Arxiv 论文组成的数据集，这里已经是分好块了的，分块意味着将它们分为更少 token 的块，使得数据集更容易被模型进行操作和管理。让我们看看其中一个例子：

```python
dataset["train"][0]

{'doi': '1910.01108', 
'chunk-id': '0', 
'chunk': 'DistilBERT, a distilled version of BERT: smaller,\nfaster, cheaper and lighter\nVictor SANH, Lysandre DEBUT, Julien CHAUMOND, Thomas WOLF\nHugging Face\n{victor,lysandre,julien,thomas}@huggingface.co\nAbstract\nAs Transfer Learning from large-scale pre-trained models becomes more prevalent\nin Natural Language Processing (NLP), operating these large models in on-theedge and/or under constrained computational training or inference budgets remains\nchallenging. In this work, we propose a method to pre-train a smaller generalpurpose language representation model, called DistilBERT, which can then be ﬁnetuned with good performances on a wide range of tasks like its larger counterparts.\nWhile most prior work investigated the use of distillation for building task-speciﬁc\nmodels, we leverage knowledge distillation during the pre-training phase and show\nthat it is possible to reduce the size of a BERT model by 40%, while retaining 97%\nof its language understanding capabilities and being 60% faster. To leverage the\ninductive biases learned by larger models during pre-training, we introduce a triple\nloss combining language modeling, distillation and cosine-distance losses. Our\nsmaller, faster and lighter model is cheaper to pre-train and we demonstrate its', 
'id': '1910.01108', 
'title': 'DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter', 
'summary': 'As Transfer Learning from large-scale pre-trained models becomes more\nprevalent in Natural Language Processing (NLP), operating these large models in\non-the-edge and/or under constrained computational training or inference\nbudgets remains challenging. In this work, we propose a method to pre-train a\nsmaller general-purpose language representation model, called DistilBERT, which\ncan then be fine-tuned with good performances on a wide range of tasks like its\nlarger counterparts. While most prior work investigated the use of distillation\nfor building task-specific models, we leverage knowledge distillation during\nthe pre-training phase and show that it is possible to reduce the size of a\nBERT model by 40%, while retaining 97% of its language understanding\ncapabilities and being 60% faster. To leverage the inductive biases learned by\nlarger models during pre-training, we introduce a triple loss combining\nlanguage modeling, distillation and cosine-distance losses. Our smaller, faster\nand lighter model is cheaper to pre-train and we demonstrate its capabilities\nfor on-device computations in a proof-of-concept experiment and a comparative\non-device study.', 
'source': 'http://arxiv.org/pdf/1910.01108', 
'authors': ['Victor Sanh', 'Lysandre Debut', 'Julien Chaumond', 'Thomas Wolf'], 
'categories': ['cs.CL'], 
'comment': 'February 2020 - Revision: fix bug in evaluation metrics, updated\n metrics, argumentation unchanged. 5 pages, 1 figure, 4 tables. Accepted at\n the 5th Workshop on Energy Efficient Machine Learning and Cognitive Computing\n - NeurIPS 2019', 'journal_ref': None, 'primary_category': 'cs.CL', 'published': '20191002', 'updated': '20200301', 'references': [{'id': '1910.01108'}]}
```

```python
chunks = dataset["train"]["chunk"]
len(chunks)

# 41584
```

现在我们将使用双编码器将所有的块进行嵌入。我们将长段落截断为 256 个令牌。请注意，短上下文是许多嵌入模型的缺点之一。

We’ll specifically use the [multi-qa-MiniLM-L6-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-MiniLM-L6-cos-v1) model, which is a small-sized model trained to encoder questions and passages into a similar embedding space. This model is a bi-encoder, so it’s fast and scalable.

我们只需要将生成的段落的嵌入一次，因为我们可以将它们保存到磁盘中并稍后再加载它们。在生产环境中，我们可以将嵌入保存到数据库中，并从那里进行加载。

```python
from sentence_transformers import SentenceTransformer

bi_encoder = SentenceTransformer('multi-qa-MinLM-L6-cos-v1')
bi_encoder.max_seq_length = 256

corpus_embeddings = bi_encoder.encode(chunks, convert_to_tensor=True, show_progress_bar=True)
```

```python
from sentence_transformers import util

query = "what is rlhf?"
top_k = 25 # how many chunks to retrieve
query_embedding = bi_encoder.encode(query, convert_to_tensor=True).cuda()

hits = util.semantic_search(query_embedding, corpus_embeddings, top_k=top_k)[0]
hits
```

```
[{'corpus_id': 14679, 'score': 0.6097552180290222}, 
{'corpus_id': 17387, 'score': 0.5659530162811279}, 
{'corpus_id': 39564, 'score': 0.5590510368347168}, 
{'corpus_id': 14725, 'score': 0.5585878491401672}, 
{'corpus_id': 5628, 'score': 0.5296251773834229}, 
{'corpus_id': 14802, 'score': 0.5075011253356934}, 
{'corpus_id': 9761, 'score': 0.49943411350250244}, 
{'corpus_id': 14716, 'score': 0.4931946098804474}, 
{'corpus_id': 9763, 'score': 0.49280521273612976}, 
{'corpus_id': 20638, 'score': 0.4884325861930847}, 
{'corpus_id': 20653, 'score': 0.4873950183391571}, 
{'corpus_id': 9755, 'score': 0.48562008142471313}, 
{'corpus_id': 14806, 'score': 0.4792214035987854}, 
{'corpus_id': 14805, 'score': 0.475425660610199}, 
{'corpus_id': 20652, 'score': 0.4740477204322815}, 
{'corpus_id': 20711, 'score': 0.4703512489795685}, 
{'corpus_id': 20632, 'score': 0.4695567488670349}, 
{'corpus_id': 14750, 'score': 0.46810320019721985}, 
{'corpus_id': 14749, 'score': 0.46809980273246765}, 
{'corpus_id': 35209, 'score': 0.46695172786712646}, 
{'corpus_id': 14671, 'score': 0.46657535433769226}, 
{'corpus_id': 14821, 'score': 0.4637290835380554}, 
{'corpus_id': 14751, 'score': 0.4585301876068115}, 
{'corpus_id': 14815, 'score': 0.45775431394577026}, 
{'corpus_id': 35250, 'score': 0.4569615125656128}]
```

```python
#Let's store the IDs for later
retrieval_corpus_ids = [hit['corpus_id'] for hit in hits]

# Now let's print the top 3 results
for i, hit in enumerate(hits[:3]):
    sample = dataset["train"][hit["corpus_id"]]
    print(f"Top {i+1} passage with score {hit['score']} from {sample['source']}:")
    print(sample["chunk"])
    print("\n")
```

```
Top 1 passage with score 0.6097552180290222 from http://arxiv.org/pdf/2204.05862: 
learning from human feedback, which we improve on a roughly weekly cadence. See Section 2.3. 4This means that our helpfulness dataset goes ‘up’ in desirability during the conversation, while our harmlessness dataset goes ‘down’ in desirability. We chose the latter to thoroughly explore bad behavior, but it is likely not ideal for teaching good behavior. We believe this difference in our data distributions creates subtle problems for RLHF, and suggest that others who want to use RLHF to train safer models consider the analysis in Section 4.4. 5 1071081091010 Number of Parameters0.20.30.40.50.6Mean Eval Acc Mean Zero-Shot Accuracy Plain Language Model RLHF 1071081091010 Number of Parameters0.20.30.40.50.60.7Mean Eval Acc Mean Few-Shot Accuracy Plain Language Model RLHFFigure 3 RLHF model performance on zero-shot and few-shot NLP tasks. For each model size, we plot the mean accuracy on MMMLU, Lambada, HellaSwag, OpenBookQA, ARC-Easy, ARC-Challenge, and TriviaQA. On zero-shot tasks, RLHF training for helpfulness and harmlessness hurts performance for small 

Top 2 passage with score 0.5659530162811279 from http://arxiv.org/pdf/2302.07842: 
preferences and values which are diﬃcult to capture by hard- coded reward functions. RLHF works by using a pre-trained LM to generate text, which i s then evaluated by humans by, for example, ranking two model generations for the same prompt. This data is then collected to learn a reward model that predicts a scalar reward given any generated text. The r eward captures human preferences when judging model output. Finally, the LM is optimized against s uch reward model using RL policy gradient algorithms like PPO ( Schulman et al. ,2017). RLHF can be applied directly on top of a general-purpose LM pre-trained via self-supervised learning. However, for mo re complex tasks, the model’s generations may not be good enough. In such cases, RLHF is typically applied afte r an initial supervised ﬁne-tuning phase using a small number of expert demonstrations for the correspondi ng downstream task ( Ramamurthy et al. ,2022; Ouyang et al. ,2022;Stiennon et al. ,2020). A successful example of RLHF used to teach a LM to use an extern al tool stems from WebGPT Nakano et al. (2021) (discussed in 3.2.3), a model capable of answering questions using a search engine and providing 

Top 3 passage with score 0.5590510368347168 from http://arxiv.org/pdf/2307.09288: 
31 5 Discussion Here, we discuss the interesting properties we have observed with RLHF (Section 5.1). We then discuss the limitations of L/l.sc/a.sc/m.sc/a.sc /two.taboldstyle-C/h.sc/a.sc/t.sc (Section 5.2). Lastly, we present our strategy for responsibly releasing these models (Section 5.3). 5.1 Learnings and Observations Our tuning process revealed several interesting results, such as L/l.sc/a.sc/m.sc/a.sc /two.taboldstyle-C/h.sc/a.sc/t.sc ’s abilities to temporally organize its knowledge, or to call APIs for external tools. SFT (Mix) SFT (Annotation) RLHF (V1) 0.0 0.2 0.4 0.6 0.8 1.0 Reward Model ScoreRLHF (V2) Figure 20: Distribution shift for progressive versions of L/l.sc/a.sc/m.sc/a.sc /two.taboldstyle-C/h.sc/a.sc/t.sc , from SFT models towards RLHF. Beyond Human Supervision. At the outset of the project, many among us expressed a preference for
```

很好，我们使用双编码器得到了高召回率但是低精度的结果。现在，让我们使用更高的精度的交叉编码器模型重新排序。

Now, let’s re-rank by using a higher-accuracy cross-encoder model. We’ll use the [cross-encoder/ms-marco-MiniLM-L-6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2) model. This model was trained with the MS MARCO Passage Retrieval dataset, a large dataset with real search questions and their relevant text passages. That makes the model quite suitable for making predictions using questions and passages.

我们将使用相同的问题和从双编码器中获得的前十个块进行成对匹配。

```python
from sentence_transformers import CrossEncoder

cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

cross_inp = [[query, chunks][hit['corpus_id']]] for hit in hits]
cross_scores = cross_encoder.predict(cross_inp)
cross_scores
```

```
array([ 1.2227577 , 5.048051 , 1.2897239 , 2.205767 , 4.4136825 , 1.2272772 , 2.5638275 , 0.81847703, 2.35553 , 5.590804 , 1.3877895 , 2.9497519 , 1.6762824 , 0.7211323 , 0.16303705, 1.3640019 , 2.3106787 , 1.5849439 , 2.9696884 , -1.1079378 , 0.7681126 , 1.5945492 , 2.2869687 , 3.5448399 , 2.056368 ], dtype=float32)
```

```python
for idx in range(len(cross_scores)):
    hits[idx]['cross-score'] = cross_scores[idx]
hits = sorted(hits, key=lambda x: x['cross-score'], reverse=True)
msmarco_l6_corpus_ids = [hit['corpus_id'] for hit in hits] # save for later

hits
```

```
[{'corpus_id': 20638, 'score': 0.4884325861930847, 'cross-score': 5.590804}, {'corpus_id': 17387, 'score': 0.5659530162811279, 'cross-score': 5.048051}, {'corpus_id': 5628, 'score': 0.5296251773834229, 'cross-score': 4.4136825}, {'corpus_id': 14815, 'score': 0.45775431394577026, 'cross-score': 3.5448399}, {'corpus_id': 14749, 'score': 0.46809980273246765, 'cross-score': 2.9696884}, {'corpus_id': 9755, 'score': 0.48562008142471313, 'cross-score': 2.9497519}, {'corpus_id': 9761, 'score': 0.49943411350250244, 'cross-score': 2.5638275}, {'corpus_id': 9763, 'score': 0.49280521273612976, 'cross-score': 2.35553}, {'corpus_id': 20632, 'score': 0.4695567488670349, 'cross-score': 2.3106787}, {'corpus_id': 14751, 'score': 0.4585301876068115, 'cross-score': 2.2869687}, {'corpus_id': 14725, 'score': 0.5585878491401672, 'cross-score': 2.205767}, {'corpus_id': 35250, 'score': 0.4569615125656128, 'cross-score': 2.056368}, {'corpus_id': 14806, 'score': 0.4792214035987854, 'cross-score': 1.6762824}, {'corpus_id': 14821, 'score': 0.4637290835380554, 'cross-score': 1.5945492}, {'corpus_id': 14750, 'score': 0.46810320019721985, 'cross-score': 1.5849439}, {'corpus_id': 20653, 'score': 0.4873950183391571, 'cross-score': 1.3877895}, {'corpus_id': 20711, 'score': 0.4703512489795685, 'cross-score': 1.3640019}, {'corpus_id': 39564, 'score': 0.5590510368347168, 'cross-score': 1.2897239}, {'corpus_id': 14802, 'score': 0.5075011253356934, 'cross-score': 1.2272772}, {'corpus_id': 14679, 'score': 0.6097552180290222, 'cross-score': 1.2227577}, {'corpus_id': 14716, 'score': 0.4931946098804474, 'cross-score': 0.81847703}, {'corpus_id': 14671, 'score': 0.46657535433769226, 'cross-score': 0.7681126}, {'corpus_id': 14805, 'score': 0.475425660610199, 'cross-score': 0.7211323}, {'corpus_id': 20652, 'score': 0.4740477204322815, 'cross-score': 0.16303705}, {'corpus_id': 35209, 'score': 0.46695172786712646, 'cross-score': -1.1079378}]
```

如上所述，交叉编码器与双向编码器不太一致。令人惊讶的是，一些顶级交叉编码器结果（14815 和 14749）具有最低的双编码器分数。这是有意义的，双向编码器比较问题和嵌入空间中的文档的相似性，而交叉编码器考虑问题和文档之间的关系。

```python
for i, hit in enumerate(hits[:3]):
    sample = dataset["train"][hit["corpus_id"]]
    print(f"Top {i+1} passage with score {hit['cross-score']} from {sample['source']}:")
    print(sample["chunk"])
    print("\n")
```

```
Top 1 passage with score 0.9668010473251343 from http://arxiv.org/pdf/2204.05862: Stackoverflow Good Answer vs. Bad Answer Loss Difference Python FT Python FT + RLHF(b)Difference in mean log-prob between good and bad answers to Stack Overﬂow questions. Figure 37 Analysis of RLHF on language modeling for good and bad Stack Overﬂow answers, over many model sizes, ranging from 13M to 52B parameters. Compared to the baseline model (a pre-trained LM ﬁnetuned on Python code), the RLHF model is more capable of distinguishing quality (right) , but is worse at language modeling (left) . the RLHF models obtain worse loss. This is most likely due to optimizing a different objective rather than pure language modeling. B.8 Further Analysis of RLHF on Code-Model Snapshots As discussed in Section 5.3, RLHF improves performance of base code models on code evals. In this appendix, we compare that with simply prompting the base code model with a sample of prompts designed to elicit helpfulness, harmlessness, and honesty, which we refer to as ‘HHH’ prompts. In particular, they contain a couple of coding examples. Below is a description of what this prompt looks like: Below are a series of dialogues between various people and an AI assistant. The AI tries to be helpful, 

Top 2 passage with score 0.9574587345123291 from http://arxiv.org/pdf/2302.07459: 
We examine the inﬂuence of the amount of RLHF training for two reasons. First, RLHF [13, 57] is an increasingly popular technique for reducing harmful behaviors in large language models [3, 21, 52]. Some of these models are already deployed [52], so we believe the impact of RLHF deserves further scrutiny. Second, previous work shows that the amount of RLHF training can signiﬁcantly change metrics on a wide range of personality, political preference, and harm evaluations for a given model size [41]. As a result, it is important to control for the amount of RLHF training in the analysis of our experiments. 3.2 Experiments 3.2.1 Overview We test the effect of natural language instructions on two related but distinct moral phenomena: stereotyping and discrimination. Stereotyping involves the use of generalizations about groups in ways that are often harmful or undesirable.4To measure stereotyping, we use two well-known stereotyping benchmarks, BBQ [40] (§3.2.2) and Windogender [49] (§3.2.3). For discrimination, we focus on whether models make disparate decisions about individuals based on protected characteristics that should have no relevance to the outcome.5 To measure discrimination, we construct a new benchmark to test for the impact of race in a law school course 

Top 3 passage with score 0.9408788084983826 from http://arxiv.org/pdf/2302.07842: 
preferences and values which are diﬃcult to capture by hard- coded reward functions. RLHF works by using a pre-trained LM to generate text, which i s then evaluated by humans by, for example, ranking two model generations for the same prompt. This data is then collected to learn a reward model that predicts a scalar reward given any generated text. The r eward captures human preferences when judging model output. Finally, the LM is optimized against s uch reward model using RL policy gradient algorithms like PPO ( Schulman et al. ,2017). RLHF can be applied directly on top of a general-purpose LM pre-trained via self-supervised learning. However, for mo re complex tasks, the model’s generations may not be good enough. In such cases, RLHF is typically applied afte r an initial supervised ﬁne-tuning phase using a small number of expert demonstrations for the correspondi ng downstream task ( Ramamurthy et al. ,2022; Ouyang et al. ,2022;Stiennon et al. ,2020). A successful example of RLHF used to teach a LM to use an extern al tool stems from WebGPT Nakano et al. (2021) (discussed in 3.2.3), a model capable of answering questions using a search engine and providing
```

看起来好了不少，但是实际上我们刚刚使用的交叉编码器已经三岁了，我们应该找点新的模型去做我们的工作。

> To pick a model, I suggest going to the [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard), clicking reranking, and selecting a good model that meets your requirements.

一些较老的模型并不在上面。此外，并非所有的这些模型都是交叉编码器，所以需要进行实验去检测是否值得承受慢速去添加重排序。
1. [E5 Mistral 7B Instruct](https://huggingface.co/intfloat/e5-mistral-7b-instruct) (Dec 2023): This is a decoder-based embedder (not an encoder-based one as we learned before!). This means the model is massive for most applications (it has 7B params, which is two orders of magnitude higher than MiniLM!). This one is interesting because of the new trend of using decoder models rather than encoders, which could enable working with longer contexts. [Here](https://huggingface.co/papers/2401.00368) is the paper.
2. [BAAI Reranker](https://huggingface.co/BAAI/bge-reranker-base) (Sep 2023): A high-quality re-ranking model with a decent size (278M parameters). Let’s get the results with this and compare!

#### BAAI Reranker

```python
# Same code as before, just different model
cross_encoder = CrossEncoder('BAAI/bge-reranker-base')

cross_inp = [[query, chunks[hit['corpus_id']]] for hit in hits]
cross_scores = cross_encoder.predict(cross_inp)

for idx in range(len(cross_scores)):
    hits[idx]['cross-score'] = cross_scores[idx]

hits = sorted(hits, key=lambda x: x['cross-score'], reverse=True)
bge_corpus_ids = [hit['corpus_id'] for hit in hits]
for i, hit in enumerate(hits[:3]):
    sample = dataset["train"][hit["corpus_id"]]
    print(f"Top {i+1} passage with score {hit['cross-score']} from {sample['source']}:")
    print(sample["chunk"])
    print("\n")
```

Let’s compare the ranking of the three models:

```python
for i in range(25):
	print(f"Top {i+1} passage. Bi-encoder {retrival_corpus_ids[i]}, Cross-encoder (MS Marco) {msmarco_l6_corpus_ids[i]}, BGE {bge_corpus_ids[i]}")
```

```
Top 1 passage. Bi-encoder 14679, Cross-encoder (MS Marco) 20638, BGE 14815 
Top 2 passage. Bi-encoder 17387, Cross-encoder (MS Marco) 17387, BGE 20638 
Top 3 passage. Bi-encoder 39564, Cross-encoder (MS Marco) 5628, BGE 17387 
Top 4 passage. Bi-encoder 14725, Cross-encoder (MS Marco) 14815, BGE 14679 
Top 5 passage. Bi-encoder 5628, Cross-encoder (MS Marco) 14749, BGE 9761 
Top 6 passage. Bi-encoder 14802, Cross-encoder (MS Marco) 9755, BGE 39564 
Top 7 passage. Bi-encoder 9761, Cross-encoder (MS Marco) 9761, BGE 20632 
Top 8 passage. Bi-encoder 14716, Cross-encoder (MS Marco) 9763, BGE 14725 
Top 9 passage. Bi-encoder 9763, Cross-encoder (MS Marco) 20632, BGE 9763 
Top 10 passage. Bi-encoder 20638, Cross-encoder (MS Marco) 14751, BGE 14750 
Top 11 passage. Bi-encoder 20653, Cross-encoder (MS Marco) 14725, BGE 14805 
Top 12 passage. Bi-encoder 9755, Cross-encoder (MS Marco) 35250, BGE 9755 
Top 13 passage. Bi-encoder 14806, Cross-encoder (MS Marco) 14806, BGE 14821 
Top 14 passage. Bi-encoder 14805, Cross-encoder (MS Marco) 14821, BGE 14802 
Top 15 passage. Bi-encoder 20652, Cross-encoder (MS Marco) 14750, BGE 14749 
Top 16 passage. Bi-encoder 20711, Cross-encoder (MS Marco) 20653, BGE 5628 
Top 17 passage. Bi-encoder 20632, Cross-encoder (MS Marco) 20711, BGE 14751 
Top 18 passage. Bi-encoder 14750, Cross-encoder (MS Marco) 39564, BGE 14716 
Top 19 passage. Bi-encoder 14749, Cross-encoder (MS Marco) 14802, BGE 14806 
Top 20 passage. Bi-encoder 35209, Cross-encoder (MS Marco) 14679, BGE 20711 
Top 21 passage. Bi-encoder 14671, Cross-encoder (MS Marco) 14716, BGE 20652 
Top 22 passage. Bi-encoder 14821, Cross-encoder (MS Marco) 14671, BGE 14671 
Top 23 passage. Bi-encoder 14751, Cross-encoder (MS Marco) 14805, BGE 20653 
Top 24 passage. Bi-encoder 14815, Cross-encoder (MS Marco) 20652, BGE 35209 
Top 25 passage. Bi-encoder 35250, Cross-encoder (MS Marco) 35209, BGE 35250
```

Interesting, we get very different results! Let’s briefly look into some of them.

> I suggest doing something like `dataset["train"][20638]["chunk"]` to print a particular result. Here is a quick summary of the results.

The bi-encoder is good at getting some results related to RLHF, but it’s struggling to get good, precise passages responding to what RLHF is. I looked at the top 5 results for each model. From looking at the passages, 17387 and 20638 are the only passages that really answer the question. Although the three models agree that 17387 is highly relevant, it’s interesting that the bi-encoder ranks 20638 lowly, while the two cross-encoders rank it highly. You can find them here.

![[Pasted image 20241105101505.png]]

`llamaindex` allows you to use a `VectorIndexRetriever` to retrieve and a `LLMRerank` to rerank (see [tutorial](https://docs.llamaindex.ai/en/stable/examples/node_postprocessor/LLMReranker-Lyft-10k.html))

> 当然你也可以使用大模型进行重排序，[OpenAI’s Coobook](https://cookbook.openai.com/examples/search_reranking_with_cross-encoders) 里面有这样的例子，这是昂贵的且也很慢，看你需要了。
> 使用大模型进行重排序的唯一好处可能就在于，它可以接受较长的上下文，在这一点上基于 bert 的模型是很挣扎的。

### BGE-Reranker
---
详细请看 [[01 LLM#BGEReranker|BGEReranker]]
我们会在哪里讨论它的原理和如何对它进行微调。








### 参考资料

[Rerank 模型的部署及使用 - Hacker and Geeker's Way](https://zhaozhiming.github.io/2024/01/18/rerank-model-deploy-and-usage/)







## Self-RAG

我们通过一个小例子来讲述一下 Self-RAG 的概念。

设想一下，你在参见一次开卷考试，通常来说我们有两种策略去应对考试：
- 对于熟悉的考题，快速回答，对于不熟悉的考题，打开参考书，快速找到相关的内容，在脑海里面排列和总结它们，然后在考卷上回答。
- 对于所有的考题，都参考书中内容，找到相关的内容，在心里整理和总结，然后答卷。

显然方法一是更合适的办法，方法二则太耗时了，同时也可能找到大量不相关的内容去干扰你的答卷，甚至可能你已经懂的内容也被这样一圈下来你又不懂了。

实际上，方法一就是我们今天要讲的 Self-RAG。

![[Pasted image 20241105125855.png]]

自 RAG 简单来说包含三个步骤：
1. 只在必要的时候检索：当模型需要检索的时候，比如遇到像 “美国的州是怎么获取它们的名字？” 这样的问题的时候，模型会处理这样的提示词然后输出一个带有 `[Retireve]` 的令牌。这意味着和这个查询有关的内容需要被检索。相反的，当遇到像 “请为你最好的一次暑假写一篇短文” 这样的提示词的时候，模型将倾向于直接返回生成文本，而不会去检索。
2. 平行的生成
3. 评估和选择

请注意，上面所说的模型是被特殊训练过的模型。它的训练过程我们将在后面提及。

#### Reflection Tokens

和传统的 RAG 不同的是，Self-RAG 架构使用反射令牌来为文本生成进行更准确的控制。
![[Pasted image 20241105130641.png]]
这就是你需要理解的 Self-RAG 理论的全部了，现在我们来看看代码。

#### 代码实施

https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_crag.ipynb

我们再来回顾一下整体的步骤：

1. 我应该利用检索器进行检索吗？
- Input: `x (question)` OR `x (question)`, `y (generation)`
- Decides when to retrieve `D` chunks with `R`
- Output: `yes, no, continue`
2. 检索得到的片段 `D` 是否和问题 `x` 相关
- Input: (`x (question)`, `d (chunk)`) for `d` in `D`
- `d` provides useful information to solve `x`
- Output: `relevant, irrelevant`
3. 基于 `D` 中每个块的大模型生成是否和检索到的片段相关（可能有幻觉什么的）
- Input: `x (question)`, `d (chunk)`, `y (generation)` for `d` in `D`
- All of the verification-worthy statements in `y (generation)` are supported by `d`
- Output: `{fully supported, partially supported, no support`
4. 是否大模型基于 `D` 中检索内容的生成文本是对 `x (question)` 的有用响应。
- Input: `x (question)`, `y (generation)` for `d` in `D`
- `y (generation)` is a useful response to `x (question)`.
- Output: `{5, 4, 3, 2, 1}`

We will implement some of these ideas from scratch using [LangGraph](https://langchain-ai.github.io/langgraph/).

![[Pasted image 20241105143459.png]]

##### 检索器

让我们为三篇博客添加索引

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import Milvus
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

urls = [
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
    "https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/",
]

docs = [WebBaseLoader(url).load() for url in urls]
docs_list = [item for sublist in docs for item in sublist]

# from_tiktoken_encoder 方法意味着使用 tiktokener 的分词器
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
	chunk_size = 250, chunk_overlap = 0
)

doc_splits = text_splitter.split_documents(docs_list)

from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# 使用本地模型路径
model_name = "/data4/model/bge-m3"  # 本地模型路径
model_kwargs = {'device': 'npu:7'}
encode_kwargs = {'normalize_embeddings': True}

# langchain_community.embeddings.HuggingFaceBgeEmbeddings 方法可以改造本地嵌入模型以适配 langchain vector_store
hf = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

vectorstore = Milvus.from_documents(
	documents=docs_splits,
	collection_name='self-rag-milvus',
	embedding=hf
)
```

##### 大模型

```python
### Retrieval Grader

from langchain_core_prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

class GradeDocuments(BaseModel):
	"""对检索到的文档进行相关性检查的二进制分数。"""

	binary_score: str = Field(
		decription="Documents are relevant to the question, 'yes' or 'no'"
	)

# LLM with function call 
llm = ChatOpenAI(
	base_url="http://172.16.136.144:30005/v1",
	api_key="local-key"
)

structured_llm_grader = llm.with_structured_output(GradeDocuments)

# Prompt
system = """
You are a grader assessing relevance of a retriever document to user question. \n
It does not need to be a stringent test. The goal is to filter out erroneous retrievals. \n
If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n
Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.
"""

grade_prompt = ChatPromptTemplate.from_messages(
	[
		("system", system)
		("human", "Retrieved document: \n\n {document} \n\n User question: {question}")
	]
)

retrieval_grader = grade_prompt | structured_llm_grader 
question = "agent memory"
docs = retriever.get_relevant_document(question)
doc_txt = docs[1].page_content
print(retrieval_grader.invoke({"question": question, "document": doc_txt}))
```

```python
### Generate

from langchain import hub
from langchain_core.output_parsers import StrOutputParser

# Prompt
prompt = hub.pull("rlm/rag-prompt")

# LLM
llm = ChatOpenAI(
	base_url="http://172.16.136.144:30005/v1",
	api_key="local-key"
)

# Post-processing
def format_docs(docs):
	return "\n\n".join(docs.page_content for doc in docs)

# Chain 
rag_chain = prompt | llm | StrOutputParser()

# Run
generation = rag_chain.invoke({"content": docs, "question": question})

print(generation)
```

```
The design of generative agents combines LLM with memory, planning, and reflection mechanisms to enable agents to behave conditioned on past experience and interact with other agents. Long-term memory provides the agent with the capability to retain and recall infinite information over extended periods. Short-term memory is utilized for in-context learning.
```


```python
### Hallucination Grader

# Data model

class GradeHallucinations(BaseModel):
    """Binary score for hallucination present in genration answer."""

    binary_scores: str = Field(
        description="Answer is grounded in the facts, 'yes' or 'no'"
    )

    
```



##### 构建图

让我们将上述工作流做成图的形式进行运作。

###### Graph state

```python
from typing import List

from typing_extensions import TypedDict 

class GraphState(TypedDict)
    """
    Represents the state of graph.

    Attributes:
        question: question
        generation: LLM generation
        documents: List of documents
    """

    question: str 
    generation: str 
    documents: List[str]
```

```python
### Node 

def retrieve(state):
    """
    Retrieve documents

    Args:
        state(dict): The current graph state

    Returns:
        state(dict): New key added to state, documents, that contains retireved documents
    """

    print("---RERIEVE---")
    question = state['question']

    # Retrieval
    documents = retriever.get_relevant_documents(question)
    return {"documents": documents, "question": question}

def generate(state):
    """
    Generate answer

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, generation, that contains LLM generation
    """
    print("---GENERATE---")
    question = state["question"]
    documents = state["documents"]

    # RAG generation
    generation = rag_chain.invoke({"context": documents, "question": question})
    return {"documents": documents, "question": question, "generation": generation}


```




## CRAG

CRAG 设计了一个轻量级的检索评估器，以评估特定查询所检索出的文档的整体质量。它还使用 web 搜索作为辅助工具来提高检索质量。

有一点很好 CRAG 是即插即用的（plug and play），允许和基于 RAG 的各种方法无缝集成。总体架构如下图所示：

![[Pasted image 20241105231455.png]]

CRAG 实际上通过介绍一种**检索评估器来检测检索出来的文档和查询之间的关系**来以此增强传统 RAG 的能力。 它通常会返回三种可能的评判结果：

1. 如果它返回 correct ，这意味着检索出来的文档包含有查询所需要的必要内容，然后它会对这些文档进行一个 konwledge refinement 知识增强的算法，去重写这些检索到的文档。
2. 如果返回的是 incorrect ，那么这意味着检索出来的是不相关的。显然，这些内容不能给大模型，在 CRAG 中我们将启动一个网页搜索引擎去检索出额外的知识来给大模型使用。
3. 如果返回的是 ambiguous ，这种情况下说明检索到的相关但不多。所以还是需要网页搜索的帮助，但是同时也要进行知识增强算法。

经过上述步骤之后，经过处理的信息会被移交给大模型去处理，让它进行答案的生成。我们来看一个伪代码，再对这个步骤进行一次加深：

![[Pasted image 20241105232817.png]]

值得注意的是网页搜索不是直接使用用户给的查询，而是将查询通过提示词给到大模型，在 few-shot 的帮助下获得我们想要的查询格式，再去给到搜索。

在获得了一个整体的对 CRAG 的概念之后，让我们开始对 CRAG 的核心部分进行逐个击破。

### 检索评估器

CRAG 使用一个轻量的 [[01 LLM#T5-large-model]] 作为检索评估器并且对其进行了微调。值得注意的是在大模型时代，T5-large 也被认为是轻量级别的。

对于每个查询，每次我们检索出十份文档，然后我们将查询单独和每个文档进行连接，作为输入，以预测它们之间的相关性。在微调的过程中，给正样本指定 1 的标签，给负样本指定 -1 的标签。在推理过程中，评估器为每个文档分配相关性分数，从 -1 到 1 不等。

这些分数将根据阈值分为三个等级，显然，这种分类需要两个门槛。在 CRAG 中，阈值的设置可能会根据实验数据而有所不同：

> *The two confidence thresholds for triggering one of the three actions were set empirically. Specifically, they were set as (0.59, -0.99) in PopQA, (0.5, -0.91) in PubQA and ArcChallenge, as well as (0.95, -0.91) in Biography.*

### 知识增强算法

对于检索到的相关文档，CRAG 设计了分解-再重组的知识抽取方法，进一步抽取最关键的知识语句。首先应用启发式规则将每个文档分解为细粒度的知识带，以此获得细粒度的结果。如果说检索到的文档只有一到两个句子，它就被认为是一个独立的单元。否则，文档会被划分为更小的单元，通常只由几个句子组成，具体取决于总长度。但是无论怎么样，每个单元都应该包含一个独立的信息。

然后，利用检索评估器计算每个知识条 konwledge strip 的相关性得分。相关性低的知识条会被过滤掉，剩余的相关性知识条会被重新组合，以形成内部知识。

### 代码实操



## MemoRAG

[Teaching RAG to “Remember”: How MemoRAG Enhances Question-Answering Through Memory | by Florian June | Sep, 2024 | Towards AI](https://medium.com/towards-artificial-intelligence/teaching-rag-to-remember-how-memorag-enhances-question-answering-through-memory-76ba4e6b946f)

https://github.com/qhjqhj00/MemoRAG/tree/3a9501f9cb285dafa5fd4dbd742c401e3946868d

现有的 RAG（Retrieval-Augmented Generation）系统在处理复杂或模糊的信息需求时存在局限性，这些需求无法直接从外部数据库中检索。例如，传统的 RAG 系统在结构良好的问答任务中表现出色，但在任务需要对底层查询有隐含理解或涉及非结构化数据检索时则显得力不从心。

一项新的研究，“MemoRAG”，旨在通过利用长期记忆系统来解决这一问题，该系统可以根据上下文召回相关信息，显著提高复杂任务的检索效率。

本文首先概述了 MemoRAG，然后通过代码分析解释其原理。接下来，详细介绍了训练过程，并展示了评估结果和案例研究。最后，我将分享我对这种方法的看法和见解，包括与 GraphRAG 的比较。

**概述**

如下图所示，左侧的标准 RAG 模型由于输入查询的隐式性质，难以准确地定位必要的证据，导致答案不够精准。相比之下，右侧的 MemoRAG 模型在整个数据库中构建了一个全局记忆。当接受到查询时，MemoRAG 首先回忆相关线索，从而能够检索到有用的信息，生成精确且全面的答案。

![[Pasted image 20241124124654.webp]]

_图1：在处理需要对整个数据库进行高层次理解的查询时，标准 RAG 与 MemoRAG 的对比，以《哈利·波特》系列书籍作为数据库。资料来源：MemoRAG。

传统的 RAG 方法严重依赖词汇和语义匹配，这在处理隐式信息需求时可能会不足。相比之下， MemoRAG 使用一种轻量但长距离的语言模型（LLM）来构建数据库的全局记忆，使其能够回忆关键信息并生成全面的响应。其基于记忆的机制使其能够更有效地处理模糊查询和非结构化知识。

MemoRAG 的底层逻辑如下：

当接收到用户查询时，MemoRAG 首先根据记忆生成线索和潜在的（草稿）答案。然后，它通过检索器补充这些答案的详细信息，最终生成完整的响应。换句话说，它基于记忆从复杂数据中解锁隐藏的洞察。

本节将详细分析 MemoRAG 背后的原理，并参考其 [开源代码](https://github.com/qhjqhj00/MemoRAG/tree/3a9501f9cb285dafa5fd4dbd742c401e3946868d)。让我们先来看看如何使用 MemoRAG。

### 使用指南

**安装**

```shell
pip install torch==2.3.1
conda install -c pytorch -c nvidia faiss-gpu=1.8.0
```

```shell
pip install memorag
```

#### 基本使用

MemoRAG 使用起来非常简单，可以直接使用 HuggingFace 模型进行初始化。通过使用 MemoRAG.memorize() 方法，记忆模型可以在长输入上下文中构建全局记忆。经验上，默认参数设置下，TommyChien/memorag-qwen2-7b-inst 可以处理长达 400K 个令牌的上下文，而 TommyChien/memorag-mistral-7b-inst 则可以处理长达 128K 个令牌的上下文。通过增加 beacon_ratio 参数，模型处理更长上下文的能力可以进一步扩展。例如，将 beacon_ratio 设置为 16 时，TommyChien/memorag-qwen2-7b-inst 可以处理多达一百万个令牌的上下文。

```python
# 导入 MemoRAG 模块
from memorag import MemoRAG

# 初始化 MemoRAG 管道
pipe = MemoRAG(
    mem_model_name_or_path="TommyChien/memorag-mistral-7b-inst",  # 指定记忆模型的名称或路径
    ret_model_name_or_path="BAAI/bge-m3",  # 指定检索模型的名称或路径
    gen_model_name_or_path="mistralai/Mistral-7B-Instruct-v0.2",  # 可选：指定生成模型的名称或路径，如果不指定，则使用记忆模型作为生成器
    cache_dir="path_to_model_cache",  # 可选：指定本地模型缓存目录
    access_token="hugging_face_access_token",  # 可选：Hugging Face 访问令牌
    beacon_ratio=4  # 设置 beacon_ratio 参数，用于扩展模型处理长上下文的能力
)

# 读取上下文文件内容
context = open("examples/harry_potter.txt").read()

# 定义查询
query = "How many times is the Chamber of Secrets opened in the book?"

# 将上下文记忆化并保存到缓存目录
pipe.memorize(context, save_dir="cache/harry_potter/", print_stats=True)

# 使用记忆化的上下文生成响应
res = pipe(context=context, query=query, task_type="memorag", max_new_tokens=256)

# 打印 MemoRAG 生成的答案
print(f"MemoRAG generated answer: \n{res}")
```

当运行上述代码时，编码的键值（KV）缓存、Faiss 索引和分段的段落将存储在指定的 `save_dir` 中。之后，如果再次使用相同的上下文，数据可以从磁盘快速加载：

```python
pipe.load("cache/harry_potter/", print_stats=True)
```

通常，加载缓存的数据是非常高效的。例如，使用 `TommyChien/memorag-qwen2-7b-inst` 作为记忆模型，对一个包含 200K 个令牌的上下文进行编码、分段和索引大约需要 35 秒，而从缓存文件中加载仅需 1.5 秒。







### 训练记忆模型

[【深度好文】你必须要知道-大模型的上下文窗口(Context Window )_大模型上下文窗口-CSDN博客](https://blog.csdn.net/longxiaotian718/article/details/142454916?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_baidulandingword~default-1-142454916-blog-135624772.235^v43^pc_blog_bottom_relevance_base6&spm=1001.2101.3001.4242.2&utm_relevant_index=4)

MemoRAG 中的记忆模块对于有效存储和召回大量信息至关重要。其训练涉及两个关键阶段：预训练和监督微调（SFT）。

1. **使用长上下文进行预训练** 在预训练阶段，记忆模型通过使用 RedPajama 数据集中的长上下文数据，学习将原始输入压缩成记忆标记。这一过程使模型能够在保留重要语义信息的同时丢弃不太相关的细节。本质上，它模仿了人类在阅读长篇文章后记住关键点的方式。
    
2. **监督微调（SFT）** 预训练之后，记忆模块进行监督微调，其中模型在包含查询及其对应答案的标注数据集上进行训练。 这一阶段的重点是生成特定任务的线索，以指导信息检索。例如，在金融分析任务中，模型可能会生成诸如“收入增长”之类的线索，帮助检索相关信息。

用于 SFT 的标注数据集是通过如下的六个步骤构建的。

**构建 SFT 标注数据集的步骤

1. **数据收集**
   - 从各种来源收集长上下文：小说、学术论文、新闻文章、财务报告和法律合同。利用现有数据集，如 NarrativeQA、Qasper 和 HotpotQA。

2. **抽取长上下文**
   - 抽取长度高达 80,000 个令牌的长上下文，以确保生成问答对时有丰富的信息。

3. **生成问题-回答对**
   - 提示高级语言模型（例如，GPT-4 128K、Deepseek-v2-128K），根据抽样的上下文创建有见地的问题-回答对。

4. **质量检查**
   - 对生成的问题-回答对进行质量检查，并选择 20,000 个高质量样本以供进一步处理。

5. **生成答案线索**
   - 使用选定的样本提示相同的语言模型，生成连接查询到长上下文的回答线索。向模型提供查询、上下文和答案。

6. **最终过滤**
   - 检查并战略性地筛选生成的回答线索以提高质量，结果得到 17,116 个最终 SFT 训练样本。

**评估

MemoRAG 使用一个名为 ULTRADOMAIN 的综合基准进行了评估，该基准包括来自法律、金融和教育等不同领域的任务。

![[Pasted image 20241124121431.webp]]

_图 7：在 ULTRADOMAIN 数据集上使用 Mistral-7B-Instruct-v0.2–32K 作为生成器的主要实验结果。评估指标是 F1 分数，最佳结果以粗体突出显示，次佳结果则下划线标注。向上的箭头 ↑ 表示相对于次佳结果的提升。ave(|C|) 指的是平均上下文长度，以千个标记（K）为单位计算。资料来源：MemoRAG。

如图 7 所示，MemoRAG 在处理涉及长输入上下文和隐式信息需求的任务方面优于传统的 RAG 模型。例如，在法律和金融任务中，MemoRAG 相比其他模型实现了显著更高的准确率和精确度。这证明了 MemoRAG 在复杂和简单的问题回答任务中的有效性。

### 总结


## RankRAG

The existing RAG pipelines face significant limitations:现有的RAG管道面临着重大的限制：

1. **Limited Retriever Capacity**: Existing retrievers, like BM25 or BERT-based models, struggle to accurately match questions with relevant contexts, particularly in new tasks or domains.有限的检索器能力：现有的检索器，如BM25或基于bert的模型，很难将问题与相关上下文准确匹配，特别是在新的任务或领域中。
2. **Trade-off in Top-k Selection**: Increasing the number of retrieved contexts (k) can improve recall but often introduces irrelevant or noisy information, which can mislead the LLM during answer generation.Top-k选择中的权衡：增加检索到的上下文(k)的数量可以提高召回率，但往往会引入不相关或噪声信息，这些信息会在答案生成过程中误导LLM。
3. **Ineffective Ranking Models**: Separate ranking models used in RAG pipelines often fail to capture query-context relevance effectively and lack strong generalization capabilities, particularly in zero-shot scenarios.无效的排名模型：在RAG管道中使用的单独排名模型通常不能有效地捕获查询上下文相关性，并且缺乏强大的泛化能力，特别是在零样本场景中。

例如，考虑使用大型文档数据库回答复杂问题的任务。传统的方法（如 RAG 方法）可能会检索到太多无关的段落，这会使模型负担过重，从而降低生成答案的质量。这种情况类似于在巨大的草堆中寻找一根针，即使是最强大的大语言模型（LLM）也难以高效地找到这根针。

图1展示了在选择较小的 top-k 上下文集和增加 k 时引入无关或噪声上下文之间的权衡，突显了需要一种更有效的上下文排序机制。

![[Pasted image 20241126102558.webp]]

_图1：ChatQA-1.5（最强的 RAG 模型之一）在不同上下文大小 k 下的性能。我们观察到选择 top-k 上下文的权衡：较小的 k 会牺牲召回率，而较大的 k 则可能引入无关或噪声上下文，误导 LLM 的生成。来源：RankRAG。_

在本文中，我们介绍了一项新的研究——“RankRAG”，这是一个旨在通过在单一的大语言模型中统一上下文排序和答案生成来解决这些挑战的新框架。

### RankRAG

RankRAG is an [[01 LLM#指令微调|指令微调]] framework that trains an LLM to simultaneously rank contexts and generate answers. This dual-purpose model effectively handles the selection of relevant contexts from a large pool and uses them to generate high-quality answers.

RankRAG 是一个指令微调框架，训练 LLM 同时对上下文进行排序并生成答案。这种双重用途的模型有效地处理了从大量上下文中选择相关上下文并使用它们生成高质量的答案的问题。

Figure 2 depicts the two-stage instruction tuning framework for RankRAG, which enhances the model’s capabilities in both context ranking and retrieval-augmented generation.

图 2 描述了 RankRAG 的两阶段指令调优框架，该框架增强了模型在上下文排序和检索增强生成方面的能力。


## RAG 评估

### 如何从文档中创建 RAG 评估数据集

[How to Create a RAG Evaluation Dataset From Documents | by Dr. Leon Eversberg | Nov, 2024 | Towards Data Science](https://medium.com/towards-data-science/how-to-create-a-rag-evaluation-dataset-from-documents-140daa3cbe71)


## 优质博客








## 参考

[An End-to-End Framework for Production-Ready LLM Systems by Building Your LLM Twin - Comet](https://www.comet.com/site/blog/an-end-to-end-framework-for-production-ready-llm-systems-by-building-your-llm-twin/)

