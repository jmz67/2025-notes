对于很多现代应用来说，访问互联网上的信息和访问本地文件系统一样重要。Go 语言在 net 这个强大的 package 的帮助下提供了一系列的 package 来做这件事情，使用这些包可以更简单地用网络收发信息，还可以建立更底层的网络连接，编写服务器程序。在这些情景下，Go 语言原生的并发特性显得尤其好用。

为了最简单的展示基于 HTTP 获取信息的方式，下面给出一个示例程序 fetch ，这个程序将获取对应的 url ，并将其源文本打印出来；这个例子的灵感来源于 curl 工具。。当然，curl 提供的功能更为复杂丰富，这里只编写最简单的样例。这个样例之后还会多次被用到。

```go
// Fetch print the content found at a URL
package main 

import (
    "fmt"
    "io/ioutil"
    "net/http"
    "os"
)

func main() {
    for _, url := range os.Args[1:] {
        resp, err := http.Get(url)
        if err != nil {
            fmt.Fprintf(os.Stderr, )
        }
    }
}
```

这个程序从两个 package 中导入了函数，net/http 和 io/ioutil 包，