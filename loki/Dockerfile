FROM grafana/loki:2.9.6
COPY loki-config.yaml /etc/loki/config.yaml
EXPOSE 3100
CMD ["-config.file=/etc/loki/config.yaml"]
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3100/ready || exit 1
