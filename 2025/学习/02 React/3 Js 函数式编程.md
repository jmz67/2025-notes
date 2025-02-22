踏上 React 之旅之后，我们会发现函数式编程随处不在，越来越多的 Js 项目开始采用函数式编程技术，React 项目尤甚。不经意间，你可能已经编写过函数式的 Js 代码。如果你使用 map 或 reduce 处理过数组，那么你就已经走上了函数式 Js 程序员的道路。函数式 js 不仅是 React 的核心思想，也是 React 生态系统中很多库的重要编程手段。

## 3.1 函数式编程是什么意思

Js 支持函数式编程，因为在 Js 中，函数是一等成员。这意味着，变量可以做到的事情函数都可以做到。最新的 Js 句法对这门语言做了一些改进，使用函数式编程更加方便了，例如箭头函数，promise 和展开运算符。

在 Js 中，函数可以表示应用的数据。你应该已经注意到了，函数可以使用 var，let 或是 const 关键字声明，就像声明字符串，数字等变量一样。

```js
var log = function(message) {
    console.log(message);
};

log("In js, function are variables")
```

这个函数还可以使用箭头函数句法来编写。函数式程序员经常编写小巧的函数，箭头函数句法大大简化了这个过程。

```js
const log = message => {
    console.log(message);
};
```

由于函数是变量，那就可以把函数添加到对象中去。

## 3.2 命令式和声明式

函数式编程是一个更大编程范式的一部分，即声明式编程。声明式编程式一种编程风格，采用这种风格开发的应用有一个显著的特点：重点描述该怎么做，而不管怎么做。

为了充分理解声明式编程，要和命令式编程对比一下。命令式编程风格只关注如何使用代码得到结果。以一个常见的任务为例：让字符串符合 URL 格式要求。通常，我们要把字符串中的空格替换成连字符，因为空格不符合 URL 的格式要求。先使用命令式风格解决这个任务：

```js
const string = "Restaurants in Hanalei";
const urlFriendly = "";

for (var i=0; i < string.length; i++) {
    if(string[i] === " "){
        urlFriendly += "-"
    } else {
        urlFriendly += string[i]
    }
}

console.log(urlFriendly)
```

下面来看看我们如何使用声明式编程风格完成这一任务：

```js
const string = "Restaurants in Hanalei";
const urlFriendly = string.replace(/ /g, "-");

console.log(urlFriendly);
```

这里我们使用 string.replace 通过正则表达式把所有空格替换成了连字符。使用 string.replace 就是在描述应该做什么操作：把字符串中的空格替换掉。具体如何处理空格则隐藏在 replace 函数中。在采用声明式编程风格的程序中，句法本身描述的式应该做什么事，至于怎么做则被隐藏起来了。

采用声明式编程风格的程序易于理解，因为代码本身就说明了在做什么。

```js
const loadAndMapMembers = compose(
    combineWith(sessionStorage, "members"),
    ...
);

getFakeMembers(100).then(loadAndMapMembers);
```

声明式方式易于理解和阅读，各个函数是如何实现的都隐藏了起来。这些小巧的函数命名合理，而且以一种清晰明了的方式组合在一起，一眼就可以看出成员数据在加载之后保存起来了，然后又通过映射再打印出来。这种方式不需要多少注释。本质上说，采用声明式编程开发出来的应用更容易被理解，因而也就更易于弹性伸缩。

下面再来看一个任务：构建文档对象模型（document object model，DOM）声明式方法关注的是如何构建 DOM：

```js
const target = document.getElementById("target");
const wrapper = document.createElement("div");
const headline = document.createElement("h1");

wrapper.id = "welcome";
headline.innerText = "Hello World";

wrapper.appendChild(headline);
target.appendChild(wrapper);
```

这段代码涉及到创建元素，设置元素，以及把元素添加进入文档中。这样一来就很难做出改动和添加的功能，或者扩充到 10000 行代码。

下面我们来看看 react 组件以声明式的方式构建 DOM：

```js
const { render } = ReactDOM;

const Welcome = () => (
    <div id="welcome">
        <h1>Hello World</h1>
    </div>
);

render(<Welcome />, document.getElementById("target"));
```

React 是声明式的。这里，Welcome 组件描述了如何渲染 DOM。render 函数使用组件中声明的指令构建 DOM，隐藏了如何渲染 DOM 的细节信息。可以清楚地看出，我们想做的是在 ID 为 target 的元素中渲染 Welcome 组件。

## 3.3 函数式编程基本概念

现在你对函数式编程有了一定的了解，也知道函数式或声明式的意思。接下来介绍函数式编程的一些核心概念：不可变性，纯函数，数据转换，高阶函数和递归。

### 3.3.1 不可变性

可变指可以更改，不可变也就是说不可更改。在采用函数式风格的程序中，数据式不可变的，永不更改。

如果你需要对外公开自己的出生证明，但是想要去掉隐私信息，你有两个选择：拿一个大号的马克笔把出生证明上的隐私信息涂掉，或者找一台复印机，复制一份出生证明，然后用大号的马克笔涂改副本。这是更好的选择，这样既处理了出生证明，又保证了原件的完好无损。

应用中的不可变数据就是这个意思。我们不直接更改原始数据结构，而是创建数据结构的副本，所有操作都使用副本。

为了理解不可变的思想，我们来看看更改数据式什么情况。假如有一个对象表示草绿色：

```js
let color_lawn = {
    title: "lawn",
    color: "#00FF00",
    rating: 0
};
```

我们可以构建一个函数为颜色打分，使用这个函数更改 color 对象的评分。

```js
function rateColor(color, rating) {
    color.rating = rating;
    return color;
}

console.log(rateColor(color_lawn, 5).rating) // 5
console.log(color_lawn.rating) // 5
```

**在 Js 中，函数的参数式对真正数据的引用**，像前例那样设置颜色的评分会更改或改变原颜色对象。