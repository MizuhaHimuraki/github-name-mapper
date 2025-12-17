FROM node:20-alpine

WORKDIR /app

# 让容器对外可访问；数据文件放到可挂载目录
ENV HOST=0.0.0.0 \
    PORT=8787 \
    DATA_FILE=/data/data.json \
    NODE_ENV=production

# 准备数据目录（用于持久化），并预置一份默认数据
RUN mkdir -p /data && chown -R node:node /data
COPY --chown=node:node data.json /data/data.json
COPY --chown=node:node server.mjs /app/server.mjs

USER node

EXPOSE 8787

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT||8787) + '/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]


