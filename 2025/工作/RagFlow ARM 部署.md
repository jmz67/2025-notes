
下载特定 tag 的 github 仓库：

```
git clone https://github.com/infiniflow/ragflow.git

git tag

git checkout tags/v0.18.0 -b v0.18.0
```

```
DOCKER_BUILDKIT=1 docker build --build-arg LIGHTEN=1 -f Dockerfile -t infiniflow/ragflow:nightly-slim .
```

```
# syntax=docker/dockerfile:1.6
```

## 如何重启 mysql 容器服务
---
遇到连接池数量崩掉的情况，最火速的方法先重启

```
docker-compose restart mysql
```

```
vi /etc/mysql/conf.d/my.cnf

[mysqld] max_connections = 500

mysqladmin -u root -p shutdown 
mysqld_safe &
```

```
mysql:
  container_name: mysql
  image: mysql:8.2.0
  restart: always
  environment:
    MYSQL_ROOT_PASSWORD: 1234qwer
    MYSQLD_OPTS: "--max-connections=500"  # 添加此行
  volumes:
    - ./volumes/mysql/conf/:/etc/mysql/conf.d/
    - ./volumes/mysql/data/:/var/lib/mysql/
    - ./volumes/mysql/log/:/var/log/mysql/
  ports:
    - 30005:3306
  networks:
    - ai-base
```

验证是否成功：

```
docker exec -it mysql mysql -u root -p

SHOW VARIABLES LIKE 'max_connections';
```



infiniflow/ragflow:nightly-slim

```
(base) [root@bms-ntjk-0001 docker]# docker network create rf-external
a11f40e5aebbeef8322f80f9a4c2d9b14d6eea04a05b183885640d4f0fcf458b
```

/ragflow/conf/service_conf.yaml

需要查看源码，看看在哪里修改 redis 用户名

```
docker save -o ragflow_0180.tar infiniflow/ragflow:nightly-slim
```


```
docker load -i ragflow_0180.tar
```

```
scp root@60.12.208.135:/data4/ragflow/ragflow-0.18.0/docker/ragflow_0180.tar .
```

```
scp root@47.99.172.64:/root/docker_file/ragflow_0180.tar D:\DevProject\temp\
```



```
scp -r root@60.12.208.135:/data4/ragflow/ragflow-0.18.0/docker .
```

```
scp -r root@47.99.172.64:/root/docker_file/docker D:\DevProject\temp\
```


查看服务器的真实 ip 

```
ifconfig | grep -v 'br-'
```

10.9.0.44 dify 服务器 ip

---
## 开发和生产环境迁移

### mysql 迁移

对于 Mysql 的迁移来讲直接走 dump 那套东西就可以了

### elasticsearch 迁移

官方推荐使用快照的方式去进行迁移，但是考虑到我们是初次进行迁移，所以本次迁移我们使用数据盘 volumn 全量进行迁移的方式去进行迁移。

后续的迁移可以走快照的方式。

```
/data3/var/lib/docker/volumes/docker_esdata01/_data
```

/data3/var/lib/docker/volumes/docker_esdata01


#### 一些细节

elasticsearch 中的数据库的概念是索引，然后在 ragflow 中所有的向量都存在一个索引里面，我们通过这样的方式去查看索引中的文档数量：

```python
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:1200", basic_auth=("elastic", "infini_rag_flow"))

indices = es.indices.get_alias().keys()

for index in indices:
    count = es.count(index=index)['count']
    print(f"索引 {index} 中的文档数量为：{count}")

```

elasticsearch 中的文档 document 是基本的数据单元，每一条文档是一个 json 对象，类似于数据库中的一行数据。

使用下面的脚本可以看更多的细节：

```python
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:1200", basic_auth=("elastic", "infini_rag_flow"))

indices = es.indices.get_alias().keys()

for index in indices:
    # 获取文档数量
    count = es.count(index=index)['count']
    print(f"\n索引 {index} 中的文档数量为：{count}")

    if count > 0:
        # 随机查询一条文档（或者你可以用 sort）
        try:
            result = es.search(index=index, size=1)
            doc = result["hits"]["hits"][0]["_source"]
            print(f"示例文档内容：\n{doc}")
        except Exception as e:
            print(f"获取样本文档时出错：{e}")
    else:
        print("该索引为空，无文档可显示。")
```

批量开启切分的脚本：

```python
import requests
import time

API_KEY = "ragflow-g5ODAyODcyMzE1NjExZjA5ZDRmZWVkY2"
BASE_URL = "http://47.99.172.64:23038"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def list_datasets():
    url = f"{BASE_URL}/api/v1/datasets?page=1&page_size=100"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    result = response.json()
    if result["code"] != 0:
        raise Exception("获取知识库失败：" + result.get("message", ""))
    return result["data"]

def list_documents(dataset_id):
    url = f"{BASE_URL}/api/v1/datasets/{dataset_id}/documents?page=1&page_size=500"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    result = response.json()
    if result["code"] != 0:
        raise Exception(f"获取知识库 {dataset_id} 的文档失败：" + result.get("message", ""))
    return result["data"]["docs"]

def parse_single_document(dataset_id, document_id):
    url = f"{BASE_URL}/api/v1/datasets/{dataset_id}/chunks"
    payload = {"document_ids": [document_id]}
    response = requests.post(url, headers=HEADERS, json=payload)
    return response.json()

def main():
    datasets = list_datasets()
    for dataset in datasets:
        dataset_id = dataset["id"]
        dataset_name = dataset["name"]
        print(f"\n📁 正在处理知识库：{dataset_name}（ID: {dataset_id}）")

        docs = list_documents(dataset_id)
        if not docs:
            print("⚠️ 该知识库中没有文档，跳过。")
            continue

        print(f"🔍 共找到 {len(docs)} 个文档，准备依次解析...")

        for doc in docs:
            doc_id = doc["id"]
            doc_name = doc["name"]
            doc_status = doc["status"]

            print(f"📄 正在解析文档：{doc_name}（ID: {doc_id}）")

            if doc_status == "2":
                print("⏩ 文档正在处理中，跳过。")
                continue

            result = parse_single_document(dataset_id, doc_id)
            print(f"✅ 解析结果：{result}")

            if result.get("code", 1) != 0:
                print(f"❌ 文档解析失败，错误信息：{result.get('message', '无')}")
            time.sleep(0.2)  # 可选：防止请求过快

if __name__ == "__main__":
    main()
```

#### 文件权限

权限信息显示：

```
drwxr-xr-x 2 root root 4096 May 17 17:46 /volumes/esdata01/_data
```

说明：

- 该目录属主是 `root:root`
    
- 权限是 `755`，只有属主 root 有写权限，其他用户没有写权限
    

---

而你的 Elasticsearch 容器内用户是 `elasticsearch` (UID 1000)，不是 root，所以它 **没有权限写入该目录**。

---


你需要把宿主机该目录属主改成 UID 1000，组改成 root，命令：

```bash
chown -R 1000:0 /volumes/esdata01/_data
```

或者如果你只想改目录本身：

```bash
chown 1000:0 /volumes/esdata01/_data
```

之后再确认权限：

```bash
ls -ld /volumes/esdata01/_data
```

应该显示类似：

```
drwxr-xr-x 2 elasticsearch root 4096 May 17 17:46 /volumes/esdata01/_data
```

或者

```
drwxr-xr-x 2 1000 root 4096 May 17 17:46 /volumes/esdata01/_data
```

---

完成后，重启容器试试：

```bash
docker restart ragflow-es-01-test
```

---

这样就能确保 Elasticsearch 有权限写入数据目录了。你要不要我帮你写一个完整步骤？

#### 快照迁移（推荐）

```
curl -u elastic:infini_rag_flow -X PUT "http://localhost:1200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/snapshots",
    "compress": true
  }
}'
```

```
(base) [root@bms-ntjk-0001 docker]# curl -u elastic:infini_rag_flow -X PUT "http://localhost:1200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/snapshots",
    "compress": true
  }
}'
{"acknowledged":true}
```

```
curl -u elastic:infini_rag_flow -X PUT "http://localhost:1200/_snapshot/my_backup/snapshot_20240518?wait_for_completion=true"
```

```
(base) [root@bms-ntjk-0001 docker]# curl -u elastic:infini_rag_flow -X PUT "http://localhost:1200/_snapshot/my_backup/snapshot_20240518?wait_for_completion=true"

{"snapshot":{"snapshot":"snapshot_20240518","uuid":"IVM05EZ2TsKJ3ZP-0-osPQ","repository":"my_backup","version_id":8500003,"version":"8500003","indices":["ragflow_f418dbce313e11f08f3ede01ef7f6e39"],"data_streams":[],"include_global_state":true,"state":"SUCCESS","start_time":"2025-05-18T18:09:31.203Z","start_time_in_millis":1747591771203,"end_time":"2025-05-18T18:10:16.218Z","end_time_in_millis":1747591816218,"duration_in_millis":45015,"failures":[],"shards":{"total":2,"failed":0,"successful":2},"feature_states":[]}}
```

```
(base) [root@bms-ntjk-0001 ragflow-bak-docker]# curl -u elastic:infini_rag_flow -X POST "http://localhost:30043/_snapshot/my_backup/snapshot_20240518/_restore?wait_for_completion=true"
{"snapshot":{"snapshot":"snapshot_20240518","indices":["ragflow_f418dbce313e11f08f3ede01ef7f6e39"],"shards":{"total":2,"failed":0,"successful":2}}}
```



### minio 迁移

直接拿 dev 的数据 volumes 挂到 pro 的环境上去。

---

### 端口映射
---

nohup ssh -CNg -L 23040:60.12.208.135:30040 root@60.12.208.135 > /var/log/23040.log 2>&1 &



## 扩展阅读

[Ragflow技术栈分析及二次开发指南 - 53AI-AI知识库|大模型知识库|大模型训练|智能体开发](https://www.53ai.com/news/RAG/2025032823615.html)




