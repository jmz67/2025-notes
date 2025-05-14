
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