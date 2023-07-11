FROM matrixdotorg/synapse:v1.87.0

# Tried to solve this with testcontainers, failed
COPY matrix_data /data
RUN chown 991:991 -R /data

ENTRYPOINT ["/start.py"]
