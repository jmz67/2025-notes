目前我们学习了最新的句法，还探讨了指导 React 开发的函数式编程模式。这些都是未来下一步学习做准备，也就是本章要讲的 React 的运行机制。我们要开始编写真正的 React 代码了。

使用 React 构建应用几乎离不开 JSX。这是一种基于标签的 Js 句法，看起来很像 HTML。JSX 句法在下一章我们会详细说明，本书后续章节会不断用到。然而，若想要完全理解 React ，必须搞懂 React 最基本的构成单元，也就是 React 元素。随后，我们将探讨 React 元素。接着，讨论 React 组件，学习如何创建组成其他组件和元素的自定义组件。

## 4.1 页面设置

为了在浏览器中使用 React，我们需要引入两个库：React 和 ReactDOM。前者用于创建视图，后者则具体负责在浏览器中渲染 UI。这两个库都可以通过 unpkg CDN 引用（链接见下代码片段）。我们来创建一个 HTML 文档：

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>React Samples</title>
    </head>
    <body>
        <!-- 目标容器 -->
        <div id="root"></div>

        <!-- React 和 ReactDOM 库（开发版本） -->
        <script src="https://unpkg.com/react@16/umd/react.development.js">
        </script>
        <script src="https://unpkg.com/react@16/umd/react-dom.development.js">
        </script>
        <script>
            // 纯 React 和 Js 代码
        </script>
    </body>
</html>
```

这是在浏览器中使用 React 需要做的最少的工作。你可以将 Js 代码放在单独的文件中，不过页面中加载时必须放在 React 后面。为了在浏览器控制台中看到所有错误消息和警告，我们使用的是 React 的开发版本。我们也可使用 react.production.min.js 和 react-dom.production.min.js ，换成供生产环境使用的简化版本，只是看不到警告消息了。

## 4.2 React 元素

简单来说，HTML 是一系列指令，让浏览器构建 DOM。浏览器加载 HTML 并渲染用户界面，构成 HTML 文档的元素变成 DOM 元素。

比如说你想要一个菜谱构建 HTML 层次结构。这项任务可能的一种实现方案如下所示：

```html
<section id="baked-salmon">
    <h1>Baked Salmon</h1>
    <ul class="ingredients">
        <li>2 lb salmon</li>
        <li>5 sprigs fresh rosemary</li>
        <li>2 tablespoons olive oil</li>
    </ul>
    <section class="instruction">
        <h2>Cooking Instruction</h2>
        <p>....</p>
    </section>
</section>
```

在 HTML 中，元素之间呈现一种层次结构，就像家谱一样。我们可以说根元素（在本例中是一个区块）有三个子代：一个标题，一个配料无序列表，以及一个操作说明区块。

过去，网站由相互独立的 HTML 页面组成，用户访问这些页面，浏览器请求并加载各 HTML 文档。AJAX 的发明引入了单页应用的概念，由于浏览器可以通过 AJAX 请求并加载少量数据之后，整个Web 应用便可以精简成一个页面，依靠 Js 更新用户界面。

在单页应用中，浏览器只在开始时加载一个 HTML 文档。在用户浏览网站的过程中，始终待在同一个页面。用户不断与应用进行交互，Js 则不断销毁和创建新的用户界面。这给人感觉就像是从一个页面跳到了另一个页面，但是实际上你仍然在相同的 HTML 页面上，背后繁重的工作都交给了 Js 了。

DOM API 是一系列对象，给 Js 和浏览器进行交互，修改 DOM。如果你曾经使用过 document.createElement 或是 document.appendChild，那你就用过 DOM API。

React 是代我们更新浏览器 DOM 的一个库。我们不再需要关心构建高性能单页应用相关的复杂问题了，一切都交给了 React 。有了 React ，我们不再直接和 DOM API 进行交互，而是指明想让 React 构建什么，React 收到指令之后就会帮助我们渲染和协调元素。

浏览器 DOM 由 DOM 元素组成，类似地，React DOM 由 React 元素组成。DOM 元素和 React 元素看着类似，其实区别很大。React 元素是真正的 DOM 元素的描述。换句话说，React 元素是如何创建浏览器 DOM 的指令。

我们可以使用 React.createElement 创建一个表示 h1 的 React 元素：

```html
React.createElement("h1", {id: "recipe-0"}, "Baked Salmon");
```

第一个参数指定想要创建的元素类型，这里我们想创建的是一个 h1 元素。第二个参数设定元素的属性。这个 h1 有个 id 属性，值为 recipe-0 。第三个参数指定元素的子节点，即插入起始和结束标签之间的节点（这里只插入了一些文本）。

渲染的时候，React 将把这个元素转换成真正的 DOM 元素：

```html
<h1 id="recipe-0">Baked Salmon</h1>
```

属性以类似的方式赋予新创建的 DOM 元素，添加到标签的属性中，而子节点则作为元素内的文本。React 组件实际上就是 JS 字面量，告知 React 如何构建 DOM 元素。

在控制台中输出这个元素，我们会看到如下内容：

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>React Samples</title>
    </head>
    <body>
        <!-- 目标容器 -->
        <div id="root"></div>

        <!-- React 和 ReactDOM 库（开发版本） -->
        <script src="https://unpkg.com/react@16/umd/react.development.js">
        </script>
        <script src="https://unpkg.com/react@16/umd/react-dom.development.js">
        </script>
        <script>
            const reactElement = React.createElement(
                "h1", {"id": "recipe-0"}, "Baked Salmon"
            );

            ReactDOM.render(
                reactElement,
                document.getElementById("root")
            );

			console.log(reactElement);
        </script>
    </body>
</html>
```

```html
1. $$typeof: Symbol(react.element)
2. key: null
3. props: {id: 'recipe-0', children: 'Baked Salmon'}
4. ref: null
5. type: "h1"
6. _owner: null
7. _store: {validated: false}
8. _self: null
9. _source: null
10. [[Prototype]]: Object
```

这是一个 React 元素的结构，其中一些字段是给 React 使用的，这些字段我们会在后续进行介绍。在这里我们先讲 type 和 props 字段。

React 元素的 type 属性告诉 React 要创建的是什么类型的 HTML 或 SVG 元素。props 属性表示构建一个 DOM 元素所需要的数据和子元素。children 属性则表示嵌套显示在元素内的文本。
## 4.3 React-DOM

创建 React 元素之后，我们希望在浏览器中看到它的效果。ReactDOM 就提供了在浏览器中渲染 React 元素所需要的工具。渲染所需的 render 方法在 ReactDOM 中。

React 元素，包括它的子元素，使用 ReactDOM.render 在 DOM 中渲染。我们想渲染的元素通过第一个参数传入，第二个参数是目标节点，即指明在哪里渲染元素。

```js
const dish = React.createElement("h1", null, "Baked Salmon");

ReactDOM.render(dish, document.getElementById("root"));
```

这段代码在 DOM 中渲染标题元素，把一个 h1 元素添加到 id 为 root 的 div 元素（已经在 HTML 中定义）中。这个 div 元素在 body 标签内构建。

```html

```
## 4.4 React 组件

