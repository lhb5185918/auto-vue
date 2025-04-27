# 构建阶段
FROM node:16-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (或 yarn.lock)
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

# 配置 API 地址（确保你的前端代码会读取这个环境变量）
ENV VUE_APP_API_BASE_URL=http://47.94.195.221:8000/api

# 构建应用
RUN npm run build

# 生产阶段 - 使用同一个 Node 镜像，但不需要所有的开发依赖
FROM node:16-alpine as production-stage

# 安装 serve 包（轻量级静态文件服务器）
RUN npm install -g serve

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建结果
COPY --from=build-stage /app/dist .

# 暴露 5000 端口（serve 的默认端口）
EXPOSE 5000

# 启动服务器
CMD ["serve", "-s", ".", "-l", "5000"]