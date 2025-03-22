package middleware

import (
	"log"
	"net/http"
	"os"
	"time"
)

// ResponseWriterWrapper wraps a http.ResponseWriter to capture the status code
type ResponseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

// NewResponseWriterWrapper creates a new ResponseWriterWrapper
func NewResponseWriterWrapper(w http.ResponseWriter) *ResponseWriterWrapper {
	return &ResponseWriterWrapper{
		ResponseWriter: w,
		statusCode:     http.StatusOK, // Default status code
	}
}

// WriteHeader captures the status code before passing it to the original ResponseWriter
func (rww *ResponseWriterWrapper) WriteHeader(statusCode int) {
	rww.statusCode = statusCode
	rww.ResponseWriter.WriteHeader(statusCode)
}

// Write captures the response body before passing it to the original ResponseWriter
func (rww *ResponseWriterWrapper) Write(b []byte) (int, error) {
	rww.body = b
	return rww.ResponseWriter.Write(b)
}

// Logger is a middleware that logs request details including errors
func Logger(next http.Handler) http.Handler {
	// Create a logger that includes timestamps
	logger := log.New(os.Stdout, "", log.LstdFlags)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap the response writer to capture status code
		wrw := NewResponseWriterWrapper(w)

		// Process the request
		next.ServeHTTP(wrw, r)

		// Log request details
		duration := time.Since(start)

		// Log errors (status codes >= 400)
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
