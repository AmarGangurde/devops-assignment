FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Create log dirs and set permissions for non-root operation
RUN mkdir -p /var/log/nginx /var/cache/nginx /tmp \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx \
    && chmod -R 755 /var/log/nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1

# Use envsubst to inject environment variables into the config
CMD ["/bin/sh" , "-c" , "envsubst '${FRONTEND_UPSTREAM} ${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]
