FROM prom/prometheus:v2.51.0
COPY prometheus.yml /etc/prometheus/prometheus.yml
EXPOSE 9090
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:9090/-/healthy || exit 1
