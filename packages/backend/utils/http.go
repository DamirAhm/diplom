package utils

import (
	"fmt"
	"log"
	"net/http"
	"runtime"
)

// ErrorResponse represents a structured error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message,omitempty"`
}

// RespondWithError sends an error response with proper status code and logs the error
func RespondWithError(w http.ResponseWriter, status int, message string, err error) {
	// Get caller information
	_, file, line, ok := runtime.Caller(1)
	callerInfo := "unknown"
	if ok {
		// Get just the file name without the full path
		for i := len(file) - 1; i >= 0; i-- {
			if file[i] == '/' || file[i] == '\\' {
				file = file[i+1:]
				break
			}
		}
		callerInfo = fmt.Sprintf("%s:%d", file, line)
	}

	// Log the error with detailed information
	if err != nil {
		log.Printf("ERROR [%s] %s: %v", callerInfo, message, err)
	} else {
		log.Printf("ERROR [%s] %s", callerInfo, message)
	}

	// Send error response
	http.Error(w, message, status)
}
