Go 语言的内置库使得写一个类似 fetch 的 web 服务器变得异常简单。在本节中，我们会展示一个微型的服务器，这个服务器的功能是返回当前用户正在访问的 URL ，例如用户访问的是 http://localhost:8000/hello ，那么响应是 URL.Path = "hello" 。

```go
// server1 is a minimal echo server 

package main 

import {
    "fmt"
    "log"
    "net/http"
}

func main() {
    http.HandleFunc("/", handler) // each request calls handler
    log.Fatal(http.ListenAndServe("localhost:8000", nil))
}

// handler echoes the Path component of the request URL 
func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "URL.Path = %q\n", r.URL.Path)
}
```

