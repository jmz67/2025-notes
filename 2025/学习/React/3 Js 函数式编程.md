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

声明式方式易于理解和阅读，各个函数是如何shi'xain

