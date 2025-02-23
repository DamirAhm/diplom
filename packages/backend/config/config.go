package config

import (
	"log"
	"os"

	"github.com/damirahm/diplom/backend/utils"
	"github.com/joho/godotenv"
)

type Config struct {
	DBPath      string
	Server      ServerConfig
	Auth        AuthConfig
	ClientHost  string
}

type ServerConfig struct {
	Host string
	Port string
}

type AuthConfig struct {
	AdminUsername string
	AdminPassword string
	CookieName    string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using default values")
	}

	return &Config{
		DBPath: getEnv("DB_PATH", "./data/database.db"),
		Server: ServerConfig{
			Host: getEnv("HOST", "localhost"),
			Port: getEnv("PORT", "8080"),
		},
		Auth: AuthConfig{
			AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
			AdminPassword: utils.HashPassword(getEnv("ADMIN_PASSWORD", "changeme")),
			CookieName:    "admin_session",
		},
		ClientHost: getEnv("CLIENT_HOST", "http://localhost:3000"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
