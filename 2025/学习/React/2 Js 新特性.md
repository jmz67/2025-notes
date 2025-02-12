## 2.7 ES6 模块

Js 模块是一组可以重用的代码，方便插入其他 Js 文件中而不产生变量冲突。Js 模块保存在单独的文件中，一个文件一个模块。创建和导出模块有两个选择：从一个模块中导出多个 Js 对象，或者从一个模块中导出一个 Js 对象。

下面的 text-helper.js 模块中导出了两个函数：

```js
export const print=(message) => log(message, new Date())
export const log=(message, timestamp) => 
	console.log(`${timestamp.toString()}: ${message}`)
```

export 可以导出供其他模块使用的任何 Js 类型。在这个示例中，导出的是 print 和 log 两个函数，其他的内容外部不可以访问。

模块也可以只导出一个主变量，