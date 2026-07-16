# ──────────────────────────────────────────────
#  LACALA Dashboard — Static site via nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all app files into nginx public root
COPY index.html   /usr/share/nginx/html/
COPY app.js       /usr/share/nginx/html/
COPY style.css    /usr/share/nginx/html/
COPY resumen.pdf  /usr/share/nginx/html/
COPY docs/        /usr/share/nginx/html/docs/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
