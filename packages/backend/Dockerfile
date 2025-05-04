FROM golang:alpine

WORKDIR /app

# Install SQLite development libraries
RUN apk add --no-cache \
    gcc \
    musl-dev \
    sqlite-dev

COPY go.* ./
RUN go mod download

COPY . .

# Build with CGO enabled and proper linking
ENV CGO_ENABLED=1 \
    CGO_CFLAGS="-g -O2 -Wno-return-local-addr"
RUN go build -o /app/main .

EXPOSE ${BACKEND_PORT}

CMD ["./main"] 