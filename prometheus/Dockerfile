FROM prom/prometheus:v2.51.0
COPY prometheus.yml.template /etc/prometheus/prometheus.yml.template

USER root

EXPOSE 9090
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:9090/-/healthy || exit 1

# Use sed to inject variables at runtime (since envsubst/apk are not available)
CMD ["/bin/sh", "-c", "sed -e \"s/\\${BACKEND_TARGET}/$BACKEND_TARGET/g\" -e \"s/\\${CADVISOR_TARGET}/$CADVISOR_TARGET/g\" /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml && exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus"]
