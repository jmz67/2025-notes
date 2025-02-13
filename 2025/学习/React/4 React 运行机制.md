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

这是在浏览器中使用 React 需要做的最少的工作。你可以将 Js 代码放在单独的文件中，不过页面中加载时必须放在 React 后面。为了在浏览器控制台中看到所有错误消息和警告，我们使用的是 React 的开发版本。我们也可使用 react.productio