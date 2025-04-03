package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/damirahm/diplom/backend/utils"
	"github.com/joho/godotenv"
)

type Config struct {
	DBPath     string
	Server     ServerConfig
	Auth       AuthConfig
	ClientHost string
	Cron       CronConfig
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

type CronConfig struct {
	Enabled       bool
	CrawlInterval time.Duration
	ScopusAPIKey  string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using default values")
	}

	cronEnabled := true
	if val := os.Getenv("CRON_ENABLED"); val != "" {
		var err error
		cronEnabled, err = strconv.ParseBool(val)
		if err != nil {
			log.Printf("Warning: invalid CRON_ENABLED value, using default (true)")
			cronEnabled = true
		}
	}

	crawlInterval := 24 * time.Hour
	if val := os.Getenv("CRON_INTERVAL_HOURS"); val != "" {
		hours, err := strconv.Atoi(val)
		if err != nil {
			log.Printf("Warning: invalid CRON_INTERVAL_HOURS value, using default (24)")
		} else {
			crawlInterval = time.Duration(hours) * time.Hour
		}
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
		Cron: CronConfig{
			Enabled:       cronEnabled,
			CrawlInterval: crawlInterval,
			ScopusAPIKey:  getEnv("SCOPUS_API_KEY", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
