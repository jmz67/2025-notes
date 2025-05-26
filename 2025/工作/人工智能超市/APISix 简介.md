### 负载均衡是为了什么？Load-Balance
---
假设你的网站突然火爆了，一堆用户进行访问。我们有两台服务器都能处理请求，但是：
- 不负载均衡：用户的请求可能全部打到一台机器上，另一台机器闲着，导致宕机。
- **用负载均衡**：用户的请求被“分配”到两台服务器上，大家分工合作，就不会卡死了。

这样做的目的在于：
- **提高性能**：多台服务器协作，比单台快。
- **可扩展性**：可以加更多服务器。
- **可靠性**：一台挂了，其他还能顶上去。
### Apache APISIX 是什么？
---
Apache APISIX 是一个 **开源的 API 网关**，它的工作是：
- 接收客户端请求；    
- 做权限校验、安全过滤、限流等操作；    
- 把请求转发给后端服务。
    
你可以把它想象成一个智能的“交通警察”。

## 配置路由
---

```json
curl -i "http://127.0.0.1:9180/apisix/admin/routes" \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "id": "getting-started-ip",
    "uri": "/ip",
    "upstream": {
      "type": "roundrobin",
      "nodes": {
        "httpbin.org:80": 1
      }
    }
  }'
```

这条命令告诉 APISIX：

> “当用户访问 `/ip` 时，把请求转发到 `httpbin.org:80/ip`，并使用轮询策略进行负载均衡。”

虽然只有一个节点（httpbin.org:80），但这个结构支持扩展多个节点，比如：

```json
"nodes": {
  "server1:80": 1,
  "server2:80": 1
}
```

这样就能在两个服务器之间轮询请求，实现真正的“负载均衡”。

## Forward-Auth
---

我们希望对 `/headers` 路由请求做认证，认证逻辑不写在主服务里，而是代理到一个独立的认证服务（即 Forward Auth 方式），根据返回结果判断是否允许访问主服务。

我们首先创建一个认证服务：

```shell
curl -X PUT 'http://127.0.0.1:9180/apisix/admin/routes/auth' \
    -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
    -H 'Content-Type: application/json' \
    -d '{
        "uri": "/auth",
        "plugins": {
            "serverless-pre-function": {
                "phase": "rewrite",
                "functions": [
                    "return function (conf, ctx)
                        local core = require(\"apisix.core\");
                        local authorization = core.request.header(ctx, \"Authorization\");

                        -- 情况 1：Authorization 为 '123'，通过认证
                        if authorization == \"123\" then
                            core.response.exit(200);
                        
                        -- 情况 2：Authorization 为 '321'，通过认证 + 设置 header
                        elseif authorization == \"321\" then
                            core.response.set_header(\"X-User-ID\", \"i-am-user\");
                            core.response.exit(200);

                        -- 情况 3：无效认证，跳转至登录页
                        else
                            core.response.set_header(\"Location\", \"http://example.com/auth\");
                            core.response.exit(403);
                        end
                    end"
                ]
            }
        }
    }'
```



```shell
curl -X PUT 'http://127.0.0.1:9180/apisix/admin/routes/1' \
    -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
    -d '{
        "uri": "/headers",
        "plugins": {
            "forward-auth": {
                "uri": "http://127.0.0.1:9080/auth",     
                "request_headers": ["Authorization"],     
                "upstream_headers": ["X-User-ID"],        
                "client_headers": ["Location"]            
            }
        },
        "upstream": {
            "nodes": {
                "httpbin.org:80": 1                       
            },
            "type": "roundrobin"
        }
    }'
```

```shell
curl http://127.0.0.1:9080/headers -H 'Authorization: 123'
```

## 如何通过 apisix 统计 gpustack 接口的 token 
---
