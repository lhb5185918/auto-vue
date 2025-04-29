# Docker + Nginx 部署指南

## 前提条件
- 安装 Docker：`sudo apt-get install docker.io`
- 安装 Docker Compose：`sudo apt-get install docker-compose`

## 部署步骤

1. 将项目克隆到服务器上

```bash
git clone <你的项目仓库地址>
cd <项目目录>
```

2. 使用Docker Compose构建并启动容器

```bash
# 构建并在后台运行容器
docker-compose up -d

# 查看容器状态
docker ps
```

3. 访问应用
   - 通过服务器IP或域名直接访问（默认80端口）

## 常用命令

- 停止并移除容器：`docker-compose down`
- 查看容器日志：`docker logs vue-app`
- 重启容器：`docker-compose restart`
- 重新构建并启动：`docker-compose up -d --build`

## 注意事项

- 如果需要更改后端API地址，请修改`nginx.conf`文件中的proxy_pass配置
- 确保服务器防火墙已开放80端口
- 如果使用域名访问，请正确配置DNS解析

## 环境变量配置
如需在构建时注入环境变量，可以在项目根目录创建`.env.production`文件，添加相关配置：

```
VITE_API_BASE_URL=/api
``` 