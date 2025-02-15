Go 语言最有意思的并且最新奇的特性就是对并发编程的支持。并发编程是一个大话题，在第八章和第九章中会专门讲到。这里我们只浅尝辄止地来体验一下 Go 语言里的 goroutine 和 channel 。

下面的例子 fetchall ，和前面的小节的 fetch 程序所要的工作基本一致，fetchall 的特别之处在于它会同时去获取所有 URL ，所以这个程序的总执行时间不会超过执行时间最长的那个任务，前面的 fetch 程序执行的时间则是所有任务的执行时间之和。fetchall 程序只会打印获取的内容的大小和经过时间，不会像之前那样打印获取的内容。

```go
// fetchall fetches URLs in parallel and reports their times and sizes 
package main 

import (
    "fmt" // 标准库，用于格式化输入输出
    "io" // 提供基本的 IO 功能
    "io/ioutil" // 提供高级的 IO 操作，如读取文件或网络响应
    "net/http" // 提供 HTTP 客户端和服务器实现
    "os" // 提供和操作系统交互的功能
    "time" // 提供时间相关的功能
)

// 主函数
func main() {
    start := time.Now() // 记录程序开始运行的时间
    ch := make(chan string) // 创建一个字符串通道，用于在 goroutine 之间传递消息
    for _, url := range os.Args[1:] {
        go fetch(url, ch) // 启动一个 goroutine,调用 fetch 函数并传递 URL 和通道
    }
    for range os.Args[1:] {
        // 遍历每个 URL，等待所有 goroutine 完成
        fmt.Println(<ch) // 从通道接收消息并打印
    }
    fmt.Printf("%.2fs elapesd\n", time.Since(start).Seconds()) // 打印程序运行的总时间
}
```