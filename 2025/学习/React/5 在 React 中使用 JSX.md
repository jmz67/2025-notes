前一章讲解了 React 的运行机制，我们知道一个 React 应用是由一系列小型的可重用片段即组件构成。组件渲染元素树和其他组件。通过 creatElement 函数可以清晰地看出 React 是如何运行的，可是作为 React 开发者，我们不会这么做。自己动手编写复杂，可读性不高的 Js 句法树可不是一件令人愉快的事情。为了高效使用 React，我们还需要一个工具 JSX。

JSX 是 JS 中的 JS 和 XML 中的 X 的综合体，是对 JS 的扩展，**使用一种基于标签的句法直接在 JS 代码中定义 React 元素**。JSX 容易和 HTML 混淆，毕竟二者看起来很像。JSX 也是一种创建 REACT 元素的方式，有了它你就再也不用为复杂的 createElement 调用中缺少逗号而抓狂了。

本章讨论如何使用 JSX 构建 React 应用。

## 5.1 使用 JSX 创建 React 元素

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
        <script src="https://unpkg.com/react@16/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
        <!-- 引入 Babel，用于在线编译 JSX -->
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

        <scipt type="text/babel">
            // 定义一个函数式组件 IngredientsList
            function IngredientsList() {
                const ingredients = [
                    "Salmon",
                    "Pine Nuts",
                    "Butter Lettuce"
                ];

                return (
                    <ul>
                        {ingredients.map((ingredient, i) => (
                            <li key={i}>{ingredient}</li>
                        ))}
                    </ul>
                )
            }

            // 渲染 IngredientsList 组件到 DOM 中
            ReactDOM.render(<IngredientsList />, document.getElementById("root"));
        </script>
    </body>
</html>
```

