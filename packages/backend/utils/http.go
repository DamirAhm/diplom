package utils

import (
	"fmt"
	"log"
	"net/http"
	"runtime"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message,omitempty"`
}

func RespondWithError(w http.ResponseWriter, status int, message string, err error) {
	_, file, line, ok := runtime.Caller(1)
	callerInfo := "unknown"
	if ok {
		for i := len(file) - 1; i >= 0; i-- {
			if file[i] == '/' || file[i] == '\\' {
				file = file[i+1:]
				break
			}
		}
		callerInfo = fmt.Sprintf("%s:%d", file, line)
	}

	if err != nil {
		log.Printf("ERROR [%s] %s: %v", callerInfo, message, err)
	} else {
		log.Printf("ERROR [%s] %s", callerInfo, message)
	}

	http.Error(w, message, status)
}
