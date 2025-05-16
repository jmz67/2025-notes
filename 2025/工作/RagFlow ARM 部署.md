
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

对于 Mysql 的迁移来讲直接走 dump 那套东西就可以了

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

```



