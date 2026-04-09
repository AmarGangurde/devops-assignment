FROM grafana/grafana:10.4.0

ENV GF_SECURITY_ADMIN_USER=admin \
    GF_SECURITY_ADMIN_PASSWORD=supachat123 \
    GF_USERS_ALLOW_SIGN_UP=false \
    GF_USERS_DEFAULT_THEME=dark \
    GF_ANALYTICS_REPORTING_ENABLED=false \
    GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=""

COPY provisioning /etc/grafana/provisioning

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/health || exit 1
