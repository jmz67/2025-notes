

# 大模型量化

大模型量化和量化推理是源自深度学习中的模型压缩和加速的相关技术，它们主要用于在硬件上提高推理的效率，降低内存和计算资源的消耗。

**大模型量化（Model Quantization）**

量化是指模型中使用的高精度数值（通常是浮点数）转换为低精度数值（通常是整数）。这种转换将降低模型的存储空间，并加速计算的过程。

**量化推理（Quantized Inference）**

量化推理是指在推理（模型部署和实际应用）过程中使用量化后的模型进行推理计算。

**实操**

在这里我们将使用华为沈腾的机器进行量化的实操

```
pip install numpy==1.25.2
pip install transformers 
# 需要大于等于 4.29.1 版本，LLaMA 模型需要指定安装 4.29.1 版本
pip install accelerate==0.21.0 
# 若需要使用NPU多卡并行方式对模型进行量化，需大于等于 0.28.0 版本
pip install tqdm==4.66.1
```

（可选）如果需要在大模型量化工具中使用NPU多卡并行的方式对模型进行量化，需关闭NPU设备中的虚拟内存，并手动配置量化将会执行的设备序列环境。

```
export PYTORCH_NPU_ALLOC_CONF=expandable_segments:False
```

这行代码的作用是关闭 NPU 中的虚拟内存的功能，确保 NPU 在执行任务的时候只使用物理内存。虚拟内存允许系统使用硬盘空间来扩展内存容量，但是它通常会带来性能上的损失，因为硬盘的访问速度远低于内存。

`expandable_segments:False`：表示禁用虚拟内存，确保 NPU 只使用预分配的内存。通过这样做，可以减少内存页交换、提高执行速度，尤其是在执行高计算任务（如量化过程）时。

```
export ASCEND_RT_VISIBLE_DEVICES=0,1,2,3
```

这行代码的作用是设置 **可见的设备**，即指定在多卡（多个NPU设备）上并行执行量化任务时，哪些设备将被使用。

- `ASCEND_RT_VISIBLE_DEVICES=0,1,2,3`：这表示让程序在NPU的设备 `0`, `1`, `2`, 和 `3` 上进行计算。这是一种在多卡并行情况下选择计算设备的方式。
    - `ASCEND_RT_VISIBLE_DEVICES` 是一个环境变量，用于告诉系统哪些设备可用，在分布式训练和推理中，这有助于配置设备选择，确保并行计算的正确性。
    - 如果你的系统有多个NPU卡，像在机器学习训练中通常会利用多个设备加速计算，设置这个环境变量可以确保程序使用指定的设备，避免误用其他不需要的设备。

> 在 shell 中，我们可以通过 `export` 命令设置环境变量，使得该变量可以被当前 shell 会话以及它所启动的所有子进程访问。环境变量通常用于配置系统或程序的运行环境，例如设置路径，配置文件位置，硬件资源等。

```shell
# 设置一个环境变量
MY_VAR="hello"

# 使用 export 导出这个变量，使其对子进程可见
export MY_VAR

# 现在你可以在其他程序中访问 MY_VAR
echo $MY_VAR  # 输出 hello
```

**直接设置环境变量（不导出）**

```shell
ASCEND_RT_VISIBLE_DEVICES=0,1,2,3
```

这条命令只是 **设置了环境变量**，并不会把它 **导出** 到子进程。如果你在当前 shell 中执行这个命令，它的作用仅限于当前命令，或者当前 shell 会话的子进程。

举个例子，假设你直接执行如下：

```shell
ASCEND_RT_VISIBLE_DEVICES=0,1,2,3 python my_model.py
```

这时，环境变量 `ASCEND_RT_VISIBLE_DEVICES` 仅在执行 `python my_model.py` 这一命令时有效，而不会影响到其他命令或程序。

好了，我们回到量化实操

首先，我们在 HF 上下载我们的模型，在这里我们将使用 chatglm6b 为例，[chatglm2-6b](https://huggingface.co/THUDM/chatglm2-6b/tree/main) 上传至服务器文件内，如上传至于 chatglm2 文件夹下，文件夹目录为：

```
├── config.json
├── configuration chatglm.py
├── modeling_chatglm.py
├── pytorch_model-00001-of-00007.bin
├── pytorch_model-00002-of-00007.bin
├── pytorch_model-00003-of-00007.bin
├── pytorch_model-00004-of-00007.bin
├── pytorch_model-00005-of-00007.bin
├── pytorch_model-00006-of-00007.bin
├── pytorch_model-00007-of-00007.bin
├── pytorch_model.bin.index.json
├── quantization.py
├── README.md
├── tokenization_chatglm.py
├── tokenizer.model
├── tokenizer_config.json
```

下载依赖：

```
pip3 install protobuf==4.24.1
pip3 install sentencepiece==0.1.99
pip3 install sympy==1.11.1
```

新建模型量化脚本 quant.py ，编辑 quant.py 文件

```python
# 导入相关依赖

import torch 
import torch_npu 
from transformers import AutoTokenizer, AutoModel

tokenizer = AutoTokenizer.from_pretrained(pretrained_model_name_or_path='./chatglm2', trust_remote_code-True)

model = AutoModel.from_pretrained(
    pretrained_model_name_or_path='./chatglm2',
    trust_remote_code=True
).npu()

# 准备校准数据
calib_list = ["中国的首都在哪里？",
              "请做一首诗歌：",
              "我想要学习python，该怎么学习？",
              "请帮我写一篇关于大模型推理优化的任职报告：",
              "中国最值得去的几个景点"]

# 获取校准数据函数定义
def get_calib_dataset(tokenizer, calib_list):
    calib_list = []
    for calib_data in calib_list:
        inputs = tokenizer([calib_data], return_tensors="pt").to(model.device)
        print(inputs)
        calib_dataset.append([inputs.data['input_ids'], inputs.data['attention_mask']])
    return calib_dataset 

dataset_calib = get_calib_dataset(tokenizer, calib_list)  #校准数据获取

# 量化配置，可以按照实际需求进行修改
from msmodelslim.pytorch.llm_ptq_tools import Calibrator, QuantConfig

# 使用 QuantConfig 接口，配置量化参数，并返回量化配置实例
quant_config = QuantConfig(
    w_bit=8,    
    a_bit=16,         
    disable_names=[], 
    dev_id=model.device.index,
    dev_type='npu',   
    # 在cpu进行量化时，需配置参数dev_type='cpu'，并取消参数dev_id=model.device.index的配置
    w_sym=False, 
    mm_tensor=False
)

#使用Calibrator接口，输入加载的原模型、量化配置和校准数据，定义校准
calibrator = Calibrator(model, quant_config, calib_data=dataset_calib, disable_level='L0')  

calibrator.run()     #使用run()执行量化

calibrator.save('./quant_weight', save_type=['numpy', 'safe_tensor'])      
#使用save()保存模型量化参数，请根据实际情况修改路径

print('Save quant weight success!')
```


# Pytorch

## Dataset&DataLoader
[Datasets & DataLoaders — PyTorch Tutorials 2.5.0+cu124 documentation](https://pytorch.org/tutorials/beginner/basics/data_tutorial.html)

处理数据样本的代码可能会变得混乱且难以维护，在理想情况下，我们希望我们的数据集代码和模型训练的代码是解耦（decoupled）的，以此获得更好的可读性和模块化。Pytorch 提供了两个 data primitives：`torch.utils.data.DataLoader` 和 `torch.utils.data.Dataset` ，它们允许我们使用预加载的数据集和我们自己的数据。Dataset 存储了样本以及它的标签，DataLoader 在 Dataset 周围包装了一个可迭代的对象，以便访问样本。

PyTorch domain libraries provide a number of pre-loaded datasets (such as FashionMNIST) that subclass `torch.utils.data.Dataset` and implement functions specific to the particular data. They can be used to prototype and benchmark your model. You can find them here: [Image Datasets](https://pytorch.org/vision/stable/datasets.html), [Text Datasets](https://pytorch.org/text/stable/datasets.html), and [Audio Datasets](https://pytorch.org/audio/stable/datasets.html)

# 手搓 GPT2

## 1 理解大语言模型

现代 LLM 和早期的 NLP 模型的主要区别在于，早期的 NLP 模型通常是为特定的任务设计的，例如文本分类，语言翻译等等。虽然这些早期的 NLP 模型在它们狭窄的应用中表现出色，但是 LLM 在广泛的 NLP 任务中表现的更好。

### 1.1 什么是大模型？

### 1.2 大模型的应用

### 1.3 构建和使用大模型的场景

### 1.4 介绍 transformer 架构

### 1.5 利用大型数据集



### 1.6 A closer look at the GPT architecture

在 GPT 模型的下一词预训练任务中，系统通过查看之前出现的单词来学习预测句子中的下一个单词。这种方法帮助模型理解单词和短语在语言中通常如何组合在一起，形成可以应用于各种其他任务的基础。



下一词预测训练是一种自监督学习形式，即一种自标记形式。这意味着我们不需要显式地为训练数据收集数据，而是可以利用数据本身的结构：我们可以使用句子或者文档的下一个单词作为模型应该预测的标签。由于这种下一个词预测任务允许我们即时地创建标签，因此可以利用大量没有标记的文本数据集来训练 LLMs。

尽管原始的 transformer 模型由编码器和解码器组成，明确是为了翻译设计的。但是 decoder-only 的 GPT 模型明明是为了预测下一个词而设计的，但是也可也进行翻译。这种能力是研究人员最开始没有预测到的。

模型具有的没有被明确训练过的任务的能力叫 “emergent behavior”。这种能力不是训练过程中明确教授的，而是模型在海量多语言模型中训练完之后自然出现的能力。GPT 模型能够“学习”语言之间的翻译模式并执行翻译任务，尽管它们没有专门为此进行训练，这表明了这些大规模生成语言模型的优势和能力。我们可以执行多样化的任务，而无需为每个任务使用不同的模型。

### 1.7 Building a large language model

## 3 注意力机制
### 3.3 Attending to different parts of the input with self-attention

在自注意力中，自指的是机制通过关联单个输入序列中的不同位置来计算注意权重的能力。它评估和学习输入本身之间的关系和依赖关系。这与传统的注意力机制形成对比，传统机制关注的是两个不同序列的元素之间的关系，例如在序列到序列模型中，注意力可能在输入序列和输出序列之间，如图 3.5 所示。

由于自注意力看起来可能很复杂，特别是如果你是第一次接触，我们将在下一个小节中介绍一个简化版本的自注意力。之后，在第 3.4 节中，我们将实现具有可训练权重的自注意力机制，该机制用于LLMs。
#### 3.3.1 一个简单的自我注意力机制，没有可训练的权重

在本节中，我们实现一个简化版本的自注意力，不包含任何可训练的权重，如下图所示。本节的目的在于在添加可训练权重之前，说明自注意力的一些关键概念。

![[Pasted image 20241107104636.png]]

*自注意力的目标是为每个输入元素计算一个上下文向量，该向量结合了所有其他输入元素的信息。在上图中，我们计算上下文向量 $z^{(2)}$ 。每个输入元素在计算 $z^{(2)}$ 中的重要性或贡献由注意力权重 $α_{21}$ 到 $α_{2T}$ 决定。在计算 $z^{(2)}$ 时，注意力权重是相对于输入元素 $x^{(2)}$ 和所有其他输入计算的。这些注意力权重的确切计算将在本节后面讨论。*

```python
# 定义一个简单的softmax函数，用于计算注意力权重 
def softmax_naive(x): 
	return torch.exp(x) / torch.exp(x).sum(dim=0) # 计算输入x的指数并进行归一化
```

现在我们扩充计算，计算所有输入的注意力权重和上下文向量。



我们将遵循和之前相同的三个步骤，不同的是我们将计算的是所有的上下文向量而不是单个的。



在自注意力中，我们首先计算注意力得分，然后将其归一化以获得总和为 1 的注意力权重，这些注意力权重用于计算上下文向量，作为输入的加权和。

```python
attn_scores = torch.empty(6, 6)
for i, x_i in enumerate(inputs):
    for j, x_j in enumerate(inputs):
        attn_scores[i, j] = torch.dot(x_i, x_j)

print(attn_scores)
```

```
tensor([[0.9995, 0.9544, 0.9422, 0.4753, 0.4576, 0.6310],
        [0.9544, 1.4950, 1.4754, 0.8434, 0.7070, 1.0865],
        [0.9422, 1.4754, 1.4570, 0.8296, 0.7154, 1.0605],
        [0.4753, 0.8434, 0.8296, 0.4937, 0.3474, 0.6565],
        [0.4576, 0.7070, 0.7154, 0.3474, 0.6654, 0.2935],
        [0.6310, 1.0865, 1.0605, 0.6565, 0.2935, 0.9450]])
```

直接使用矩阵乘法就可以了实际上

```python
attn_scores = inputs @ inputs.T
print(attn_scores) # 打印注意力得分
```

在第二步中我们将对其进行归一化，以便每行的值总和为 1：

```python
attn_weights = torch.softmax(attn_scores, dim=-1)
print(attn_weights)
print(attn_weights.sum(dim=-1))
```

```
tensor([[0.2098, 0.2006, 0.1981, 0.1242, 0.1220, 0.1452],
        [0.1385, 0.2379, 0.2333, 0.1240, 0.1082, 0.1581],
        [0.1390, 0.2369, 0.2326, 0.1242, 0.1108, 0.1565],
        [0.1435, 0.2074, 0.2046, 0.1462, 0.1263, 0.1720],
        [0.1256, 0.1958, 0.1975, 0.1367, 0.1879, 0.1295],
        [0.1385, 0.2184, 0.2128, 0.1420, 0.0988, 0.1896]])
```

第三步也是最后一步，我们现在使用这些注意力权重来计算所有的上下文向量：

```python
all_context_vecs = attn_weights @ inputs
print(all_context_vecs)
```

我们仔细刨析一下：attn_weights 的第一行就是第一个单词在各个单词上的注意力得分，第一行乘上输入矩阵的第一列就会得到第一个单词的嵌入在第一个维度上来自各个单词第一个维度的加权和，第一行再乘上输入的第二列，就是在第二个维度上的，依次类推，make sense.

```
tensor([[0.4421, 0.5931, 0.5790],
        [0.4419, 0.6515, 0.5683],
        [0.4431, 0.6496, 0.5671],
        [0.4304, 0.6298, 0.5510],
        [0.4671, 0.5910, 0.5266],
        [0.4177, 0.6503, 0.5645]])
```

### 3.4 实现带有可训练权重的自注意力机制

在本节中我们将实现被广泛用于原始Transformer架构、GPT模型和其他大多数流行的LLM中使用的自注意力机制。这种自注意力机制又称之为**缩放点积注意力**（**scaled dot-product attention**）。


**带有可训练权重的自注意力机制建立在前面的概念之上：我们希望计算上下文向量作为特定输入元素的输入向量的加权和。**

和上节显著的差异是在本节中，我们将引入在模型训练期间更新的权重矩阵。这些可训练的权重矩阵对于模型（特别是模型内部的注意力模块）能够学习生成良好的上下文向量来说至关重要。

#### 3.4.1 逐步计算注意力权重

我们将逐步实现自注意力机制，通过引入三个可训练的权重矩阵，$W_q$，$W_k$ 和 $W_v$ ，着三个矩阵用于将嵌入的输入词元 $x^{(i)}$ 投影到查询，如下图所示：



请注意，在类似 GPT 的模型中，输入和输出维度通常是相同的，但是在这里我们选择不同的输入 d_in = 3 和 d_out = 2 维度。

接下来，我们将初始化这三个权重矩阵：

```python
torch.manual_seed(123)
W_query = torch.nn.Parameter(torch.rand(d_in, d_out), requires_grad=False)
W_key = torch.nn.Parameter(torch.rand(d_in, d_out), requires_grad=False)
W_value = torch.nn.Parameter(torch.rand(d_in, d_out), requires_grad=False)
```

请注意，为了说明，我们设置 `requires_grad=False` 以减少输出的杂乱，但如果我们要将权重矩阵用于模型训练，我们会设置 `requires_grad=True` 以在模型训练期间更新这些矩阵。

接下来，我们计算查询，键和值向量：

```python
query_2 = x_2 @ W_query
key_2 = x_2 @ W_key
value_2 = x_2 @ W_value

print(query_2)
```

> **权重参数和注意力权重**
> 请注意，在权重矩阵中，术语权重是权重参数的缩写，是神经网络在训练过程中优化的值。着不应和注意力权重混淆。

```python
keys = inputs @ W_key
values = inputs @ W_value 

keys_2 = keys[1]
attn_score_22 = query_2.dot(keys_2)
print(attn_score_22)
# tensor(1.8524)

attn_socres_2 = query_2 @ keys.T 
print(attn_score_2) # 打印注意力分数

tensor([1.2705, 1.8524, 1.8111, 1.0795, 0.5577, 1.5440])
```

在得到注意力分数之后，下一步就是使用 softmax 函数对这些分数进行归一化，以此获得注意力权重。

接下来，我们通过缩放注意力分数并使用之前使用的 softmax 函数计算注意力权重。和之前不同的是，我们现在通过将注意力分数除以键的嵌入维度的平方根来缩放它们：

```python
d_k = keys.shape[-1] # 获取键向量的嵌入维度
attn_weights_2 = torch.softmax(attn_scores_2 / d_k**0.5, dim=-1)
print(attn_weights_2)
```

> **缩放点积注意力的原理**
> 通过嵌入维度大小进行归一化的原始在于通过避免小梯度来提高训练性能。例如，当放大嵌入维度时，对于类似于 GPT 的 LLM，通常大于一千的嵌入维度，大点积会导致反向传播的梯度非常小，因为softmax函数应用于它们。随着点积增加，softmax函数表现得更像阶跃函数，导致梯度接近于零。这些小梯度可能会极大地减慢学习速度或导致训练停滞。
> 通过嵌入维度的平方根进行缩放的原因是这种自注意力机制也称为缩放点积注意力。

在自注意力计算的最后一步，我们通过注意力权重组合所有值的向量来计算上下文向量。和之前的计算非常类似，我们现在计算上下文向量作为值向量的加权和。在这里，注意力权重作为加权因子，权衡每个值向量的相应重要性。

```python
context_vec_2 = attn_weights_2 @ values
print(context_vec_2)
```

> **为什么使用查询，键和值？**
> **在注意力机制的上下文中，术语“键”、“查询”和“值”借鉴了==信息检索和数据库领域的概念==，在这些领域中使用类似的概念来==存储、搜索和检索信息==。**
> **“查询”类似于数据库中的搜索查询。它==代表模型关注或试图理解==的当前项目（例如，句子中的单词或词元）。查询用于探查输入序列的其他部分，以确定应给予多少注意力。**
> **在这种情况下，“值”类似于数据库中键值对中的值。它代表输入项目的==实际内容或表示==。一旦模型确定哪些键（从而输入的哪些部分）与查询（当前关注项）最相关，它会检索相应的值。**

#### 3.4.2 实现紧凑的自注意力 Python 类

```python
import torch.nn as nn

class SelfAttention_v1(nn.Module):
    def __init__(self, d_in, d_out):
        super().__init__()
        self.d_out = d_out
        self.W_query = nn.Parameter(torch.rand(d_in, d_out))
        self.W_key = nn.Parameter(torch.rand(d_in, d_out))
        self.W_value = nn.Parameter(torch.rand(d_in, d_out))

    def forward(self, x):
        keys = x @ self.W_key
        queries = x @ self.W_query 
        values = x @ self.W_value

        attn_scores = queries @ keys.T 

        attn_weights = torch.softmax(
            attn_scores / keys.shape[-1]**0.5, dim=-1
        )
        context_vec = attn_weights @ values 
        return context_vec

torch.manual_seed(123)
sa_v1 = SelfAttention_v1(d_in, d_out)
print(sa_v1(inputs))
```

```
tensor([[0.2996, 0.8053],
        [0.3061, 0.8210],
        [0.3058, 0.8203],
        [0.2948, 0.7939],
        [0.2927, 0.7891],
        [0.2990, 0.8040]], grad_fn=<MmBackward0>)
```

![[Pasted image 20241108212520.png]]

当然我们也可以使用 pytorch 的 nn.Linear 层进行改进 SelfAttention_v1 的实现。当偏置单元被禁用时，这些层仍然可以有效地执行矩阵乘法。此外，使用 nn.Linear 而不是手动实现 nn.Parameter(torch.rand(...)) 的一个显著的优势是 nn.Linear 具有优化的权重初始化方案，有助于更稳定和有效的模型训练。

```python
import torch.nn as nn  # 导入PyTorch的nn模块

class SelfAttention_v2(nn.Module):  # 定义SelfAttention_v2类，继承自nn.Module
    def __init__(self, d_in, d_out, qkv_bias=False):  # 初始化方法，接受输入维度、输出维度和qkv_bias参数
        super().__init__()  # 调用父类的初始化方法
        self.d_out = d_out  # 设置输出维度
        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)  # 定义查询权重矩阵的线性变换
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)  # 定义键权重矩阵的线性变换
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)  # 定义值权重矩阵的线性变换

    def forward(self, x):  # 前向传播方法，接受输入x
        keys = self.W_key(x)  # 计算键向量
        queries = self.W_query(x)  # 计算查询向量
        values = self.W_value(x)  # 计算值向量
        attn_scores = queries @ keys.T  # 计算注意力分数
        attn_weights = torch.softmax(  # 计算注意力权重
            attn_scores / keys.shape[-1]**0.5, dim=-1)  # 对注意力分数进行缩放并应用softmax函数
        context_vec = attn_weights @ values  # 计算上下文向量
        return context_vec  # 返回上下文向量
```



##### 为什么在 softmax 之前要对 attention 进行 scaled ？

$$
Attention(Q,K,V)=softmax(\frac{QK^{T}}{\sqrt{d}})
$$

在上述公式中，我们对 Q 和 K 进行点积以获得注意力权重。然后这些权重用于加权平均 V。但是在实际实现中，这个点积会被缩放，即除以 keys 的维度的平方根，常表示为 $d_k$ 。这里的 $d_k$ 是 key 向量的维度。

为什么我们需要去除以这个根号 d 呢？

> While for small values of  the two mechanisms perform similarly, additive attention outperforms dot product attention without scaling for larger values of  [3]. We suspect that for large values of, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients . To counteract this effect, we scale the dot products by sqrt($d_k$)

标准回答：

**随着 $d_k$ 的值变大，点积的大小会增大，如果没有及时对点积的大小进行缩放，那么万一点积的数量级很大，softmax 的梯度就会趋向于 0，也就会出现梯度消失问题。**

更深层次的理解 https://mp.weixin.qq.com/s/h-24XRdJDDZDg65LTjXA0w

## 5 预训练未标记数据

[Build a Large Language Model (From Scratch)GPT-4o翻译和代码每行中文注释Ch5-CSDN博客](https://blog.csdn.net/weixin_46460463/article/details/140622833?spm=1001.2014.3001.5502)




## 6 分类微调
### 微调的不同类别

微调语言模型的最常见的方法就是指令微调和分类微调。指令微调涉及到使用特定的指令在一组任务上训练语言模型，以提高其理解和执行自然语言提示中描述任务的能力。

![[Pasted image 20241106163024.png]]

在分类微调中，模型被训练来识别一组特定的类别标签，例如垃圾邮件或者是非垃圾邮件。分类任务的例子不仅限于大模型和电子邮件过滤，它还可以包括从图像中识别不同种类的植物，将新闻文章分类为体育，政治或者是科技等的主题，以及在医学影像中区分良性和恶性肿瘤。

关键点在于，经过分类微调的模型仅限于预测其训练过程中遇到的类别，而不对输入文本说其他内容。所以和分类微调模型相比，指令微调模型通常具有执行更加广泛任务的能力。我们可以将分类微调模型视为高度专业化的模型，通常开发一个专门化的模型比开发一个在各种任务中都表现良好的通用模型更加容易。

 > **选择正确的方法**
 > 指令微调提高了模型根据特定用户指令去理解和生成响应的能力。指令微调最适合需要根据复杂用户指令处理各种任务的模型，提高灵活性和交互质量。另一方面，分类微调则适合用于将数据精确分类到预定义类别的项目，例如情感分析和垃圾邮件检测。
 > 虽然指令微调更加通用，但是它需要更大的数据集和更多的计算资源来开发可以应对各种任务的模型。相比之下分类微调则只需要更少的数据和计算能力，但其使用仅限于模型已训练的特定类别。
 
### 准备数据集

下载和解压数据集

```python
# 清单 6.1 下载和解压数据集

import urllib.request  # 导入urllib.request库，用于网络请求
import zipfile  # 导入zipfile库，用于处理ZIP文件
import os  # 导入os库，用于处理文件和目录
from pathlib import Path  # 从pathlib库导入Path类，用于路径操作

# 定义下载链接、ZIP文件路径、解压后文件夹路径和数据文件路径
url = "https://archive.ics.uci.edu/static/public/228/ssm+spam+collection.zip"
zip_path = "sm_spam_collection.zip"  # ZIP文件保存路径
extracted_path = "sms_spam_collection"  # 解压后的文件夹路径
data_file_path = Path(extracted_path) / "SMSSpamCollection.tsv"  # 解压后的数据文件路径

def download_and_unzip_spam_data(url, zip_path, extracted_path, data_file_path):
    # 检查数据文件是否已经存在，如果存在则跳过下载和解压
    if data_file_path.exists():
        print(f"{data_file_path} already exists. Skipping download and extraction.")  # 打印提示信息
        return  # 如果文件存在，直接返回，不执行后续操作

    # 下载ZIP文件
    with urllib.request.urlopen(url) as response:  # 发送GET请求获取文件
        with open(zip_path, "wb") as out_file:  # 打开保存ZIP文件的路径
            out_file.write(response.read())  # 将响应内容写入ZIP文件

    # 解压ZIP文件
    with zipfile.ZipFile(zip_path, "r") as zip_ref:  # 打开ZIP文件
        zip_ref.extractall(extracted_path)  # 将ZIP文件解压到指定目录

    # 重命名解压后的文件
    original_file_path = Path(extracted_path) / "SMSSpamCollection"  # 获取解压后的原始文件路径
    os.rename(original_file_path, data_file_path)  # 重命名为目标文件路径
    print(f"File download and saved as {data_file_path}")  # 打印下载和保存成功的提示信息

# 调用函数进行下载和解压操作
download_and_unzip_spam_data(url, zip_path, extracted_path, data_file_path)

```

执行上述代码后，数据集作为制表符分隔的文本文件 `SMSSpamCollection.tsv` 保存在 `sms_spam_collection` 文件夹中。我们可以将其加载到 pandas 中：

```python
import pandas as pd 

df = pd.read_csv(data_file_path, sep="\t", header=None, names=["label", "Text"])
```

让我们来看看类别标签的分布情况:

```python
print(df["label"].value_counts())

"""
Label
ham  4825
spam  747
Name: count, dtype: int64
"""
```

为了简化起见，并且因为我们更喜欢用于教育目的的小型数据集（这将有助于更快地微调大模型），我们选择对数据集进行欠采样，以包含每个类别的 747 个实例。虽然还有其他几种方法可以处理类别不平衡的问题，但是这些方法超出了本节的范围。对探索处理不平衡数据感兴趣的可以去看附录 B 中的文献内容。

我们使用以下代码对数据集进行欠采样并创建一个平衡的数据集：

```python
# 清单 6.2 创建一个平衡的数据集
def create_balanced_dataset(df):
    # 获取 label 列中值为 spam 的行数，表示垃圾邮件的数量
    num_spam = df[df['label'] == 'spam'].shape[0]
    # 从 label 列为 ham 的行中随机抽取和垃圾邮件数量相同的样本，并设置随机种子为 123
    ham_subset = df[df["label"] == 'ham'].sample(num_spam, random_state=123)
    # 将随机抽取的 ham 样本和 spam 样本合并为一个新的 DataFrame
    balanced_df = pd.concat([ham_subset, df[df['label'] == 'spam']])
    return balanced_df

balanced_df = create_balanced_dataset(df)
print(balanced_df['label'].value_count())
```

接下来我们再将字符串类型的类标签分别转换为整数类标签 0 或者是 1：

```python
balanced_df['label'] = balanced_df['label'].map({'ham': 0, 'spam': 1})
```

我们再创建一个 `random_split` 函数将数据集分为三个部分：70% 用于训练，10% 用于验证，20% 用于测试。这些比例在机器学习中非常常见。

```python
# 清单 6.3 拆分数据集

def random_split(df, train_frac, validation_frac):
    # frac 参数表示从原始数据中抽取的比例，这里是 100% 的意思，如果 frac=2 就是说原始数据翻倍
    df = df.sample(frac=1, random_state=123).reset_index(drop=True)

    train_end = int(len(df) * train_frac)
    validation_end = train_end + int(len(df) * validation_frac)

    train_df = df[:train_end]
    validation_df = df[train_end: validation_end]
    test_df = df[validation_end:]

    return train_df, validation_df, test_df 

train_df, validation_df, test_df = random_split(balanced_df, 0.7, 0.1)
```

此外，我们将数据集保存为 csv（逗号分隔）文件，方便以后重用：

```python
train_df.to_csv('train.csv', index=None)
validation_df.to_csv('validation.csv', index=None)
test_df.to_csv('test.csv', index=None)
```

在本节中我们下载了数据集，平衡了其中的标签，并将其分为训练和评估子集。在下一节中，我们将设置用于训练模型的 Pytorch 数据加载器。

### 创建数据加载器
---
如果不了解数据加载器，详见 [[01 LLM#Pytorch#Dataset&DataLoader]] 
在本节中，我们将开发和第二章实现概念上相似的 pytorch 数据加载器。
在第二章中，我们使用滑动窗口技术生成了大小均匀的文本块，然后将这些文本块分组成批次，以此提高模型训练的效率。每个文本块都作为一个单独的训练实例。

然而在本章中，我们正在处理一个包含不同长度文本消息的垃圾邮件数据集。要像在第二章中那样处理文本块那样批量处理这些消息，我们有两个主要选项：
- 把所有消息截断到数据集或批次中最短消息的长度
- 将所有消息填充到数据集或批处理中最长消息的长度

选项一在计算上更加便宜，但如果说较短的消息远远小于平均或最长消息，可能会导致显著的信息丢失，从而降低模型的性能。因此我们应该使用第二个选项，它将保留所有信息的全部内容。

要实现选项二，即将所有消息填充到数据集中最长消息的长度，我们会在所有较短的消息中添加填充标记。为此，我们使用 `<|endoftext|>` 作为填充标记。

实际上我们不是将字符串直添加到每个消息字符中，而是将它对应的 token ID 添加到编码的文本消息中。

![[Pasted image 20241106223748.png]]

```python
import tiktoken

tokenizer = tiktoken.get_encoding('gpt2')
print(tokenizer.encode("<|endoftext|>", allowed_special={'<|endoftext|>'}))
```

正如我们在第二章中所见，我们首先需要实现一个 Pytorch Dataset，它指定了数据加载和处理的方式，然后我们才能够实例化数据加载器。

为此我们定义了 SpamDataset 类，该类处理了几个关键任务：它识别训练数据集中最长的序列，对文本消息进行编码，并确保所有其他序列都使用填充标记进行填充，以此匹配最长序列的长度。

Dataset 可以直接使用吗？

```python
# 清单 6.4 设置 Pytorch 数据集类

import torch
from torch.utils.data import Dataset

class SpamDataset(Dataset):
    def __init__(self, csv_file, tokenizer, max_length=None, pad_token_id=50256):
        self.data = pd.read_csv(csv_file)

        self.encoded_texts = [
            tokenizer.encode(text) for text in self.data['Text']
        ]

        if max_length is None:
            self.max_length = self._longest_encoded_length()
        else:
            self.max_length = max_length

            self.encoded_texts = [
                encoded_text[:self.max_length]
                for encoded_text in self.encoded_texts
            ]

        self.encoded_texts = [
            encoded_text + [pad_token_id] * (self.max_length - len(encoded_text))
            for encoded_text in self.encoded_texts
        ]

    def __getitem__(self, index):
        # return the encoded text and corresponding label for a specific index
        encoded = self.encoded_text[index]
        label = self.data.iloc[index]['label']
        return (
            torch.tensor(encoded, dtype=torch.long),
            torch.tensor(label, dtype=torch.long)
        )

    def __len__(self):
        return len(self.data)

    def _longest_encoded_length(self):
        max_length = 0
        for encoded_text in self.encoded_texts:
            encoded_length = len(encoded_text)
            if encoded_length > max_length:
                max_length = encoded_length 
        return max_length
```

`SpamDataset` 类从我们之前创建的 csv 文件中加载数据，使用 `tiktoken` 的 GPT-2 分词器对文本进行分词，并允许我们根据最长序列或预定义的最大长度将序列填充或截断为统一长度。这确保了每个输入张量的大小相同，这是我们接下来实现数据加载器中创建批次所必需的：

```python
train_dataset = SpamDataset(
    csv_file="train.csv",
    max_length=None,
    tokenizer=tokenizer
)

val_dataset = SpamDataset(
    csv_file="validation.csv",
    max_length=train_dataset.max_length,
    tokenizer=tokenizer
)

test_dataset = SpamDataset(
    csv_file="test.csv",
    max_length=train_dataset.max_length,
    tokenizer=tokenizer
)
```

> **练习**
> 将输入填充到模型支持的最大 token 数，并观察其对预测性能的影响。

现在我们可以使用这些数据集作为输入，像在第二章那样实例化数据加载器。

![[Pasted image 20241106232310.png]]

```python
# 清单 6.5 创建 Pytorch 数据加载器

from torch.utils.data import Dataloader

num_workers = 0
batch_size = 8
torch.manual_seed(123)

train_loader = Dataloader(
    dataset=train_dataset,
    batch_size=batch_size,
    shuffle=True,
    num_workers=num_workers,
    drop_last=True,
)

val_loader = Dataloader(
    dataset=val_dataset,
    batch_size=batch_size,
    shuffle=True,
    num_workers=num_workers,
    drop_last=True,
)

test_loader = Dataloader(
    dataset=test_dataset,
    batch_size=batch_size,
    shuffle=True,
    num_workers=num_workers,
    drop_last=True,
)
```

为了确保数据加载器正常工作并确定返回预期大小的批次，我们遍历训练加载器，然后打印最后一个张量的维度：

```python
for input_batch, target_batch in train_loader:
    pass

print("Input batch dimensions:", input_batch.shape)
print("Label batch dimensions:", target_batch.shape)

# torch.Size([8, 120])
# torch.Size([8])
```

正如我们所见，输入的批次由 8 个训练样本组成，每个样本包含 120 个标记，标签张量存储和 8 个训练样本对应的类别标签。

最后为了了解数据集的大小，让我们打印每个数据集中的批次数总数：

```python
print(f"{len(train_loader)}")
print(f"{len(val_loader)}")
print(f"{len(test_loader)}")

130
19
38
```

### 使用预训练权重初始化模型

```python
# 清单 6.6 加载预训练的 GPT 模型

from gpt_download import download_and_load_gpt2
from chapter05 import GPTModel, load_weights_into_gpt

model_size = CHOOSE_MODEL.split(" ")[-1].lstrip("(").rstrip(")")
settings, params = download_and_load_gpt2(model_size=model_size, model_dir="gpt2")

model = GPTModel(BASE_CONFIG)
load_weights_into_gpt(model, params)
model.eval()
```

## 7 指令微调

### 7.2 为监督指令微调准备数据集

在本节中，我们将下载并格式化指令数据集，用于对本章中预训练的 LLM 进行指令微调。该数据集由 1100 个 instruction-response 对组成。

下面的代码实现并执行了一个函数来下载这个数据集，它是一个相对较小的文件，大小只有 204 kb，采用 JSON 格式。JSON 即 JavaScript Objext Noatation 反映了 Python 字典的结构，为数据交换提供了一个既可读又对机器友好的结构。

```python
import json
import os
import urllib

def download_and_load_file(file_path, url):
    if not os.path.exists(file_path):
        with urllib.request.urlopen(url) as response:
            text_data = response.read().decode("utf-8")
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(text_data)
    else:
        with open(file_path, "r", encoding="utf-8") as file:
            text_data = file.read()
    with open(file_path, "r") as file:
        data = json.load(file)
    return data

file_path = "instruction-data.json"
url = "https://raw.githubusercontent.com/rasbt/LLMs-from-scratch/main/ch07/01_main-chapter-code/instruction-data.json"
data = download_and_load_file(file_path, url)
print("Number of entries:", len(data))
```

```python
print("Example entry:\n", data[50])
```

```
Example entry:
{'instruction':'Identify the correct spelling of the following word.', 'input':'Ocassion', 'output':"correct spelling is 'Occasion'"}
```

指令微调，也叫监督指令微调，涉及到在数据集上训练模型，其中显式的提供输入输出对，如我们从 JSON 文件中提取的那些。有多种方法可以格式化这些数据实体。下图展示了两种不同的示例格式，often referred to as prompt styles，used in the training of notable LLMs such as Alpaca and Phi-3. Alpaca was one of the early LLMs to publicly detail its instruction finetuning process. Phi-3, developed by Microsoft, is included to demonstrate the diversity in prompt styles.



本章的其余部分使用 Alpaca 提示风格。

让我们定义一个 `format_input` 函数，我们可以使用它将 `data` 列表中的 entries 转换为 Alpaca 风格的输入格式：

```python
# 清单 7.2 实现 prompt 格式化函数

def format_input(entry):
    instruction_text = (
        f"Below is an instruction that describes a task."
        f"Write a response that appropriately completes the request."
        f"\n\n### Instruction:\n{entry['instruction']}"
    )

    input_text = f"\n\n### Input:\n{entry['input']}" if entry['input'] else ""
    return instruction_text + input_text 
```

我们来测试一下

```python
model_input = format_input(data[50])
desired_response = f"\n\n### Response:\n{data[50]['output']}"
print(model_input + desired_response)
```

```
Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:

Identify the correct spelling of the following word.

### Input:

Ocassion

### Response:

The correct spelling is 'Occasion.'
```

在我们继续下一节中设置 Pytorch 数据加载器之前，让我们将数据集分为训练集，验证集和测试集，类似于我们在上一章中对垃圾邮件分类数据集所做的那样。以下是我们的代码：

```python
# 清单 7.3 数据集分区

train_portion = int(len(data)*0.85)
test_portion = int(len(data)*0.1)
val_portion = len(data) - train_portion - test_portion

train_data = data[:train_portion]
test_data = data[train_portion:train_portion+test_portion]
val_data = data[train_portion+test_portion:]
```

### 7.3 将数据组织到训练批中

As we progress into the implementation phase of our instruction finetuning process, the next step, illustated in figure beneach, focused on constructing the training batches effectively. This involves defining a method that will **ensure our model receives the formatted training data during the finetuning process.**

In the previous chapter, the training batches were created automatically by the Pytorch DataLoader class, which employs a default collate function to combine lists of samples into batches. A collate function is responsible for taking a list of individual data samples and merging them into a single batch that can be processed efficiently by the model during training.

However, the batching process for instruction finetuning in this chapter is a bit more involved and requires us to create our own custom collate function that we will later plug into the DataLoader. We implement this custom collate function to handle the specific requirements and formatting of our instruction finetuning dataset.

In this section, we will tackle the batching process in several steps including the coding of the custom collate function, as illustrated in figure beneach.

![[Pasted image 20241111004100.png]]

First, to implement steps 2.1 and 2.2 as illustrated in figure above, we code an `InstrcutionDataset` class that applies `format_input` from the previous section and pre-tokenizes all inputs in the dataset.

![[Pasted image 20241111004414.png]]

This figure shows how entries are first formatted using a specific prompt template and then tokenized, resulting in a sequence of token IDs that the model can process.

The 2-step process illustrated in figure above is implemented in the `__init__` constructor method of the `InstructionDataset` :

```python
import torch
from torch.utils.data import Dataset

class InstructionDataset(Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
		self.encoded_texts = []
		for entry in data:
		    instruction_plus_input = format_input(entry)
			response_text = f"\n\n### Response:\n{entry['output']}"
            full_text = instruction_plus_input + response_text
            self.encoded_texts.append(
                tokenizer.encode(full_text)
            )

    def __getitem__(self, index)
```

Similar to the approach in chapter 6, **we aim to accelerate training by collecting multiple training examples in a batch**, which necessitates padding all inputs to a similar length. As with the previous chapter, we use the `<|endoftext|>` token as a padding token.

Instead of appending the `<|endoftext|>` tokens to the text inputs, we can append its token ID to the pre-tokenized inputs directly. To remind us which token ID we should use, we can use tokenizer's `.encode` method on an `<|endoftext|>` token:

```python
import tiktoken
tokenizer = tiktoken.get_encoding("gpt2")
print(tokenizer.encode("<|endoftext|>", allowed_special={"<|endoftext|>"}))
# The resulting token ID is 50256.
```

In chapter6, we padded all examples in a dataset to the same length. Moving on to step2.3 in figure 7.6, here we adopt a more sophisticated approach by developing a custom collate function that we can pass to the data loader. This custom function pads the training examples in each batch to have the same length, while allowing different lengths, as illustrated in figure 7.8. This approach minimizes unnecessary padding by only extending sequences to match the longest one in each batch, not the whole dataset.

```python
def custom_collate_draft_1(
    batch,
    pad_token_id=50256,
    device="npu:7"
):
    batch_max_length = max(len(item)+1 for item in batch)
    inputs_lst = []

    for item in batch:
        new_item = item.copy()
        new_item += [pad_token_id]

        padded = new_item + [pad_token_id] * (batch_max_length - len(new_item))

        inputs = torch.tensor(padded[:-1])
        inputs_lst.append(inputs)

    inputs_tensor = torch.stack(inputs_lst).to(device)
    return inputs_tensor
```

```python
inputs_1 = [0, 1, 2, 3, 4]
inputs_2 = [5, 6]
inputs_3 = [7, 8, 9]

batch = (
    inputs_1, 
    inputs_2,
    inputs_3
)

print(custom_collate_draft_1(batch))
```

```
tensor([
[0, 1, 2, 3, 4],
[5, 6, 50256, 50256, 50256],
[7, 8, 9, 50256, 50256]
]
)
```

We have just implement our first custom collate function to create batches form lists of inputs. However, as you learned in chapter5 and 6, we also need to create batches with the target token IDs, corresponding to the batch of input IDs.

![[Pasted image 20241111214823.png]]

We are now modifying our custom collate function to also return the target token IDs in addition to the input token IDs.

Similar to the process described in chapter 5 for pretraining an LLM, the target token IDs match the input token IDs but are shifted one position to the right. This setup, as shown in figure below, allows the LLM to learn how to predict the next token in a sequence.

![[Pasted image 20241111215259.png]]

This figure illustrated the input and target token alignment used in the instruction finetuning process of an LLM. For each input sequence, **the corresponding target sequence is created by shifting the token IDs one position to the right**, omitting the first token of the input, and appending an end-of-text token.

The following updated collate function generates the target token IDs, as illustrated in figure above, from the input token IDs:

```python

```


## 训练四阶段的解读
---
[InstructGPT的四阶段：预训练、有监督微调、奖励建模、强化学习涉及到的公式解读-CSDN博客](https://blog.csdn.net/weixin_46460463/article/details/142892398?spm=1001.2014.3001.5502)
### 预训练

**3.1 Unsupervised pre-training**

Given an unspervised corpus of tokens $\mathcal{U}=\{u_1,\ldots,u_n\}$ , we use a standard language modeling objective to maximiza the following likelihood:
$$L_1(\mathcal{U})=\sum_i\log P(u_i|u_{i-k},\ldots,u_{i-1};\Theta)$$
where $k$ is the size of the context window, and the conditional probability $P$ is modeled using a neural network with parameters $\Theta$. These parameters are trained using stochastic gradient descent.

In our experiments, we use a multi-layer Transformer decoder for the language model, which is a variant of the transformer. This model applies a multi-headed self-attention operation over the input context tokens followed by position-wise feedforward layers to produce an output distribution over tarfet tokens:
$$\begin{aligned}
h_{0}& =UW_e+W_p \\
h_{l}& =\text{transformer block}(h_{l-1})\forall i\in[1,n] \\
P(u)& =\mathrm{softmax}(h_nW_e^T) 
\end{aligned}$$
where $U=(u_{-k},...,u_{-1})$ is the context vector of tokens, $n$ is the number of layers, $W_e$ is the token embedding matrix, and $W_p$ is the position embedding matrix.



# BERT

原论文： https://arxiv.org/abs/1810.04805

Bert 代表的是双向编码器，用于高效地**将高度非结构化的文本数据表示为向量**。Bert 是一个经过训练的 transformer 编码器堆栈。
主要有两种大小，Bert base 和 Bert Large

> BERTBASE (L=12, H=768, A=12, Total Parameters=110M) BERTLARGE (L=24, H=1024, A=16, Total Parameters=340M) Where L = Number of layers (i.e; the total number of encoders) H = Hidden size A = Number of self-attention heads

## BERT 的架构

Bert 三个特性：双向性，通用性，深度
Bert 完全基于 Transfromer 的 Encoder 层，每个 Encoder 层都包含两个主要的部分：
1. 自注意力机制：这一机制允许模型考虑到输入序列中所有单词对当前单词的影响
2. 前馈神经网络：在自注意力的基础上，前馈神经网络进一步对特征进行非线性变换。

输入表示可以是单个句子或者一对句子，在将输入传递给 bert 之前，需要嵌入一些特殊的标记。

- `[CLS]` 每个序列的第一个标记，这是一个特殊的分类标记，用于标记输入的两个句子是否有上下文关系。
- `[SEP]` 是用以分开两句话的标志符。我们可以通过这个特殊的标记区分句子。

给定 token 的输入表示通常是通过对应的标记，段和位置嵌入求和来进行构造的。
**token embedding + segment embedding +position embedding**

![[Pasted image 20241105211237.png]]
值得注意的是，模型是无法处理文本字符的，所以不管是英文还是中文，我们都要通过预训练模型 BERT 自带的字典 vocab.txt 将每一个字或单词转换为字典索引（即 id）输入。

>**BERT 模型在预训练阶段是如何学习到词汇表的？**
> 通过 WordPiece 模型来构建词汇表。WordPiece 模型是一种基于频率的分词方法，其目标是生成一个固定大小的词汇表，其中包含高频词和低频词的常见子词单元。具体步骤： 1. **初始化词汇表**：从一个初始词汇表开始，这个初始词汇表通常包含所有出现过的字符。2. **统计词频**：遍历整个训练语料库，统计每个词的出现频率。3. **生成候选词**：对于每一对相邻的子词单元，计算它们合并后的频率。4. **选择最频繁的组合**：选择频率最高的子词单元对，并将它们合并为一个新的词。5. **更新词汇表**：将新生成的词添加到词汇表中。6. **重复步骤3-5**：重复上述过程，直到词汇表达到预定的大小。

position embedding 的目的：因为我们的网络结构没有 RNN 或者 LSTM，因此我们无法得到序列的位置信息，所以需要构建一个 position embedding。构建 position embedding 有两种方法：BERT 是初始化一个 position embedding，然后通过训练将其学出来；而 Transformer 是通过制定规则来构建一个 position embedding：使用正弦函数，位置维度对应曲线，而且方便序列之间的选对位置，使用正弦会比余弦好的原因是可以在训练过程中，将原本序列外拓成比原来序列还要长的序列，如下述公式：
$$PE_{(pos,2i)}=sin(pos/10000^{2i/d_{modul}})\quad\text{(8.1)}$$
$$PE_{(pos,2i+1)}=cos(pos/10000^{2i/d_{modul}})\quad\text{(8.2)}$$

一旦输入标记准备好了，它们就会在层叠冲流动。每一层都应用自注意力，将其结果通过前馈网络进行传递，并将其交给下一个编码器。

## 预训练和微调
---
**预训练阶段** 是 BERT 模型训练阶段中非常关键的一步。在这个阶段，模型在大规模的无表情文本数据上进行训练，主要通过以下两种任务来进行预训练：

1. 掩码语言模型（Masked Language Model, MLM）：在这个任务中，输入句子的某个比例的词会被随机地替换成特殊的 `[MASK]` 标记，模型需要预测这些被掩码的词。
2. 下一个句子预测（Next Sentence Prediction, NSP）：模型需要预测给定的两个句子是否是连续的。

**微调（Fine-tuning）**

在预训练模型好了之后，接下来就是微调阶段。微调通常在具有标签的小规模数据集上进行，以使得模型更好地适应特定的任务。

值得注意的几个技术点是：学习率的调整，由于模型已经在大量的数据上进行了预训练，因此微调阶段的学习率通常设置的相对较低。任务特定头，根据任务的不同，通常会在 bert 模型的顶部添加不同的网络层（例如，用于分类任务的全连接层，用于序列标记的 CRF 层等）。

注意避免过拟合：由于微调数据集通常比较小，因此需要仔细选择合适的正则化策略，如Dropout或权重衰减（weight decay）。

1) Batch Size:16 or 32;

2) Learning Rate: 5e-5, 3e-5, 2e-5;

3) Epochs:2, 3, 4;

## 使用 BERT 和 Hugging Face 进行情感分析
---
0. 安装 Hugging Face 的 Transformer 库
```
!pip install transformers
```

1. 加载和理解 BERT

下载预训练的 BERT 模型，我们将使用 BERT 基本模型的小写版本。它是在小写的英文文本上进行训练的。

```python
from transformers import BertModel
bert = BertModel.from_pretrained('bert-base-uncased')
```

分词和输入格式化：下载分词器进行分词，特殊标记的添加，在序列开头加 `[CLS]` ，在序列的末尾加 `[SEP]` 标记，填充序列，将标记转换为整数，创建注意力掩码以避免填充标记。

```python
from transformers import BertModel

tokenizer = BertTokenizerFast.from_pretrained('bert-base-uncased', do_lower_case=True)
```

```python
text = "Jim Henson was a puppeteer"
sent_id = tokenizer.encode(text,
						  # 添加 [CLS] 和 [SEP] 标记
						  add_special_tokens=True,
						  # 指定序列的最大长度
						  max_length=10,
						  truncation=True,
						  # 在序列的右侧添加填充标记
						  pad_to_max_length='right')

# 打印整数序列
print("整数序列: {}".format(sent_id))
# 将整数转换回文本
print("标记化文本:", tokenizer.convert_ids_to_tokens(sent_id))
```

```
整数序列: [101, 3958, 27227, 2001, 1037, 13997, 11510, 102, 0, 0]
标记化文本: ['[CLS]', 'jim', 'henson', 'was', 'a', 'puppet', '##eer', '[SEP]', '[PAD]', '[PAD]']
```

```python
decoded = tokenizer.decode(sent_id)
print("解码字符串: {}".format(decoded))
```

```
解码字符串: [CLS] jim henson was a puppeteer [SEP] [PAD] [PAD]
```

避免对填充索引执行注意力的掩码，掩码值：未屏蔽的标记为 1，屏蔽的标记为 0

```python
att_mask = [int(tok > 0) for tok in sent_id]
print("注意力掩码:" att_mask)
```

```
[1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
```

```python
# 将列表转换为张量
sent_id = torch.tensor(sent_id)
att_mask = torch.tensor(att_mask)

# 将张量调整为(批量大小, 文本长度)的形式
# unsqueeze(0) 表示在第 0 维前面插入一个维度
sent_id = sent_id.unsqueeze(0)
att_mask = att_mask.unsqueeze(0)

print(sent_id)
# tensor([[ 101, 3958, 27227, 2001, 1037, 13997, 11510, 102, 0, 0]])
```

```python
# 将整数序列传递给 BERT 模型
outputs = bert(sent_id, attention_mask=att_mask)  

# 解包 BERT 模型的输出
# 每个时间步的隐藏状态
all_hidden_states = outputs[0]

# 第一个时间步的隐藏状态（[CLS] 标记）
cls_hidden_state = outputs[1]
print("最后一个隐藏状态的形状:",all_hidden_states.shape)
print("CLS 隐藏状态的形状:",cls_hidden_state.shape)

# 最后一个隐藏状态的形状: torch.Size([1, 10, 768])
# CLS 隐藏状态的形状: torch.Size([1, 768])
```

这里我们介绍一下 bert 的返回对象 `BaseModelOutputWithPoolingAndCrossAttentions` ，这个对象包含多个属性：

`last_hidden_state` 也就是 `outputs[0]` 这是 bert 模型在每个 token 位置上的隐藏状态。它是一个三维张量，形状为 `(batch_size, sequence_length, hidden_size)` ，可以用于序列标注任务（如命名实体识别、词性标注等），因为每个token的隐藏状态都可以用来预测该token的标签。

`pooler_output` 也就是 `outputs[1]` 

# T5-large-model

# BGEReranker

# Qwen2


## 实操

强烈建议看看这个仓库，里面有一系列对 qwen2 的使用。
[self-llm/models/Qwen2 at master · datawhalechina/self-llm](https://github.com/datawhalechina/self-llm/tree/master/models/Qwen2)

[[01 LLM#LoRA 微调 Qwen2-7B|LoRA 微调 Qwen2-7B-Instruct]]


# LoRA

## GetQuickStart

[LoRA for Fine-Tuning LLMs explained with codes and example | by Mehul Gupta | Data Science in your pocket | Medium](https://medium.com/data-science-in-your-pocket/lora-for-fine-tuning-llms-explained-with-codes-and-example-62a7ac5a3578)

在这里我们学到以下内容：

- 理解 LoRA 的数学前提
- 什么是 LoRA？LoRA 背后的数学原理
- LoRA 对微调的意义
- 什么是 Catastrophic forgetting ，LoRA 是如何处理的？
- 我们可以将 LoRA 用于任何的 ML 模型吗？
- 什么是 QLoRA？
- 使用带输出的 LoRA 进行微调的代码

数学前提：

矩阵的秩：也就是一个矩阵中有多少线性无关的行/列向量可以表示这个矩阵。

全秩矩阵，low-rank matrix

**Matrix Factorization**，矩阵分解

Fine-Tuning，微调，对模型进行微调是指采用一个预训练模型（在一些大型公共语料库上训练的模型），并在一个新的、更小的数据集或特定任务上进一步训练它的过程。这样做是为了使模型适应特定问题或提高其在特定任务上的性能。

### Low-Rank Adaptation of LLMs

在一个通常的微调过程中，我们将选择一个已预训练的模型，然后在新的训练数据上进行迁移学习 trandfer learning 以此轻微的调整预训练的参数。

假设我们的模型是 70B 的，如果我们进行寻常的微调，这将更新 70B 个参数，这非常慢，而且消耗了巨大的计算资源。

与其更新所有的 70B 参数，我们是否可以冻结这些基本的权重并创建一个单独的“更新”矩阵？

让我们用一个例子来理解：Llama-70B 有一个形状为 N * M 的权重矩阵，其中有 70B 个值作为权重。现在我们创建一组新的更新权重矩阵 UA 和 UB 维度为 N * K 和 K * M 其中 K 很小，使得 UA * UB = N * M 。

另外 K 是需要调优的超参数，**K 越小，LLM 的性能下降就越大。**

Instead of updating the 70B N * M weights matrix, use this set of UA & UB for any updates and eventually use it alongside the pretrained weights for your specific tasks.

$$
Y=XW_{updated}+Bias=X(W+W_{update})+Bias
$$

$$
Y=X(W+U_AU_B)+Bias
$$

LoRA 不仅节省了计算和训练时间，还有助于避免灾难性的遗忘。

### 什么是灾难性的遗忘？

简单来说，灾难性遗忘是指一个机器学习模型，比如神经网络或者人工智能系统，在接受新的，不同的任务训练的时候，忘记如何执行之前学过的任务，尤其是对预训练模型进行微调的时候。

> Imagine you’re trying to teach a robot to do various tasks. You start by teaching it to make a sandwich. The robot learns how to pick up bread, spread peanut butter, and add jelly to make a delicious peanut butter and jelly sandwich. Then, you decide to teach it a new task, like folding laundry.
> Now, the process of learning this new skill can disrupt the knowledge it had about making sandwiches. So, after learning how to fold laundry, the robot might forget how to make a sandwich correctly. It’s as if its memory of the sandwich-making steps has been overwritten by the laundry-folding instructions.

**LoRA 是如何避免灾难性遗忘的？**
由于我们没有更新预训练的权重，模型永远不会忘记它已经学过的东西。而在一般的微调中，我们是在更新实际的权重，因此有可能出现灾难性的遗忘。

### 什么是 QLoRA？

Q 代表量化 quantization，即降低权重，激活函数或数据的数值精度的过程。

神经网络使用浮点数（32 位或 64 位）来表示权重，偏差和激活函数。然而这些高精度表示在计算上可能很昂贵，特别是在资源有限的硬件上，比如移动设备和边缘设备。

相反，我们可以使用精度较低的数据类型（比如 Float 16 位，Integer 8 位）来减小模型大小并显著节省计算资源。

简而言之，QLoRA 就是基于量化 LLM 的 LoRA，即使用内存中较低精度数据类型加载的 LLM。

**请记住，使用QLoRA也会略微影响您的性能，因为涉及到信息丢失**

### 代码实操

我们先来实操一下 flan-t5-small 的推理。

```python
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import torch_npu

%pip install sentencepiece -i https://pypi.tuna.tsinghua.edu.cn/simple

model_path = f'/data4/model/flan-t5-small'

tokenizer = T5Tokenizer.from_pretrained(model_path)
model = T5ForConditionalGeneration.from_pretrained(model_path)

# 定义推理函数
def generate_response(prompt, max_length=50):
    # pt 意味着返回的是 Pytorch 张量
    # tokenizer 将返回一个字典，包含了编码之后的 input_ids
    # 可能还有一些注意力掩码之类的信息
    inputs = tokenizer(prompt, return_tensors='pt')
    # num_return_sequences 表示要返回几个候选序列
    outputs = model.generate(**inputs, max_length=max_length, num_return_sequences=1)
    # ouputs[0] 代表第一个生成的序列
    # skip_special_tokens=True 指定在解码过程中跳过特殊符号（如 <pad> 或 <eos>）
    # 使结果更符合人类阅读习惯。
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response


# 示例推理
prompt = "Translate English to French: 'I love programming.'"
response = generate_response(prompt)

print("Generated Response:", response)
```

现在我们已经掌握了所有的理论知识，是时候开整了。我们将实施微调！

我们这次微调 flan-t5-small ，微调其在文本总结任务上的能力（输入：两个人之间的对话；输出：本次对话的总结）

在这里我们使用的数据格式如下：

```
[
  {
    "id": "13818513",
    "summary": "Amanda baked cookies and will bring Jerry some tomorrow.",
    "dialogue": "Amanda: I baked cookies. Do you want some?\r\nJerry: Sure!\r\nAmanda: I'll bring you some tomorrow."
  },
  {
    "id": "13728867",
    "summary": "Olivia and Olivier are voting for liberals in this election.",
    "dialogue": "Olivia: Who are you voting for in this election? \r\nOliver: Liberals as always."
  },
  {
    "id": "13681000",
    "summary": "Kim may try the pomodoro technique recommended by Tim to get more stuff done.",
    "dialogue": "Tim: Hi, what's up?\r\nKim: Bad mood tbh, I was going to do lots of stuff but ended up doing nothing."
  }
]
```

我们先来下载所有微调所必须的包：

```python
!pip install trl transformers accelerate datasets bitsandbytes einops torch huggingface-hub git+https://github.com/huggingface/peft.git
```

```python
from datasets import load_dataset  
from random import randrange  
import torch  
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM,TrainingArguments,pipeline  
from peft import LoraConfig, prepare_model_for_kbit_training, get_peft_model, AutoPeftModelForCausalLM  
from trl import SFTTrainer  
from huggingface_hub import login, notebook_login
```

让我们加载训练和测试数据集以及将被微调的大模型和它的分词器

```python
# train & test.json are in same folder as the jupyter notebook
data_files = {'train': 'train.json', 'test': 'test.json'}
dataset = load_dataset('json', data_files=data_files)

# TODO: we will replace it using local model file
model_name = 'google/flan-t5-small'
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Make training faster but a  little less accurate 
model.config.pretraining_tp = 1

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)

# setting padding instructions for tokenizer
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = 'right'
```

接下来我们将使用输入和输出，我们将创建一个提示模板，这是我们稍后将使用 SFTTrainer 的要求

```python
def prompt_instruction_format(sample):
    return f""""
    ### Instruction:
    Use the Task below and the Input given to write the Response:

    ### Task:
    Summarize the Input

    ### Input:
    {sample['dialogue']}
    
    ### Response:
    {sample['summary']}
    """
```

是时候开始设置我们适应 LoRA 的 trainer 了。

```python
# Create the trainer

trainingArgs = TrainingArguments(
    output_dir='output',
    num_train_epochs=1,
    per_device_train_batch_size=4,
    save_strategy="epoch",
    learning_rate=2e-4
)

peft_config = LoraConfig(
    lora_alpha=16,
    lora_dropout=0.1,
    r=64,
    bias="none",
    task_type='CAUSAL_LM'
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset['train'],
    eval_dataset = dataset['test'],
    peft_config=peft_config,
    tokenizer=tokenizer,
    packing=True,
    formatting_func=prompt_instruction_format,
    args=trainingArgs,
)

trainer.train()
```

TrainingArguments 设置了一些我们在训练时需要的参数，如学习率，epoch 等。
使用 LoraConfig ，我们在这里设置 LoRA 的超参数，主要参数是 r ，它是两个更新矩阵的秩，任务越简单，我们能承受的 r 就越低，而不会对结果造成太大的影响。
SFTTrainer 代表监督微调，which is used when we have labeled data (as in this case, the ground truth is available) to fine-tune whose parameters are self-explanatory.

现在我们将这个微调之后的模型推送到 hugface-hub 上，并最终像加载其他 llm 一样去加载它。对于这一步，你首先要创建你自己的 Huggingface-hub 凭据。

[Saving and downloading fine-tuned models from HuggingFace Hub](https://www.youtube.com/watch?v=XioHnwdHhRE)

完成之后，使用 jupyternotebook 中的 write 令牌登录到 huggingface-hub，并使用以下代码推送您的模型。

```python
# Save our tokenizer and create model card  
tokenizer.save_pretrained(repository_id)  
  
#Create model card  
trainer.create_model_card()  
  
# Push the results to the hub  
trainer.push_to_hub()
```

现在，一旦上传，再次使用笔记本登录，但这次使用 READ 令牌。

```python
#Read token  
notebook_login()
```

现在运行下面的代码来对您的私有模型进行推理：

```python
# load model and tokenizer from huggingface hub with pipeline  
summarizer = pipeline("summarization", model="your model path in huggingface-hub")  
  
# select a random test sample  
sample = dataset['test'][randrange(len(dataset["test"]))]  
print(f"dialogue: \n{sample['dialogue']}\n---------------")  
  
# summarize dialogue  
res = summarizer(sample["dialogue"])  
  
print(f"flan-t5-small summary:\n{res[0]['summary_text']}")
```


## LoRA 微调 Qwen2-7B

```python
import torch
from modelscope import snapshot_download, AutoModel, AutoTokenizer
import os
model_dir = snapshot_download('qwen/Qwen2-7B-Instruct', cache_dir='/root/autodl-tmp', revision='master')
```

LLM 的微调一般指指令微调过程。所谓指令微调，是说我们使用的微调数据形如：

```json
{
    "instruction":"回答以下用户问题，仅输出答案。",
    "input":"1+1等于几?",
    "output":"2"
}
```

其中，`instruction` 是用户指令，告知模型其需要完成的任务；`input` 是用户输入，是完成用户指令所必须的输入内容；`output` 是模型应该给出的输出。

```python
from datasets import Dataset
import pandas as pd 
from transformers import AutoTokenizer, AutoModelForCausalLM, DataCollatorForSeq2Seq, TrainingArguments, Trainer, GenerationConfig

# 将 JSON 文件转换为 CSV 文件
df = pd.read_json('../dataset/data.json')
ds = Dataset.from_pandas(df)
```

**处理数据集**

```python
tokenizer = AutoTokenizer.from_pretrained('/data4/model/Qwen2-7B-Instruct', use_fast=False, trust_remote_code=True)
```

```
Special tokens have been added in the vocabulary, make sure the associated word embeddings are fine-tuned or trained.

Qwen2Tokenizer(name_or_path='/root/autodl-tmp/qwen/Qwen2-7B-Instruct', vocab_size=151643, model_max_length=131072, is_fast=False, padding_side='right', truncation_side='right', special_tokens={'eos_token': '<|im_end|>', 'pad_token': '<|endoftext|>', 'additional_special_tokens': ['<|im_start|>', '<|im_end|>']}, clean_up_tokenization_spaces=False),  added_tokens_decoder={
	151643: AddedToken("<|endoftext|>", rstrip=False, lstrip=False, single_word=False, normalized=False, special=True),
	151644: AddedToken("<|im_start|>", rstrip=False, lstrip=False, single_word=False, normalized=False, special=True),
	151645: AddedToken("<|im_end|>", rstrip=False, lstrip=False, single_word=False, normalized=False, special=True),
}
```

**use_fast=False**：This argument specifies whether to use a fast version of the tokenizer. Fast tokenizers are implemented in Rust and are generally faster and more efficient, but may not always be compatible with all models. By setting it to False, the code is opting for the slower but more flexible python implementation of the tokenizer.

> The "more flexible Python implementation" means that the **regular tokenizer (written in Python)** is often better able to handle unique or customized tokenization requirements, which some models might need.
> Since Python is easier to work with for many developers, using the regular Python tokenizer is more straightforward for adding custom features, debugging issues, or experimenting with how tokens are generated.

**trust_remote_code=True**：This flag tells the library to trust and execute any custom code that may be included with the model when it is loaded. For example, the model might have additional code for special tokenization procedures or pre-processing that needs to be executed. This is necessary if the model comes with custom code beyond what is in the standard Hugging Face model library.

In summary, this line of code loads a tokenizer from a specified local directory for a pre-trained model (`Qwen2-7B-Instruct`), disables the fast tokenizer for compatibility or performance reasons, and allows for executing remote (or potentially custom) code included with the model.

**数据格式化**

LoRA 训练的数据是需要经过格式化，编码之后再输入给模型进行训练。在这里，我们首先要定义一个预处理函数，这个函数用于对每个样本，编码其输入和输出文本，并返回一个编码后的字典。

```python
def process_func(example):
    # Set a maximum length for the sequence. Since Llama tokenizer might split a single Chinese character into multi tokens,
    # we allow a large max length to keep the data intact.
    MAX_LENGTH = 384

    # Initialize empty lists for input IDs, attention masks, and lables.
    input_ids, attention_mask, labels = [], [], []

    # Tokenize the "instruction" text with specific formatting for a conversation setting, without adding special tokens at the start.
    # This includes a prompt where the assistant role-plays a character, followed by user input.
    instruction = tokenizer(
        f"<|im_start|>system\n现在你要扮演皇帝身边的女人--甄嬛<|im_end|>\n<|im_start|>user\n{example['instruction'] + example['input']}<|im_end|>\n<|im_start|>assistant\n",
        add_special_tokens=False
    )

    # Tokenize the response (model 's expected answer) without adding special tokens.
    response = tokenizer(f"{example['output']}", add_special_tokens=False)

    # Combine instruction and response tokens, adding a pad token at the end for proper alignment.
    input_ids = instruction['input_ids'] + response['input_ids'] + [tokenizer.pad_token_id]

    # Create labels for training, with `-100` for instruction tokens to ignore them during loss calculation.
    # Add response tokens and pad token at the end.
    labels = [-100] * len(instruction["input_ids"]) + response["input_ids"] + [tokenizer.pad_token_id]

    # Truncate if the combined sequence exceeds `MAX_LENGTH` to maintain the maximum length constraint.
    if len(input_ids) > MAX_LENGTH:
        input_ids = input_ids[:MAX_LENGTH]
        attention_mask = attention_mask[:MAX_LENGTH]
        labels = labels[:MAX_LENGTH]

    # Return the processed input IDs, attention mask, and labels.
    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "labels": labels
    }
```

Qwen2 采用的 Prompt Template 格式如下：

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
你是谁？<|im_end|>
<|im_start|>assistant
我是一个有用的助手。<|im_end|>
```




```python
# Import necessary libraries
import json
import pandas as pd
import torch
from datasets import Dataset
from modelscope import AutoTokenizer
from swanlab.integration.huggingface import SwanLabCallback
from peft import LoraConfig, TaskType, get_peft_model
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForSeq2Seq
import os
import swanlab

# Define base directory for model weights
BASE_DIR = 'D:\ModelSpace\Qwen2'

# Set the device to 'cuda' if a GPU is available, otherwise default to CPU
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# Function to process dataset by converting JSON lines to a new format required for fine-tuning
def dataset_jsonl_transfer(origin_path, new_path):
    """
    Converts original dataset into a new format suitable for fine-tuning a large model.
    """
    messages = []

    # Read each line from the original JSONL file
    with open(origin_path, "r", encoding="utf-8") as file:
        for line in file:
            # Parse each line as JSON data
            data = json.loads(line)
            text = data["text"]
            catagory = data["category"]
            output = data["output"]
            message = {
                "input": f"文本:{text},分类选项列表:{catagory}",
                "output": output,
            }
            messages.append(message)

    # Save the processed data as a new JSONL file, with each line being a JSON object
    with open(new_path, "w", encoding="utf-8") as file:
        for message in messages:
            file.write(json.dumps(message, ensure_ascii=False) + "\n")

# Pre-process each data example for model input preparation
def process_func(example):
    """
    Prepares each example in the dataset by tokenizing input and output, adding padding, and truncating.
    """
    MAX_LENGTH = 384
    input_ids, attention_mask, labels = [], [], []

    # Encode the input prompt for the model
    instruction = tokenizer(f"<|im_start|>system\n你是一个文本分类领域的专家，你会接收到一段文本和几个潜在的分类选项列表，请输出文本内容的正确分类<|im_end|>\n<|im_start|>user\n{example['input']}<|im_end|>\n<|im_start|>assistant\n", add_special_tokens=False)
    response = tokenizer(f"{example['output']}", add_special_tokens=False)

    # Combine input and response tokens and apply padding
    input_ids = instruction["input_ids"] + response["input_ids"] + [tokenizer.pad_token_id]
    attention_mask = instruction["attention_mask"] + response["attention_mask"] + [1]
    labels = [-100] * len(instruction["input_ids"]) + response["input_ids"] + [tokenizer.pad_token_id]

    # Truncate input if it exceeds max length
    if len(input_ids) > MAX_LENGTH:
        input_ids = input_ids[:MAX_LENGTH]
        attention_mask = attention_mask[:MAX_LENGTH]
        labels = labels[:MAX_LENGTH]

    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "labels": labels
    }

# Load pre-trained model and tokenizer
model_dir = os.path.join(BASE_DIR, 'Qwen2-0.5B')
tokenizer = AutoTokenizer.from_pretrained(model_dir, use_fast=False, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(model_dir, device_map=device, torch_dtype=torch.bfloat16)
model.enable_input_require_grads()  # Enable gradient checkpointing

# Define paths for train and test datasets
train_dataset_path = os.path.join(BASE_DIR, 'zh_cls_fudan-news', 'train.jsonl')
test_dataset_path = os.path.join(BASE_DIR, 'zh_cls_fudan-news', 'test.jsonl')

# Convert original datasets if necessary
train_jsonl_new_path = os.path.join(BASE_DIR, 'train.jsonl')
test_jsonl_new_path = os.path.join(BASE_DIR, 'test.jsonl')

if not os.path.exists(train_jsonl_new_path):
    dataset_jsonl_transfer(train_dataset_path, train_jsonl_new_path)
if not os.path.exists(test_jsonl_new_path):
    dataset_jsonl_transfer(test_dataset_path, test_jsonl_new_path)

# Load and process the training dataset
train_df = pd.read_json(train_jsonl_new_path, lines=True)
train_ds = Dataset.from_pandas(train_df)
train_dataset = train_ds.map(process_func, remove_columns=train_ds.column_names)

# Configure LoRA (Low-Rank Adaptation) for fine-tuning
config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    inference_mode=False,
    r=8,
    lora_alpha=32,
    lora_dropout=0.1,
)

# Apply LoRA configuration to the model
model = get_peft_model(model, config)

# Define fine-tuning arguments
args = TrainingArguments(
    output_dir=os.path.join(BASE_DIR, 'output', 'Qwen2-0.5B'),
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    logging_steps=10,
    num_train_epochs=2,
    save_steps=100,
    learning_rate=1e-4,
    save_on_each_node=True,
    gradient_checkpointing=True,
    report_to="none",
)

# Set up callback for logging fine-tuning data to SwanLab
swanlab_callback = SwanLabCallback(project="Qwen2-FineTuning", experiment_name="Qwen2-0.5B")

# Initialize the trainer
trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_dataset,
    data_collator=DataCollatorForSeq2Seq(tokenizer=tokenizer, padding=True),
    callbacks=[swanlab_callback],
)

# Start fine-tuning
trainer.train()

# Prediction function for model evaluation
def predict(messages, model, tokenizer):
    """
    Generates predictions from the model based on input messages.
    """
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    model_inputs = tokenizer([text], return_tensors="pt").to(device)

    generated_ids = model.generate(
        model_inputs.input_ids,
        max_new_tokens=512
    )
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]

    return tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

# Model evaluation: Predict on first 10 samples from the test set
test_df = pd.read_json(test_jsonl_new_path, lines=True)[:10]

test_text_list = []
for index, row in test_df.iterrows():
    instruction = row['你是一个文本分类领域的专家，你会接收到一段文本和几个潜在的分类选项列表，请输出文本内容的正确分类']
    input_value = row['input']

    messages = [
        {"role": "system", "content": f"{instruction}"},
        {"role": "user", "content": f"{input_value}"}
    ]

    response = predict(messages, model, tokenizer)
    messages.append({"role": "assistant", "content": f"{response}"})

    result_text = f"{messages[0]}\n\n{messages[1]}\n\n{messages[2]}"
    test_text_list.append(swanlab.Text(result_text, caption=response))

# Log predictions to SwanLab and complete the experiment
swanlab.log({"Prediction": test_text_list})
swanlab.finish()

```


# 微调

## 指令微调

[Key Insights and Best Practices on Instruction Tuning | by Florian June | Oct, 2024 | Towards AI](https://pub.towardsai.net/key-insights-and-best-practices-on-instruction-tuning-0214106466c7)



## Text-to-SQL

### 微调 7B 增强 SQL 生成

[Enhancing Text-to-SQL with a Fine-Tuned 7B LLM for Database Interactions | by Yi Ai | Sep, 2024 | Medium](https://yia333.medium.com/enhancing-text-to-sql-with-a-fine-tuned-7b-llm-for-database-interactions-fa754dc2e992)

在使用 7B 参数的大语言模型（LLM）进行 SQL 生成任务时，特别是在处理公司数据库时，我遇到了挑战。即使在上下文中提供了数据库模式和表关系，这些模型也常常难以生成准确的 SQL 查询。为了解决这一挑战，使用 QLoRA 对 7B 模型进行微调，利用针对您特定数据库模式定制的数据集，是一种有效的方法。

在本文中，我将带您深入了解微调 7B 模型以更有效地处理 SQL 生成任务的过程，以及如何将微调后的模型集成到基于 LangChain 的应用程序中，以实现实时数据库交互。

在深入细节之前，让我们先概述一下本指南中将要遵循的关键步骤：

1. 根据数据库模式准备自定义数据集。
2. 使用 QLoRA 技术微调 7B 模型。
3. 评估微调后模型的性能。
4. 将模型集成到基于 LangChain 的应用程序中，以实现基于 SQL 的数据库交互。

通过遵循本指南，您将能够使用经过微调的 Mistral 7B 模型构建一个面向 SQL 数据库的问题回答应用程序，该模型针对生成基于您特定数据库模式的 SQL 查询进行了优化。

#### 第一步：准备自定义数据集

为了有效地微调模型，您需要一个高质量的数据集，该数据集能够反映您数据库的结构。让我们考虑一个简单的客户管理数据库，其中包含以下表：

- **Customer**
- **Address**
- **Contact**

客户表（Customer）的样本 DDL

```sql
CREATE TABLE customer (
    customer_key INT PRIMARY KEY,
    source VARCHAR(50),
    full_name VARCHAR(100),
    created_date DATETIME,
    updated_date DATETIME,
    gender VARCHAR(10),
    dateofbirth DATE
);
```

地址表（Address）的样本 DDL

```sql
CREATE TABLE address (
    address_key INT PRIMARY KEY,
    customer_key INT,
    street_address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    is_primary BOOLEAN,
    created_date DATETIME,
    updated_date DATETIME,
    FOREIGN KEY (customer_key) REFERENCES customer(customer_key)
);
```

联系表（Contact）的样本 DDL

```sql
CREATE TABLE contact (
    contact_key INT PRIMARY KEY,
    customer_key INT,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_date DATETIME,
    updated_date DATETIME,
    FOREIGN KEY (customer_key) REFERENCES customer(customer_key)
);
```

这些表定义了一个简单的客户管理数据库结构，其中 `customer` 表存储客户的基本信息，`address` 表存储客户的地址信息，`contact` 表存储客户的联系方式。每个表都包含一些常用字段，如主键、外键、姓名、地址、电子邮件和电话等。这些表之间的关系通过外键约束来维护。

**建立文本转 SQL 的样例

为了生成用于微调的数据集，可以使用 Claude Sonnet 或其他大语言模型（LLMs）来创建文本到 SQL 的样本。以下是一个您可以使用的提示格式，以指导模型生成 SQL 查询：

```

Sample Format:
{
	  "instruction": "I want you to act as a SQL terminal in front of an example database. You need only to return the SQL command to me. Below is an instruction that describes a task. Write a response that appropriately completes the request.
	## Instruction:
	[Database description]
	",
	  "input": "### Input:
	[Natural language question]
	### Response:",
	  "output": "[Corresponding SQL query]"
}

Sample Data Point:
    {
	      "instruction": "You are a powerful text-to-SQL model. Your task is to generate SQL queries based on the following schema for a customer database:\n\nCREATE TABLE customer (\n    customer_key INT PRIMARY KEY,\n    source VARCHAR(50),\n    full_name VARCHAR(100),\n    created_date DATETIME,\n    updated_date DATETIME,\n    gender VARCHAR(10),\n    dateofbirth DATE\n);\n\nCREATE TABLE address (\n    address_key INT PRIMARY KEY,\n    customer_key INT,\n    street_address VARCHAR(200),\n    city VARCHAR(100),\n    state VARCHAR(50),\n    postal_code VARCHAR(20),\n    country VARCHAR(50),\n    is_primary BOOLEAN,\n    created_date DATETIME,\n    updated_date DATETIME,\n    FOREIGN KEY (customer_key) REFERENCES customer(customer_key)\n);\n\nCREATE TABLE contact (\n    contact_key INT PRIMARY KEY,\n    customer_key INT,\n    email VARCHAR(100),\n    phone VARCHAR(20),\n    created_date DATETIME,\n    updated_date DATETIME,\n    FOREIGN KEY (customer_key) REFERENCES customer(customer_key)\n);",
	      "input": "List the full names of customers who have both an email and a phone number.",
	      "output": "SELECT DISTINCT c.full_name\nFROM customer c\nJOIN contact ct ON c.customer_key = ct.customer_key\nWHERE ct.email IS NOT NULL AND ct.phone IS NOT NULL;"
    }

The database contains three tables: customer, address, and contact.

Table 'customer' has columns:
customer_key (INT, primary key)
source (VARCHAR(50))
full_name (VARCHAR(100))
created_date (DATETIME)
updated_date (DATETIME)
gender (VARCHAR(10))
dateofbirth (DATE)

Table 'address' has columns:
address_key (INT, primary key)
customer_key (INT, foreign key referencing customer(customer_key))
street_address (VARCHAR(200))
city (VARCHAR(100))
state (VARCHAR(50))
postal_code (VARCHAR(20))
country (VARCHAR(50))
is_primary (BOOLEAN)
created_date (DATETIME)
updated_date (DATETIME)

Table 'contact' has columns:
contact_key (INT, primary key)
customer_key (INT, foreign key referencing customer(customer_key))
email (VARCHAR(100))
phone (VARCHAR(20))
created_date (DATETIME)
updated_date (DATETIME)

Please generate 100 samples in JSON file based on the provided database schema and example. For each sample, ensure that:
Instruction: include only the necessary table definitions in the instruction based on the SQL query in the output
Input: Contains a natural language question about the data.
Output: Provides the corresponding SQL query that answers the question. 
The questions should cover topics such as data analysis, aggregation, address searches, customer searches, contact searches, and reporting.
```

我们可以生成大约 200 到 500 个样本，并将它们保存为 JSON 格式，分为 `train.json` 和`eval.json` 用于训练和评估。不过，由于生成如此大量的样本需要一些时间，我将先提供一部分样例来展示格式和内容。如果这些符合您的要求，我们可以继续生成剩余的样本。

```
[  
	{  
	"instruction": "You are a powerful text-to-SQL model. Your job is to answer questions about the customer database based on the provided SCHEMA.\nYou must output the SQL query that answers the question. SCHEMA:\nCREATE TABLE customer (\n customer_key INT PRIMARY KEY,\n full_name VARCHAR(100),\n dateofbirth DATE\n);",  
	"input": "List the full names of all customers born after January 1, 1990.",  
	"output": "SELECT full_name FROM customer WHERE dateofbirth > '1990-01-01';"  
	},  
	{  
	"instruction": "You are a powerful text-to-SQL model. Your job is to answer questions about the address data based on the provided SCHEMA.\nYou must output the SQL query that answers the question. SCHEMA:\nCREATE TABLE address (\n address_key INT PRIMARY KEY,\n customer_key INT,\n city VARCHAR(100)\n);",  
	"input": "Find all unique cities where customers reside.",  
	"output": "SELECT DISTINCT city FROM address;"  
	},  
	{  
	"instruction": "You are a powerful text-to-SQL model. Your job is to answer questions about customer emails based on the provided SCHEMA.\nYou must output the SQL query that answers the question. SCHEMA:\nCREATE TABLE customer (\n customer_key INT PRIMARY KEY\n);\n\nCREATE TABLE contact (\n contact_key INT PRIMARY KEY,\n customer_key INT,\n email VARCHAR(100)\n);",  
	"input": "Find customers who have not provided an email address.",  
	"output": "SELECT c.customer_key FROM customer c LEFT JOIN contact ct ON c.customer_key = ct.customer_key WHERE ct.email IS NULL;"  
	},  
	{  
	"instruction": "You are a powerful text-to-SQL model. Your job is to answer questions about customers without addresses based on the provided SCHEMA.\nYou must output the SQL query that answers the question. SCHEMA:\nCREATE TABLE customer (\n customer_key INT PRIMARY KEY\n);\n\nCREATE TABLE address (\n address_key INT PRIMARY KEY,\n customer_key INT\n);",  
	"input": "List customer keys of customers who have no address on file.",  
	"output": "SELECT c.customer_key FROM customer c LEFT JOIN address a ON c.customer_key = a.customer_key WHERE a.customer_key IS NULL;"  
	},  
	...  
]
```

接下来的工作是结构化输出 json 然后进行训练 ... 




## 优质博客

### 特定领域微调嵌入模型

[Fine-tuning Embeddings for Specific Domains: A Comprehensive Guide | by kirouane Ayoub | GoPenAI](https://medium.com/gopenai/fine-tuning-embeddings-for-specific-domains-a-comprehensive-guide-5e4298b42185)

假设你正在为也该医学领域构建一个问答系统。当用户提出问题的时候，我们需要确保它可以准确地检索到相关的医学文章，但是通用的嵌入模型很难处理高度专业化的词汇和医学术语的细微差别。

这就是微调的由来！

在这篇博文中，我们将深入研究针对特定领域（如医学、法律或金融）对嵌入模型进行微调的过程。我们将专门为您的领域生成一个数据集，并使用它来训练模型，以更好地理解您所选领域中的微妙语言模式和概念。

> 到最后，您将拥有针对您的领域进行优化的更强大的嵌入模型，从而为您的NLP任务提供更准确的检索和改进的结果。

#### 原理简介
##### 什么是 Embedding ？

##### 俄罗斯套币表示学习 

_Matryoshka Representation Learning_

套表表示学习（MRL）是一种创建“可截断”嵌入向量的技术。想象一下一系列嵌套的娃娃，每个娃娃里面都有一个小一点的。MRL 以一种方式嵌入文本，即较早的维度（如外部的玩偶）包含最重要的信息，而随后的维度添加细节。这允许您在需要时仅使用嵌入向量的一部分，从而减少存储和计算成本。

我们将使用 Bge-base-en 来作为基座模型，进行微调。

##### 为什么要微调嵌入？

##### 数据集格式：构建微调的基础

我们可以使用各种数据集格式进行微调：

**积极配对 (Positive Pair)** 是一组相关的句子，例如一个问题和其答案，目的是用于训练模型理解句子对之间的关联性。  

```
句子1: 法国的首都是哪里？  
句子2: 法国的首都是巴黎。
```

```
Sentence 1: What is the capital of France?  
Sentence 2: The capital of France is Paris.
```


**三联体 (Triplets)** 由锚（Anchor）、正样本（Positive）和负样本（Negative）组成，其中锚与正样本相似，与负样本不同，用于训练模型区分相似和不相似的句子。  

```
锚: 德国的首都是哪里？  
正样本: 德国的首都是柏林。  
负样本: 意大利的首都是罗马。
```

```
Anchor: What is the capital of Germany?  
Positive: The capital of Germany is Berlin.  
Negative: The capital of Italy is Rome.
```


**有相似度分数的一对句子 (Pair with Similarity Score)** 包括一对句子及其相似度分数，用于回归任务，帮助模型量化句子间的相似性。  

```
句子1: 光合作用是如何工作的？  
句子2: 请解释光合作用的过程。  
相似度分数: 0.85
```

```
Sentence 1: How does photosynthesis work?  
Sentence 2: Explain the process of photosynthesis.  
Similarity Score: 0.85
```


**带有类的文本 (Texts with Classes)** 为每段文本提供一个对应的类标签，用于分类任务。  

```
文本: 埃菲尔铁塔位于巴黎。  
类别: 地理
```

```
Text: The Eiffel Tower is located in Paris.  
Class: Geography
```


通过这些形式的数据集，可以帮助模型在**相关性判断 (relevance determination)**、**相似性评分 (similarity scoring)** 和**文本分类 (text classification)** 等任务上更好地表现。

在这篇博文中，我们将创建一个问题、答案对的数据集来微调我们的模型。

##### 损失函数：指导训练过程



#### 代码示例

##### 安装依赖关系



##### PDF 解析和文本提取

##### 自定义文本分块

##### 数据集生成器

##### 运行问答生成

##### 加载数据集

##### 加载模型

##### 定义损失函数


##### 定义训练参数


##### 创建评估器


##### 在微调前评估数据

在微调之前，我们评估基本模型以获得 baseline performance 


##### 定义 Trainer 


##### 开始微调


##### 微调后评估



#### 总结




