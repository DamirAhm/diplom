#!/bin/sh

# Create a temporary file
cat > /etc/nginx/nginx.conf.tmp << 'EOL'
events {
    worker_connections 1024;
}

http {
    client_max_body_size 32m; # Allow larger file uploads

    upstream frontend {
        server frontend:${FRONTEND_PORT};
    }

    upstream backend {
        server backend:${BACKEND_PORT};
    }

    server {
        listen 80;
        listen 80 http2;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /uploads {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOL

# Replace only the specific environment variables
sed -i "s/\${FRONTEND_PORT}/$FRONTEND_PORT/g" /etc/nginx/nginx.conf.tmp
sed -i "s/\${BACKEND_PORT}/$BACKEND_PORT/g" /etc/nginx/nginx.conf.tmp

# Move the temporary file to the final location
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;' 