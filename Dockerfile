# PurePak server — Zorc deployment image.
# node:22-slim required: server uses the built-in node:sqlite module (Node >= 22.6).
FROM node:22-slim

WORKDIR /app
# copy both trees the server needs: server/ (backend) and web/ (static UI)
COPY server/ ./server/
COPY web/    ./web/

ENV NODE_ENV=production \
    PORT=4310 \
    PUREPAK_DATA_DIR=/var/lib/purepak

# Pre-create the data dir owned by the runtime user. When the platform mounts
# its persistent (named) volume on first start, Docker initializes the empty
# volume from these image contents — so the SQLite db + receipt files end up
# owned by `node` and writable, not root.
RUN mkdir -p /var/lib/purepak/receipts \
    && chown -R node:node /var/lib/purepak

EXPOSE 4310

# run as non-root
USER node

CMD ["node", "server/server.js"]
