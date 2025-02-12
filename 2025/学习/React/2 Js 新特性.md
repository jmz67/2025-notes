
## 2.5 Js 异步编程

截至到目前，本章给出的代码示例都是同步的，我们编写的同步的 Js 代码是一系列按照顺序立即执行的指令。比如使用 Js 做简单的 DOM 处理，可能会写出如下的代码：

```js
const header = document.getElementById("heading");
header.innerHTML = "Hey!";
```

这些就是指令，去选择 id 为 heading 的元素，然后把这个元素中的 HTML 设置为 Hey! ，这一切都是同步的。一项操作在执行的过程中，不执行其他的操作。

在现代的 web 中，离不开异步任务，这种任务通常需要等到其他作业结束才能完成。我们可能需要访问数据库，可能需要缓存视频或者音频内容，可能需要从 API 中获取数据。在 Js 中，异步任务不阻塞主线程，在等待 API 返回数据的时段内，Js 是空闲的，可以去做其他的事情，过去几年中 Js 获得了长足的发展，进一步简化了异步操作的处理机制，本节将介绍异步编程有关的部分特性。

### 2.5.1 使用 fetch 处理简单的 promise

在以前，请求 REST API 是一件非常

## 2.6 类

## 2.7 ES6 模块

Js 模块是一组可以重用的代码，方便插入其他 Js 文件中而不产生变量冲突。Js 模块保存在单独的文件中，一个文件一个模块。创建和导出模块有两个选择：从一个模块中导出多个 Js 对象，或者从一个模块中导出一个 Js 对象。

下面的 text-helper.js 模块中导出了两个函数：

```js
export const print=(message) => log(message, new Date())
export const log=(message, timestamp) => 
	console.log(`${timestamp.toString()}: ${message}`)
```

export 可以导出供其他模块使用的任何 Js 类型。在这个示例中，导出的是 print 和 log 两个函数，其他的内容外部不可以访问。

模块也可以只导出一个主变量，此时，使用 export default 。例如，mt-freel.js 可以导出一个特定的对象：

```js
export default new Expedition("Mt. Freel", 2, ["water", "snack"]);
```

如果只想要导出一个类型，就可以把 export 换成 export default 。同样，export 和 export default 都可以用于导出任何 Js 类型：原始类型，对象，数组和函数。

在其他文件中使用一个模块，可以使用 import 导入。导出多个对象的模块可以充分利用对象析构。使用 export default 的模块导入为一个变量：

```js
import {print, log} from "./text-helpers";
import freel from "./mt-freel";

print("print a message");
log("log a message");

freel.print();
```

导入的模块变量也可以放在其他变量名下面：

```js
import {print as p, log as l} from "./text-helpers";

p("print a message");
l("log a message");
```

此外也可以使用 * 把一切都导入为一个变量：

```js
import * as fns from './text-helpers'
```

import 和 export 句法还没有得到所有的浏览器和 node 的支持，然而，和其他的 Js 新句法一样，Babel 支持。这意味着我们可以在自己的源码中使用这些句法，Babel 知道在何处寻找我们要使用的句法，把找到的模块添加到编译到的 Js 代码中。

> ES6 引入了原生的模块系统，允许开发者使用 `import` 和 `export` 来分别导入和导出模块的功能。然而，在 ES6 标准发布之后，不是所有的浏览器或 Node.js 环境立刻提供了对这些新特性的支持。这意味着如果你直接在代码中使用了 `import` 和 `export`，你的代码可能无法在一些旧版本的浏览器或环境中正常运行。
> 
> 为了解决这个问题，Babel 这样的工具应运而生。Babel 是一个 JavaScript 编译器，它可以将使用了现代 JavaScript 特性（包括但不限于 `import` 和 `export` 句法）的代码转换成向后兼容的版本，使得这些代码可以在那些不支持这些特性的环境中执行。具体来说，Babel 能够识别源码中的新句法，并将其转换为旧版 JavaScript（如 ES5），这样就可以确保代码拥有更广泛的兼容性。
> 
> 当你在项目中配置并使用 Babel 后，你可以直接在源码中使用 `import` 和 `export` 等新句法。Babel 会负责分析你的源码，找到你使用的这些现代 JavaScript 特性，并把它们编译成目标环境中能够理解的形式。这样，即使目标环境不支持这些新的 JavaScript 特性，通过 Babel 的编译过程，你的代码仍然可以正确执行。

