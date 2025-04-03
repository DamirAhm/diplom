package middleware

import (
	"log"
	"net/http"
	"os"
	"time"
)

type ResponseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

func NewResponseWriterWrapper(w http.ResponseWriter) *ResponseWriterWrapper {
	return &ResponseWriterWrapper{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (rww *ResponseWriterWrapper) WriteHeader(statusCode int) {
	rww.statusCode = statusCode
	rww.ResponseWriter.WriteHeader(statusCode)
}

func (rww *ResponseWriterWrapper) Write(b []byte) (int, error) {
	rww.body = b
	return rww.ResponseWriter.Write(b)
}

func Logger(next http.Handler) http.Handler {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrw := NewResponseWriterWrapper(w)

		next.ServeHTTP(wrw, r)

		duration := time.Since(start)

		if wrw.statusCode >= http.StatusBadRequest {
			bodyStr := string(wrw.body)
			if len(bodyStr) > 100 {
				bodyStr = bodyStr[:100] + "..." // Truncate long error messages
			}
			logger.Printf("ERROR [%s] %s %s %d %v %s",
				r.Method,
				r.RequestURI,
				r.RemoteAddr,
				wrw.statusCode,
				duration,
				bodyStr)
		} else {
			logger.Printf("INFO [%s] %s %s %d %v",
				r.Method,
				r.RequestURI,
				r.RemoteAddr,
				wrw.statusCode,
				duration)
		}
	})
}
