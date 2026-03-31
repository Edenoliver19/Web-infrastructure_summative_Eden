FROM haproxy:2.9-alpine

# Copy our custom config into the image
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

# Validate config on build
RUN haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 80 8404

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
