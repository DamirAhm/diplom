FROM golang:alpine

WORKDIR /app

# Install SQLite development libraries
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY go.* ./
RUN go mod download

COPY . .

# Build with CGO enabled and proper linking
ENV CGO_ENABLED=1 \
    CGO_CFLAGS="-g -O2 -Wno-return-local-addr"
RUN go build -o /app/main .

EXPOSE ${BACKEND_PORT}

CMD ["./main"] 