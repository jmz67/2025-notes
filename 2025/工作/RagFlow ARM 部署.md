
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
docker save -o ragflow_ my_image:tag
```