# PurePak server — Zorc deployment image.
# node:22-slim required: server uses the built-in node:sqlite module (Node >= 22.6).
FROM node:22-slim

WORKDIR /app
# copy both trees the server needs: server/ (backend) and web/ (static UI)
COPY server/ ./server/
COPY web/    ./web/

ENV NODE_ENV=production \
    PORT=8080 \
    PUREPAK_DATA_DIR=/var/lib/purepak

# curl must exist IN the container: the platform's healthcheck (Coolify)
# shells into the container and curls /health there. node:22-slim ships
# neither curl nor wget, so the check fails with "command not found" and the
# (perfectly healthy) container gets rolled back.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-create the data dir owned by the runtime user. When the platform mounts
# its persistent (named) volume on first start, Docker initializes the empty
# volume from these image contents — so the SQLite db + receipt files end up
# owned by `node` and writable, not root.
RUN mkdir -p /var/lib/purepak/receipts \
    && chown -R node:node /var/lib/purepak

EXPOSE 8080

# run as non-root
USER node

# --experimental-sqlite: keeps node:sqlite working across Node 22 point
# releases (no-op warning on versions where it's already unflagged).
CMD ["node", "--experimental-sqlite", "server/server.js"]
