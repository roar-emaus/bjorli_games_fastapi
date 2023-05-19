# Dockerfile
FROM python:3.11

# Install nginx and supervisor
RUN apt-get update && \
    apt-get install -y nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the FastAPI application
COPY ./app /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy nginx configuration file
COPY ./nginx/nginx.conf /etc/nginx

# Copy the HTML/CSS/JS files
COPY ./web /var/www/html

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Start supervisor, which starts nginx & uvicorn
CMD ["/usr/bin/supervisord"]
