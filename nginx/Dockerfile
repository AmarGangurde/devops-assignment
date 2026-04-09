FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf

# Create log dirs and set permissions for non-root operation
RUN mkdir -p /var/log/nginx /var/cache/nginx /tmp \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx \
    && chmod -R 755 /var/log/nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
