```
start /w "" "Docker Desktop Installer.exe" install --backend=wsl-2 --installation-dir=F:\DevEnv\docker --wsl-default-data-root=F:\DevEnv\wsl --accept-license
```

[Windows系统如何将Docker安装到指定盘_docker默认安装c盘-CSDN博客](https://blog.csdn.net/qq_41467216/article/details/131946655)

```
D:\milvus>docker-compose up -d
time="2025-03-10T21:48:11+08:00" level=warning msg="D:\\milvus\\docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
[+] Running 24/24
 ✔ standalone Pulled                                                                                             890.5s
   ✔ fe556ec02776 Download complete                                                                                3.2s
   ✔ 1a85eda45f31 Download complete                                                                              859.9s
   ✔ 8eb8dbadcd02 Download complete                                                                              883.6s
   ✔ ea7fe75cc05c Download complete                                                                               59.7s
   ✔ d5fd17ec1767 Download complete                                                                              221.0s
   ✔ e37e6fd9107e Download complete                                                                                3.4s
   ✔ 337d68d90cd1 Download complete                                                                              383.2s
   ✔ 1f27396f6efc Download complete                                                                                2.5s
 ✔ etcd Pulled                                                                                                   395.1s
   ✔ 1e815a2c4f55 Download complete                                                                                0.6s
   ✔ cb4f77bfee6c Download complete                                                                              121.4s
   ✔ e5485096ca5d Download complete                                                                                1.5s
   ✔ 7c21e2da1038 Download complete                                                                               39.5s
   ✔ 3ea3736f61e1 Download complete                                                                                1.4s
   ✔ dbba69284b27 Download complete                                                                              391.3s
   ✔ 270b322b3c62 Download complete                                                                              125.8s
 ✔ minio Pulled                                                                                                  392.4s
   ✔ 05f217fb8612 Download complete                                                                              387.5s
   ✔ b12cc8972a67 Download complete                                                                                0.6s
   ✔ 4324e307ea00 Download complete                                                                                4.9s
   ✔ 152089595ebc Download complete                                                                                3.5s
   ✔ c1ff217ec952 Download complete                                                                                3.3s
   ✔ c7e856e03741 Download complete                                                                              292.5s
network ai declared as external, but could not be found
```

```
docker network create ai
```

```
D:\milvus>docker network create ai
d39b162b4d02f771dd80607144e95e683707a7202c7bc26697363f07009fd268

D:\milvus>docker-compose up -d
time="2025-03-10T22:07:28+08:00" level=warning msg="D:\\milvus\\docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
[+] Running 3/3
 ✔ Container milvus-etcd        Started                                                                            0.7s
 ✔ Container milvus-minio       Started                                                                            0.7s
 ✔ Container milvus-standalone  Started 
```

配置本地环境进行 Pycharm ssh 测试 debug

[windows下pycharm配置跳板机和多个跳板机连接服务器，全流程（用于python debug） - 知乎](https://zhuanlan.zhihu.com/p/587084175)

在 postresql 中创建用户，并给予它可以进行数据库迁移的权限

```sql
create user dify_cdss with password 'dify_cdss';  
  
grant all privileges on database dify_cdss to dify_cdss;  
  
GRANT USAGE ON SCHEMA public TO dify_cdss;  
GRANT CREATE ON SCHEMA public TO dify_cdss;
```

64a70a7aab8b

4e99a8df00ff