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

import 和 export 句法还没有得到所有的浏览器和 node 的支持，然而，和其他的 Js 新句法一样，Babel 支持。这意味着我们可以在自己的源码中使用这些句法，Babel 知道在何处寻找我们要使用的句法，把找到的模块