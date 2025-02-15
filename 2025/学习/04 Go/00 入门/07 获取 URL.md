对于很多现代应用来说，访问互联网上的信息和访问本地文件系统一样重要。Go 语言在 net 这个强大的 package 的帮助下提供了一系列的 package 来做这件事情，使用这些包可以更简单地用网络收发信息，还可以建立更底层的网络连接，编写服务器程序。在这些情景下，Go 语言原生的并发特性显得尤其好用。

为了最简单的展示基于 HTTP 获取信息的方式，下面给出一个示例程序 fetch ，这个程序将获取对应的 url ，并将其源文本打印出来；这个例子的灵感来源于 curl 工具。。当然，curl 提供的功能更为复杂丰富，这里只编写最简单的样例。这个样例之后还会多次被用到。

```go
// Fetch print the content found at a URL
package main 

import (
    "fmt" // 标准库，用于格式化输入输出
    "io/ioutil" // 提供给 IO 的高级操作，如读取文件或网络响应
    "net/http" // 提供 HTTP 客户端和服务器的实现
    "os" // 提供和操作系统交互的功能
)

func main() {
    for _, url := range os.Args[1:] {
        // 遍历命令行参数，跳过第一个参数，即程序名称
        // 在这里是遍历每个 URL 
        resp, err := http.Get(url)
        // 发送 HTTP GET 请求到指定的 URL 
        if err != nil {
            // 如果发生错误，程序就会将错误信息打印到标准错误
            fmt.Fprintf(os.Stderr, "fetch: %v\n", err)
            // 退出程序
            os.Exit(1)
        }
        b, err := ioutil.ReadAll(resp.Body)
        // 读取 HTTP 响应的正文内容
        resp.Body.Close()
        // 关闭响应体，释放资源
        if err != nil {
            fmt.Fprintf(os.Stderr, "fetch: reading %s: %v\n", url, err)
            os.Exit(1)
        }
        fmt.Printf("%s", b)
    }
}
```

这个程序从两个 package 中导入了函数，net/http 和 io/ioutil 包，http.Get 函数是创建 HTTP 请求的函数，如果获取过程没有出错，那么会在 resp 这个结构体中得到访问的请求结果。resp 的 Body 字段包括了一个可读的服务器响应流。ioutil.ReadAll 函数从 response 中读取到全部内容；

