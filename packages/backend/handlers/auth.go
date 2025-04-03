package handlers

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"time"

	"github.com/damirahm/diplom/backend/config"
)

type contextKey string

const IsAdminKey contextKey = "isAdmin"

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthHandler struct {
	config *config.Config
}

func NewAuthHandler(config *config.Config) *AuthHandler {
	return &AuthHandler{
		config: config,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	usernameMatch := subtle.ConstantTimeCompare([]byte(req.Username), []byte(h.config.Auth.AdminUsername)) == 1
	passwordMatch := subtle.ConstantTimeCompare([]byte(req.Password), []byte(h.config.Auth.AdminPassword)) == 1

	if !usernameMatch || !passwordMatch {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     h.config.Auth.CookieName,
		Value:    "true",
		Path:     "/",
		MaxAge:   int(24 * time.Hour.Seconds()),
		HttpOnly: true,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:  h.config.Auth.CookieName,
		Value: "",

		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}

func AuthMiddleware(config *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "OPTIONS" {
				next.ServeHTTP(w, r)
				return
			}

			_, err := r.Cookie(config.Auth.CookieName)
			if err != nil {
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), IsAdminKey, true)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
