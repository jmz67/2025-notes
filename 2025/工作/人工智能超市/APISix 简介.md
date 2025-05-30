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

| Authorization 值 | 认证结果 | 行为                        |
| --------------- | ---- | ------------------------- |
| `123`           | ✅ 成功 | 直接通过，返回 200               |
| `321`           | ✅ 成功 | 返回 200，并设置响应头 `X-User-ID` |
| 其他或空            | ❌ 失败 | 返回 403，并设置 `Location` 跳转  |

创建 Forward Auth 路由 `/headers`

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

|参数|说明|
|---|---|
|`uri`|指向认证服务的完整 URL|
|`request_headers`|从客户端请求中提取哪些 header 发送给认证服务|
|`upstream_headers`|从认证服务响应中提取哪些 header 设置给上游服务|
|`client_headers`|从认证服务响应中提取哪些 header 回传给客户端（如跳转用）|

```shell
curl http://127.0.0.1:9080/headers -H 'Authorization: 123'
```

### 实操

```shell
curl -X PATCH http://211.90.240.240:30015/apisix/admin/routes/1748598600021 \
-H "Content-Type: application/json" \
-H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
-d '{
  "plugins": {
    "forward-auth": {
      "uri": "http://101.71.97.95:86/prod-api/massAuthentication",
      "request_method": "POST",
      "request_headers": ["Authorization"],
      "timeout": 3000
    }
  }
}'
```

结果：

```shell
(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl -X PATCH http://211.90.240.240:30015/apisix/admin/routes/1748598600021 \
-H "Content-Type: application/json" \
-H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
-d '{
  "plugins": {
    "forward-auth": {
      "uri": "http://101.71.97.95:86/prod-api/massAuthentication",
      "request_method": "POST",
      "request_headers": ["Authorization"],
      "timeout": 3000
    }
  }
}'

{"key":"/apisix/routes/1748598600021","value":{"uri":"/portal/listShopResource","create_time":1748598709,"upstream_id":"1748598600021","id":"1748598600021","update_time":1748600804,"plugins":{"forward-auth":{"status_on_error":403,"upstream_headers":{},"uri":"http://101.71.97.95:86/prod-api/massAuthentication","client_headers":{},"request_headers":["Authorization"],"ssl_verify":true,"request_method":"POST","keepalive":true,"keepalive_timeout":60000,"keepalive_pool":5,"timeout":3000,"allow_degradation":false}},"upstream":{"scheme":"http","type":"roundrobin","nodes":{},"hash_on":"vars","pass_host":"pass"},"priority":0,"status":1}}
```

## 如何通过 apisix 统计 gpustack 接口的 token 
---

> 如何通过 apisix 统计 gpustack 接口的返回的 token 值，就是说我 apisix 转发了一个 ai 接口，这个 ai 接口的返回体中是有 token 的消耗量的，请问如何进行一个统计？

其中响应的 json 中包含以下信息

```
"usage": {
  "prompt_tokens": 30,
  "completion_tokens": 8,
  "total_tokens": 38
}
```

我们希望通过 apisix 拦截这些数据，并将 token 的使用情况以 prometheus 指标进行上报。

### 步骤一：启用 prometheus 插件

确保 apisix 全局启用了 prometheus 插件

```
curl -X PUT http://127.0.0.1:9180/apisix/admin/plugin_metadata/prometheus \
  -H "X-API-KEY: <your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "export_addr": "0.0.0.0:9091"
  }'
```

我们可以通过以下地址访问这些指标：

```
http://<apisix-host>:9091/apisix/prometheus/metrics
```

### 步骤二：创建自定义插件 token_metrics 

1. 将以下 Lua 文件保存为 `/usr/local/apisix/apisix/plugins/token_metrics.lua`：

```lua
local core = require("apisix.core")
local prometheus = require("apisix.plugins.prometheus")
local cjson = require("cjson.safe")

local plugin_name = "token_metrics"
local _M = {
    version = 0.1,
    priority = 12,
    name = plugin_name,
}

local token_total
local token_prompt
local token_completion

function _M.init()
    local prom = prometheus.get_prometheus()
    if not prom then
        return nil, "Prometheus plugin is not initialized"
    end

    token_total = prom:counter("ai_total_tokens", "Total tokens used", {"model", "route"})
    token_prompt = prom:counter("ai_prompt_tokens", "Prompt tokens used", {"model", "route"})
    token_completion = prom:counter("ai_completion_tokens", "Completion tokens used", {"model", "route"})
end

function _M.body_filter(conf, ctx)
    local chunk, eof = core.response.get_body()
    if not eof or not chunk then
        return
    end

    local body = cjson.decode(chunk)
    if not body or not body.usage then
        return
    end

    local model = body.model or "unknown"
    local route_id = ctx.conf.id or "unknown"

    local prompt = tonumber(body.usage.prompt_tokens) or 0
    local completion = tonumber(body.usage.completion_tokens) or 0
    local total = tonumber(body.usage.total_tokens) or (prompt + completion)

    token_total:inc({model, route_id}, total)
    token_prompt:inc({model, route_id}, prompt)
    token_completion:inc({model, route_id}, completion)
end

return _M
```

2. 编辑 apisix 以启用该插件

修改 `/usr/local/apisix/conf/config.yaml` 中的插件列表：

```
plugins:
  - prometheus
  - token_metrics
```

3. 重启 apisix 

### 步骤三：创建路由绑定插件

绑定需要统计的 ai 路由到插件

```
curl -X PUT http://127.0.0.1:30015/apisix/admin/routes/gpustack-chat \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -H "Content-Type: application/json" \
  -d '{
    "uri": "/v1-openai/chat/completions",
    "methods": ["POST"],
    "plugins": {
      "token_metrics": {}
    },
    "upstream": {
      "type": "roundrobin",
      "scheme": "http",
      "nodes": {
        "211.90.240.240:30001": 1
      }
    }
  }'
```

### 步骤四：验证统计数据

向接口发起请求

```
curl -X POST http://127.0.0.1:9080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "Qwen2.5-32B-Instruct", ... }'
```

```
http://127.0.0.1:9091/apisix/prometheus/metrics
```


## apisix 实操
---

联通健康云服务器 apisix 密钥：

```
edd1c9f034335f136f87ad84b625c8f1
```

```shell
curl http://127.0.0.1:9180/apisix/admin/upstreams/10001 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "type": "roundrobin",
    "nodes": {
        "192.168.120.210:8081": 1
    }
}'
```

```
{"key":"/apisix/upstreams/10001","value":{"type":"roundrobin","scheme":"http","pass_host":"pass","nodes":{"192.168.120.210:8081":1},"update_time":1748505929,"hash_on":"vars","create_time":1748505888,"id":"10001"}}
```

```shell
curl http://127.0.0.1:9180/apisix/admin/routes/10001 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "uri": "/chat/*",
    "upstream_id": "10001"
}'
```

```
{"key":"/apisix/routes/10001","value":{"upstream_id":"10001","create_time":1748505955,"status":1,"update_time":1748505955,"uri":"/chat/*","priority":0,"id":"10001"}}
```

查看所有上游

```shell
curl http://127.0.0.1:9180/apisix/admin/upstreams \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1"
```

```shell
curl http://127.0.0.1:9180/apisix/admin/upstreams/10001 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1"
```

查看所有路由

```shell
curl http://127.0.0.1:9180/apisix/admin/routes \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" 
```

```shell
curl http://127.0.0.1:9180/apisix/admin/routes/10001 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1"
```


访问这个路由

```
http://192.168.120.44:9080/chat
```

```shell
curl http://127.0.0.1:9180/apisix/admin/routes/10001 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "uri": "/chat/*",
    "plugins": {
      "proxy-rewrite": {
        "regex_uri": ["^/chat/(.*)", "/$1"]
      }
    },
    "upstream_id": "10001"
}'
```

---

```shell
curl http://127.0.0.1:30015/apisix/admin/plugins/list \
  -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1'
```

```shell
curl http://127.0.0.1:30015/apisix/admin/upstreams/10002 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "type": "roundrobin",
    "nodes": {
        "211.90.240.240:30001": 1
    }
}'
```

```shell
curl http://127.0.0.1:30015/apisix/admin/routes/10002 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "uri": "/chat/*",
    "plugins": {
      "proxy-rewrite": {
        "regex_uri": ["^/chat/(.*)", "/$1"]
      }
    },
    "upstream_id": "10002"
}'
```

出现错误

```shell
(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl http://127.0.0.1:30015/apisix/admin/routes/10002 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "uri": "/chat/*",
    "plugins": {
      "proxy-rewrite": {
        "regex_uri": ["^/chat/(.*)", "/$1"]
      }
    },
    "upstream_id": "10002"
}'
{"error_msg":"unknown plugin [proxy-rewrite]"}
```

需要在 conf 文件里面加

```shell
plugins:
  - proxy-rewrite  # 确保这一行存在
  # 其他已启用的插件...
```

```shell
docker-compose restart apisix
```

```shell
curl -X POST "http://127.0.0.1:30016/chat/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gpustack_910b75220f3749a4_02defc61fa8e96f651f292a2d70014fa" \
  -d '{"model": "Qwen2.5-32B-Instruct", "messages": [{"role": "user", "content": "你好！"}]}'
```

```shell
curl http://127.0.0.1:9094/apisix/prometheus/metrics
```

但是没有发现那些指标，因为我们还没有绑定 token 到那个上面去

```shell
curl http://127.0.0.1:30015/apisix/admin/routes/10002 \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -X PUT \
  -d '{
    "uri": "/chat/*",
    "plugins": {
      "proxy-rewrite": {
        "regex_uri": ["^/chat/(.*)", "/$1"]
      },
      "token_metrics": {}
    },
    "upstream_id": "10002"
}'

```

### 实操结果

```shell
(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl -X POST "http://127.0.0.1:30016/chat/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gpustack_910b75220f3749a4_02defc61fa8e96f651f292a2d70014fa" \
  -d '{"model": "Qwen2.5-32B-Instruct", "messages": [{"role": "user", "content": "你好！"}]}'
{"id":"chatcmpl-159f9d17b1664bd196df9e4d37797dd4","object":"chat.completion","created":1748574038,"model":"Qwen2.5-32B-Instruct","choices":[{"index":0,"message":{"role":"assistant","reasoning_content":null,"content":"你好！有什么可以帮助你的吗？","tool_calls":[]},"logprobs":null,"finish_reason":"stop","stop_reason":null}],"usage":{"prompt_tokens":31,"total_tokens":39,"completion_tokens":8,"prompt_tokens_details":null},"prompt_logprobs":null}

(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl http://127.0.0.1:curl http://127.0.0.1:9094/apisix/prometheus/metrics

# HELP apisix_ai_completion_tokens Completion tokens returned
# TYPE apisix_ai_completion_tokens counter
apisix_ai_completion_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 8
# HELP apisix_ai_prompt_tokens Prompt tokens returned
# TYPE apisix_ai_prompt_tokens counter
apisix_ai_prompt_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 31
# HELP apisix_ai_total_tokens Total LLM tokens returned
# TYPE apisix_ai_total_tokens counter
apisix_ai_total_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 39
# HELP apisix_etcd_modify_indexes Etcd modify index for APISIX keys
# TYPE apisix_etcd_modify_indexes gauge
apisix_etcd_modify_indexes{key="consumers"} 0
apisix_etcd_modify_indexes{key="global_rules"} 0
apisix_etcd_modify_indexes{key="max_modify_index"} 600
apisix_etcd_modify_indexes{key="prev_index"} 599
apisix_etcd_modify_indexes{key="protos"} 0
apisix_etcd_modify_indexes{key="routes"} 600
apisix_etcd_modify_indexes{key="services"} 0
apisix_etcd_modify_indexes{key="ssls"} 0
apisix_etcd_modify_indexes{key="stream_routes"} 0
apisix_etcd_modify_indexes{key="upstreams"} 542
apisix_etcd_modify_indexes{key="x_etcd_index"} 600
# HELP apisix_etcd_reachable Config server etcd reachable from APISIX, 0 is unreachable
# TYPE apisix_etcd_reachable gauge
apisix_etcd_reachable 1
# HELP apisix_http_requests_total The total number of client requests since APISIX started
# TYPE apisix_http_requests_total gauge
apisix_http_requests_total 144
# HELP apisix_nginx_http_current_connections Number of HTTP connections
# TYPE apisix_nginx_http_current_connections gauge
apisix_nginx_http_current_connections{state="accepted"} 135
apisix_nginx_http_current_connections{state="active"} 131
apisix_nginx_http_current_connections{state="handled"} 135
apisix_nginx_http_current_connections{state="reading"} 0
apisix_nginx_http_current_connections{state="waiting"} 1
apisix_nginx_http_current_connections{state="writing"} 130
# HELP apisix_nginx_metric_errors_total Number of nginx-lua-prometheus errors
# TYPE apisix_nginx_metric_errors_total counter
apisix_nginx_metric_errors_total 0
# HELP apisix_node_info Info of APISIX node
# TYPE apisix_node_info gauge
apisix_node_info{hostname="c3e8428d44d9"} 1
# HELP apisix_shared_dict_capacity_bytes The capacity of each nginx shared DICT since APISIX start
# TYPE apisix_shared_dict_capacity_bytes gauge
apisix_shared_dict_capacity_bytes{name="balancer-ewma"} 10485760
apisix_shared_dict_capacity_bytes{name="balancer-ewma-last-touched-at"} 10485760
apisix_shared_dict_capacity_bytes{name="balancer-ewma-locks"} 10485760
apisix_shared_dict_capacity_bytes{name="etcd-cluster-health-check"} 10485760
apisix_shared_dict_capacity_bytes{name="internal-status"} 10485760
apisix_shared_dict_capacity_bytes{name="lrucache-lock"} 10485760
apisix_shared_dict_capacity_bytes{name="plugin-ai-rate-limiting"} 10485760
apisix_shared_dict_capacity_bytes{name="plugin-ai-rate-limiting-reset-header"} 10485760
apisix_shared_dict_capacity_bytes{name="prometheus-metrics"} 10485760
apisix_shared_dict_capacity_bytes{name="upstream-healthcheck"} 10485760
apisix_shared_dict_capacity_bytes{name="worker-events"} 10485760
# HELP apisix_shared_dict_free_space_bytes The free space of each nginx shared DICT since APISIX start
# TYPE apisix_shared_dict_free_space_bytes gauge
apisix_shared_dict_free_space_bytes{name="balancer-ewma"} 10412032
apisix_shared_dict_free_space_bytes{name="balancer-ewma-last-touched-at"} 10412032
apisix_shared_dict_free_space_bytes{name="balancer-ewma-locks"} 10412032
apisix_shared_dict_free_space_bytes{name="etcd-cluster-health-check"} 10412032
apisix_shared_dict_free_space_bytes{name="internal-status"} 10412032
apisix_shared_dict_free_space_bytes{name="lrucache-lock"} 10412032
apisix_shared_dict_free_space_bytes{name="plugin-ai-rate-limiting"} 10412032
apisix_shared_dict_free_space_bytes{name="plugin-ai-rate-limiting-reset-header"} 10412032
apisix_shared_dict_free_space_bytes{name="prometheus-metrics"} 10391552
apisix_shared_dict_free_space_bytes{name="upstream-healthcheck"} 10412032
apisix_shared_dict_free_space_bytes{name="worker-events"} 10412032

(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl -X POST "http://127.0.0.1:30016/chat/v1/chat/completions"   -H "Content-Type: application/json"   -H "Authorization: Bearer gpustack_910b75220f3749a4_02defc61fa8e96f651f292a2d70014fa"   -d '{"model": "Qwen2.5-32B-Instruct", "messages": [{"role": "user", "content": "你好！"}]}'
{"id":"chatcmpl-3aa061001e9b45dea909697cea4d8683","object":"chat.completion","created":1748574841,"model":"Qwen2.5-32B-Instruct","choices":[{"index":0,"message":{"role":"assistant","reasoning_content":null,"content":"你好！有什么可以帮助你的吗？","tool_calls":[]},"logprobs":null,"finish_reason":"stop","stop_reason":null}],"usage":{"prompt_tokens":31,"total_tokens":39,"completion_tokens":8,"prompt_tokens_details":null},"prompt_logprobs":null}

(base) root@11110000:/data/workspaces/zhujunmiao/apisix/example# curl -X POST "http://127.0.0.1:30016/chat/v1/chat/completions"   -H "Content-Type: application/json"   http://127.0.0.1:9094/apisix/prometheus/metrics

# HELP apisix_ai_completion_tokens Completion tokens returned
# TYPE apisix_ai_completion_tokens counter
apisix_ai_completion_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 16
# HELP apisix_ai_prompt_tokens Prompt tokens returned
# TYPE apisix_ai_prompt_tokens counter
apisix_ai_prompt_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 62
# HELP apisix_ai_total_tokens Total LLM tokens returned
# TYPE apisix_ai_total_tokens counter
apisix_ai_total_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 78
# HELP apisix_etcd_modify_indexes Etcd modify index for APISIX keys
# TYPE apisix_etcd_modify_indexes gauge
apisix_etcd_modify_indexes{key="consumers"} 0
apisix_etcd_modify_indexes{key="global_rules"} 0
apisix_etcd_modify_indexes{key="max_modify_index"} 600
apisix_etcd_modify_indexes{key="prev_index"} 599
apisix_etcd_modify_indexes{key="protos"} 0
apisix_etcd_modify_indexes{key="routes"} 600
apisix_etcd_modify_indexes{key="services"} 0
apisix_etcd_modify_indexes{key="ssls"} 0
apisix_etcd_modify_indexes{key="stream_routes"} 0
apisix_etcd_modify_indexes{key="upstreams"} 542
apisix_etcd_modify_indexes{key="x_etcd_index"} 600
# HELP apisix_etcd_reachable Config server etcd reachable from APISIX, 0 is unreachable
# TYPE apisix_etcd_reachable gauge
apisix_etcd_reachable 1
# HELP apisix_http_requests_total The total number of client requests since APISIX started
# TYPE apisix_http_requests_total gauge
apisix_http_requests_total 303
# HELP apisix_nginx_http_current_connections Number of HTTP connections
# TYPE apisix_nginx_http_current_connections gauge
apisix_nginx_http_current_connections{state="accepted"} 137
apisix_nginx_http_current_connections{state="active"} 131
apisix_nginx_http_current_connections{state="handled"} 137
apisix_nginx_http_current_connections{state="reading"} 0
apisix_nginx_http_current_connections{state="waiting"} 1
apisix_nginx_http_current_connections{state="writing"} 130
# HELP apisix_nginx_metric_errors_total Number of nginx-lua-prometheus errors
# TYPE apisix_nginx_metric_errors_total counter
apisix_nginx_metric_errors_total 0
# HELP apisix_node_info Info of APISIX node
# TYPE apisix_node_info gauge
apisix_node_info{hostname="c3e8428d44d9"} 1
# HELP apisix_shared_dict_capacity_bytes The capacity of each nginx shared DICT since APISIX start
# TYPE apisix_shared_dict_capacity_bytes gauge
apisix_shared_dict_capacity_bytes{name="balancer-ewma"} 10485760
apisix_shared_dict_capacity_bytes{name="balancer-ewma-last-touched-at"} 10485760
apisix_shared_dict_capacity_bytes{name="balancer-ewma-locks"} 10485760
apisix_shared_dict_capacity_bytes{name="etcd-cluster-health-check"} 10485760
apisix_shared_dict_capacity_bytes{name="internal-status"} 10485760
apisix_shared_dict_capacity_bytes{name="lrucache-lock"} 10485760
apisix_shared_dict_capacity_bytes{name="plugin-ai-rate-limiting"} 10485760
apisix_shared_dict_capacity_bytes{name="plugin-ai-rate-limiting-reset-header"} 10485760
apisix_shared_dict_capacity_bytes{name="prometheus-metrics"} 10485760
apisix_shared_dict_capacity_bytes{name="upstream-healthcheck"} 10485760
apisix_shared_dict_capacity_bytes{name="worker-events"} 10485760
# HELP apisix_shared_dict_free_space_bytes The free space of each nginx shared DICT since APISIX start
# TYPE apisix_shared_dict_free_space_bytes gauge
apisix_shared_dict_free_space_bytes{name="balancer-ewma"} 10412032
apisix_shared_dict_free_space_bytes{name="balancer-ewma-last-touched-at"} 10412032
apisix_shared_dict_free_space_bytes{name="balancer-ewma-locks"} 10412032
apisix_shared_dict_free_space_bytes{name="etcd-cluster-health-check"} 10412032
apisix_shared_dict_free_space_bytes{name="internal-status"} 10412032
apisix_shared_dict_free_space_bytes{name="lrucache-lock"} 10412032
apisix_shared_dict_free_space_bytes{name="plugin-ai-rate-limiting"} 10412032
apisix_shared_dict_free_space_bytes{name="plugin-ai-rate-limiting-reset-header"} 10412032
apisix_shared_dict_free_space_bytes{name="prometheus-metrics"} 10391552
apisix_shared_dict_free_space_bytes{name="upstream-healthcheck"} 10412032
apisix_shared_dict_free_space_bytes{name="worker-events"} 10412032
```

### 分析

```shell
apisix_ai_completion_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 8
# HELP apisix_ai_prompt_tokens Prompt tokens returned
# TYPE apisix_ai_prompt_tokens counter
apisix_ai_prompt_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 31
# HELP apisix_ai_total_tokens Total LLM tokens returned
# TYPE apisix_ai_total_tokens counter
apisix_ai_total_tokens{model="Qwen2.5-32B-Instruct",route="unknown"} 39
```

现在的问题是只能收集到所有安插过这个插件的接口返回的 token 消耗数量总和，如何区分，更多的指标还需要确定。但好歹这条路是走通了。

## Dashboard 
---

```
/root/big_file
```

