# PurePak server — Zorc deployment image.
# node:22-slim required: server uses the built-in node:sqlite module (Node >= 22.6).
FROM node:22-slim

WORKDIR /app
# copy both trees the server needs: server/ (backend) and web/ (static UI)
COPY server/ ./server/
COPY web/    ./web/

ENV NODE_ENV=production \
    PORT=4310

EXPOSE 4310

# run as non-root
USER node

CMD ["node", "server/server.js"]
