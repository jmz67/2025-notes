在 nextjs 中 `<></>` 是 react fragment 的间写语法，用于在不添加额外 DOM 节点的情况下，将多个元素组合在一起。

为什么需要 Fragment 呢？在 react 中组件必须返回单个根元素。如果直接返回多个同级元素（如两个 div 会导致语法错误）

传统解决方案是用 `<div>` 包裹所有元素，但这会导致不必要的 DOM 节点：

```
// ✅ 但会添加额外的 div return ( <div> <div>元素1</div> <div>元素2</div> </div> );
```