<<<<<<< HEAD:2025/学习/React/6 React 状态管理.md
React 组件的运作离不开数据。前一章中
=======
React 组件的运作离不开数据。前一章构建的菜谱用户界面，如果没有菜谱数组，没有用处。整个应用的价值就体现在菜谱，配料和清晰的操作说明上。用户界面是创作人员制作内容的工具。为了给内容创作人员构建出最好的工具，我们需要知道如何有效地操作和修改数据。

前一章中构建了一个组件树 component tree。即具有一定的层次结构的组件，数据以属性的形式在其中流动。属性只起到一半的作用，另一半靠状态 state 。React 应用的状态在数据的驱动下改变。在我们开发的菜谱应用中引入状态后，厨师便可以新建菜谱，修改现有的菜谱和删除旧菜谱。

状态和属性之间有一定的关系。我们就根据这层关系把 React 应用中的不同组件紧密联系起来。当组件树的状态发生变化时，属性也随之改变。新数据沿着组件树流动，渲染特定枝叶上的组件，呈现新的内容。

本章引入状态，让应用鲜活起来。我们将学习如何创建有状态的组件，如何沿着组件树向下发送状态，以及如何沿着组件树向上反馈用户的交互。我们将学习从用户那里收集表单数据的方法，还将学习如何借助有状态的上下文供应组件，在应用中分离关注点。

## 6.1 构建一个星级评价组件

假如没有五星评价系统，我们肯定会吃到难吃的食物，看到难看的电影。如果你打算让用户参与到网站内容的建设中，那就需要一种方式来评价内容的优劣。这个时候，一个星级评价组件 StartRating 肯定是不可或缺的 React 组件。

StartRating 组件供用户为内容打分，给出心目中的星级数。较差的内容给一颗星，强烈推荐的内容获得五星。用户为内容打分时，直接点击某个星标即可。首先，我们需要一个星标。这个图标可以从 react-icons 中获取：

```
npm i react-icons
```

react-icons 是一个 npm 库，以 React 组件的形式分发，包含数百个 SVG 图标。安装这个库之后，我们便可以使用数个流行的图标库中的数百个 SVG 图标。这个库中包含的全部图标可以到它的网站中查看 [React Icons](https://react-icons.github.io/react-icons/) 。我们将使用 Font Awesome 中的星标：

```js
import React from "react"
import {FaStar} from 'react-icons/fa'

export default function StarRating() {
    return [
        <FaStar color="red" />,
        <FaStar color="red" />,
        <FaStar color="red" />,
        <FaStar color="grey" />,
        <FaStar color="grey" />
    ];
}
```

这里，我们创建一个 StarRating 组件，渲染从 react-icons 中导入的五个 SVG 星标。前三个星标填充红色，后两个填充灰色。首先渲染星标，是为了让自己知道要构建什么。我们将把选中的星标填充为红色，而未选中的则填充为灰色。下面来创建一个组件，根据 selected 属性自动为星标填充颜色：

```js
const Star = ({ selected = false }) => {
    <FaStar color={selected ? "red" : "grey"} />
};
```

Star 组件渲染单个星标，根据 selected 属性的值填充相应的颜色。如果没有把 selected 属性传给该组件，我们假定没有选中当前星标，填充默认的灰色。

五星评价系统十分流行，不过十星评价系统更为精准。在开发者把这个组件添加到自己的应用中时，我们应该让他们自行选择想使用多少颗星。为此，要在 StarRating 组件中添加一个 totalStar 属性：

```js
const createArray = length => [...Array(length)]

export default function StarRating({totalStar=5}) {
    return createArray(totalStars).map((n, i) => <Star key={i} />)
}
```


## 6.2 useState 钩子

现在是时候把 StarRating 组件变成可点击的了，即让用户改变 rating 的值。由于 rating 是个可变化的值，我们将使用 React 状态存储和修改它的值。状态通过 React 的 Hooks（钩子）特性纳入函数组件。Hooks 是一组可重用的代码逻辑，放在组件树之外，用于接入组件的功能。React 自带多个钩子，可以直接使用。这里，我们想为 React 组件添加状态，要使用的 React 钩子是 useState。这个钩子在 react 包中，导入即可：

```js
import React, {useState} from "react";
import {FaStar} from "react-icons/fa"
```

用户选中的星标数量表示评定的分值。我们将创建一个名为 selectedStars 的状态变量，存储用户评定的分值。我们直接在 StarRating 组件中使用 useState 钩子创建这个变量：

```js
export default function StartRating({totalStars = 5}) {
    const [selectedStars] = useState(3);
    return (
        <>
            {createArray(totalStars).map((n, i)=>(
                <Star key={i} selected={selectedStars > 1} />
            ))}
            <p>
                {selectedStars} of {totalStars} stars
            </p>
        </>
    );
}
```

在 React 中使用 useState 钩子的时候，`const [selectedStars] = useState(3);` 这种语法涉及到 js 的数组解构特性。useState 钩子返回一个数组，这个数组包含两个元素：

- 当前状态值
- 函数，用于更新这个状态值的函数

```jsx
const [selectedStars, setSelectedStars] = useState(3);
```

使用解构，你可以只提取你关心的状态值，而忽略更新函数。例如，如果你只关心状态值而不需要直接访问更新函数，你可以这样做：

```jsx
const [selectedStars] = useState(3);
```


## 6.3 为提高可重用性而重构

现在，Star 组件可以放到线上进行使用了。只要想从用户那里收集评分， 你的应用就可以使用这个组件。然而，如果你想把这个组件发布在 npm 上，供世界上的其他人使用，用于从用户那里收集评分，或许应该考虑再多处理几种情况。

首先考虑 style 属性，这个属性的作用在于为元素添加 css 样式。其他开发者，甚至你自己，以后很有可能要修改这个容器的样式。届时你可能会这么做：

```js
export default function App() {
    return <StarRating style={{backgroundColor: "lightblue"}} />;
}
```



## 6.4 组件树中的状态

在每个组件中都使用状态不是个太好的主意。状态数据分散在多个组件中不便于追踪 bug 和修改应用，因为你很难确定状态值在组件树中的具体位置。如果集中在一处管理，你对应用的状态或某个功能的状态将有更好地掌握。这2个思想很有很多具体做法，我们要分析的第一种做法是在状态树的根部存储状态，通过属性把状态传给子组件。

我们来编写一个小型应用，用于保存颜色列表。我们把这个应用命名为 ColorOrganizer ，用户在该应用中可以创建颜色列表，并为列表命名和评分。先来看示例数据集，如下所示：

```
[
  {
    "id": "0175d1f0-a8c6-41bf-8d02-df5734d829a4",
    "title": "ocean at dusk",
    "color": "#00c4e2",
    "rating": 5
  },
  {
    "id": "83c7ba2f-7392-4d7d-9e23-35adbe186046",
    "title": "lawn",
    "color": "#26ac56",
    "rating": 3
  },
  {
    "id": "a11e3995-b0bd-4d58-8c48-5e49ae7f7f23",
    "title": "bright red",
    "color": "#ff0000",
    "rating": 0
  }
]
```

### 6.4.1 沿组件树向下发送状态

这一步，我们把状态存储在 Color Organizer 应用的根组件（即 App 组件）中，然后把颜色向下传给子组件，负责渲染。在这个应用中，只有 App 组件持有状态。下面使用 useState 钩子把颜色列表添加到 App 组件中：

```js
import React, {useState} from "react";
import colorData from "./color-data.json"
import ColorList from "./ColorList.js"

export default function App() {
    const [colors] = useState(colorData);
    return <ColorList colors={colors} />;
}
```

App 组件位于组件树的根部。在这个组件中添加 useState 钩子就接入颜色的状态管理。在这个示例中，colorData 是前面给出的示例颜色数组。App 组件以 colorData 为 colors 的初始状态。然后把 colors 向下传给 ColorList 的组件。

```js
import React from "react";
import Color from "./Color";

export default function ColorList({colors=[]}) {
    if(!colors.length) return <div>No Colors Listed.</div>
    return (
        <div>
            {
                colors.map(color => <Color key={color.id} {...color} />)
            }
        </div>
    );
}
```

Color 组件接受三个属性：title，color 和 rating。这些属性的值在各个 color 对象中，已经通过展开运算符 <Color {...color} /> 传给该组件。这样做，color 对象中的各个字段将使用和键相同的名称传给 Color 组件。Color 组件负责显示这些值。title 在一个 h1 元素渲染。color 值显示为一个 div 元素的背景色（backgroundColor）。rating 继续沿着组件树向下传递，传给 StarRating 组件，以着色的星标突出显示。

```js
export default function StarRating({totalStars = 5, selectedStars = 0}) {
    return (
        <>
            {createArray(totalStars).map((n, i) => (
                <Star 
                    key={i}
                    selected={selectedStars > i}
                />
            ))}
            <p>
                {selectedStars} of {totalStars} stars
            </p>
        </>
    );
}
```


### 6.4.2 沿组件树向上发送交互

在 React 中，子组件通常不直接修改父组件的状态，而是通过回调函数将事件传递给父组件，由父组件来修改状态。这种设计模式叫做提升状态。

> 目前，我们编写了一系列 React 组件，通过属性沿着组件树从父级组件向子组件传递数据，在 UI 中渲染了 colors 数组。那么，如果我们想从列表中删除一个颜色，或者修改某个颜色的评分，该怎么办呢？colors 存储在组件树的根部状态。我们要收集子组件的交互，沿组件树向上发送给根组件，在那里修改状态。

比如说我们想在各个颜色的标题旁边添加一个 Remove 按钮，让用户从状态中删除颜色。这个按钮应该添加到 Color 组件中：

```js
import {FaTrash} from "react-icons/fa"

export default function Color({id, title, color, rating, onRemove = f => f}) {
    return (
        <section>
            <h1>{title}</h1>
            <button onClick={() => onRemove(id)}>
                <FaTrash />
            </button>
            <div style={{height: 50, backgroundColor: color}} />
            <StarRating selectedStars={rating} />
        </section>
    );
}
```

onRemove 回调函数：Color 组件接受一个 onRemove 回调函数作为 props 。当用户点击删除按钮时，调用 onRemove 并传递当前颜色的 id 。

这里我们修改 Color 组件，添加了一个按钮，供用户删除颜色。首先，从 react-icons 中导入一个垃圾桶图标。然后，把 FaTrash 图标放在一个按钮中，再为这个按钮添加一个 onClick 处理函数，调用随 id 等一起传入的属性列表中的 onRemove 函数。用户点击 Remove 按钮后，调用 onRemove ，传入想删除的颜色的 id。鉴于此，我们才从 Color 组件的属性中获取 id 值。

这个解决方法很好，因为保证了 Color 组件的纯粹性。Color 组件没有状态，可以轻易在应用中的其他部分，甚至是其他应用中重用。Color 组件不关心用户点击 Remove 按钮后会发生什么，它只负责通知父组件发生了这个事件，并传递用户想删除的颜色的有关信息。这个事件的处理责任在父级组件身上：

```js
export default function ColorList({colors = [], onRemoveColor = f => f}) {
    if (!colors.length) return <div>No Colors Listed.(Add a Color)</div>;

    return (
        colors.map(color => (
            <Color key={color.id} {...color} onRemove={onRemoveColor} />
        ))
    );
}
```

onRemoveColor 回调函数：ColorList 组件接受一个 onRemoveColor 回调函数，并将其传递给每个 Color 组件。事件代理：ColorList 组件作为中间层，将子组件的事件代理给父组件。

ColorList 组件的父级组件的 App，状态就是在这个组件中接入的。因此，我们要在这里捕获颜色的 id，从状态中删除对应的颜色。

```js
export default function App() {
    const [color, setColors] = useState(colorDate)
    return  (
        <ColorList
            colors={colors}
            onRemoveColor={id => {
                const newColors = colors.filter(color => color.id !== id);
                setColors(newColors);
            }}
        />
    );
}
```



## 6.5 构建表单

### 6.5.1 使用 ref 

在 React 中构建表单组件有好几种模式可以选择。在其中一个模式中，要使用 React 的一项特性直接访问 DOM 节点。这个特性称之为 ref 。在 React 中，ref 是一个对象，存储着一个组件整个生命周期内的值。ref 适合在几个场景下使用。本节介绍如何使用 ref 直接访问 DOM 节点。

我们可以使用 React 提供的 useRef 钩子创建 ref。下面使用这个钩子创建 AddColorForm 组件。useRef 是 React 提供的一个钩子，用于创建 ref。它返回一个可变的引用对象，其 current 属性被初始化为传递的参数（`initialValue`）。这个对象将在组件的整个生命周期内持续存在。

```js
import React, {useRef} from "react"

export default function AddColorForm({onNewColor = f => f}) {
    const txtTitle = useRef();
    const hexColor = useRef();
    const submit = e => { ... }

    return (...)
}
```

首先创建这个组件，我们还使用 useRef 钩子创建两个 ref。txtTitle ref 引用添加在表单中的文本输入框，用于收集颜色的标题。hexColor ref 用于访问 HTML 颜色输入框中的十六进制的颜色值。这两个 ref 的值可以在 JSX 中直接使用 ref 属性设定：

```js
return (
    <form onSubmit={submit}>
        <input ref={txtTitle} type="text" placeholder="color title..." required />
        <input ref={hexColor} type="color" required />
        <button>ADD</button>
    </form>
);
```

```js
const submit = e = {
    e.preventDefault();
    const title = txtTitle.current.value;
    const color = hexColor.current.value;
    onNewColor(title, color);
    txtTitle.current.value = "";
    hexColor.current.value = "";
};
```


## 6.6 React 上下文

在 React 的早期版本中，把状态集中放在组件树的根部是一个重要的模式，让我们受益良多。作为 React 开发者，我们都应该掌握如何通过属性在组件树中向上和向下传递状态。然而，随着 React 的发展，以及组件树枝繁叶茂，遵守这个原则慢慢变得不切实际，对于很多开发者来说，在复杂的应用中集中于组件树的根部维护状态不是一件容易的事情。在众多组件之间向上和向下传递状态，操作繁琐，而且容易出错。

我们处理的 UI 元素大都复杂。组件树的根部离枝叶往往较远。这导致应用依赖的数据离使用数据的组件相距甚远。每个组件都接受只传给子组件的属性，写出的代码臃肿不堪，UI 难以扩充。

状态数据通过属性经由一个个组件传递，一直传到需要使用状态的组件，这就好像从旧金山坐火车到华盛顿特区，途径很多州，到终点站才下车。

显然，从旧金山乘飞机到华盛顿特区更加便捷。这样不用经停各州，而是直接飞过。

在 React 中，上下文就像是数据的飞行装备。为了把数据放入 React 上下文，我们要创建上下文供应组件 context provider 。这是一种 React 组件，可以包含整个组件树，也可以包含组件树的特定部分。上下文供应组件是始发港，数据在这里登机。上下文供应组件也是枢纽，所有航班都从这里离开，飞往不同的目的地。各个目的地是上下文消费组件 context consumer ，即从上下文中获取数据的 React 组件。上下文消费组件是到达港，数据在这里降落，下机，投入工作中。

使用上下文不妨碍我们集中在一处存储状态数据，只是不用再经过一堆用不到状态的组件传递数据。

### 6.6.1 把颜色放入上下文

在 React 中使用上下文，首先要把数据放入上下文供应组件，并把供应组件添加到组件树中。我们使用 React 提供的 createContext 函数创建上下文对象。这个对象包含两个组件：一个上下文 Provider 和一个 Consumer 。

下面我们把 color-data.json 文件中的默认颜色放入上下文中。我们将在应用的入口文件 index.js 中添加上下文。

```js
import React, { createContext } from "react";
import colors from "./color-data";
import { render } from "react-dom";
import App from "./App";

export const ColorContext = creatContext();

render(
    <ColorContext.Provider value={{colors}}>
        <App />
    </ColorContext.Provider>,
    document.getElementById("root")
);
```

我们使用 createContext 函数创建一个 React 上下文实例。名为 ColorContext 。这个颜色上下文包含两个组件：ColorContext.Provider 和 ColorContext.Consumer 。我们要使用供应组件把颜色放到状态中。把数据添加到上下文中的方法是为 Provider 的 value 属性设值。

这里，我们把一个包含 colors 的对象添加到上下文中。由于我们把整个 App 组件都放在供应组件中，因此 colors 数组可以供给整个组件树的任何上下文消费组件使用。注意，我们还导出了 ColorContext 。这是必须的一步，因为从上下文中获取 colors 时需要使用 ColorContext.Consumer 。

> 上下文供应组件不是总要包含整个应用。有时也会包含部分特定的组件，这样效率更高。供应组件只为所含的子组件提供上下文值。
> 一个应用中可以有多个上下文供应组件。其实，你可能已经在不知道的情况下在自己的 React 应用中使用了上下文供应组件。很多支持 React 的 npm 包在背后就使用上下文。

现在，我们在上下文中提供了 colors 值，App 组件无需再持有状态，并通过属性向下传给子组件了。我们把 App 组件变成了天桥。Provider 是 App 组件的父级组件，在上下文中提供了 colors。ColorList 是 App 组件的子组件，可以直接获取 colors 。如此一来，App 组件彻底不用接触颜色了。这很好，毕竟 App 组件本身也用不到颜色。处理颜色的责任委托给组件树种的下级组件了。

App 组件的很多行代码都可以删除，现在该组件只需要渲染 AddColorForm 和 ColorList ，不用再关心数据：

```js
import React from "react";
import ColorList from "./ColorList";
import AddColorForm from "./AddColorForm";

export default function App() {
    return (
        <>
            <AddColorForm />
            <ColorList />
        </>
    );
}
```

### 6.6.2 使用 useContext 获取颜色

加上钩子的辅助，使用上下文简直让人身心愉悦。useContext 钩子用于从上下文中获取值，它从上下文 Comsumer 中获取我们需要的值。ColorList 不用再从属性中获取 colors 数组，而是直接通过 useContext 钩子获取。

```js
import React, {useContext} from "react";
import {ColorContext} from "./";
import Color from "./Color";

export default function ColorList() {
    const {colors} = useContext(ColorContext);
    if (!colors.length) return <div>No Colors Listed. (Add a Color)</div>
    return (
        <div className="color-list">
            {
                colors.map(color => <Color key={color.id} {...color} />)
            }
        </div>
    );
}
```

这里，我们修改 ColorList 组件，删掉 `colors=[]` 属性，因为 colors 将从上下文中获取。为了从上下文中获取值，useContext 钩子要用到上下文实例。为此，我们从创建上下文及把供应组件添加到组件树中的 index.js 文件里导入了 ColorContext 实例。现在，ColorList 可以根据上下文提供的数据构建用户界面了。

#### 使用上下文消费组件



### 6.6.3 有状态的上下文供应组件



### 6.6.4 使用上下文自定义钩子



>>>>>>> e71a33e887c600ad034293cca28ee824bd05ad4a:2025/学习/02 React/6 React 状态管理.md
