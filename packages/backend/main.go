package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/damirahm/diplom/backend/config"
	"github.com/damirahm/diplom/backend/cron"
	"github.com/damirahm/diplom/backend/db"
	"github.com/damirahm/diplom/backend/docs"
	"github.com/damirahm/diplom/backend/handlers"
	"github.com/damirahm/diplom/backend/middleware"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title           Diplom Backend API
// @version         1.0




type application struct {
	server             *http.Server
	db                 *sql.DB
	config             *config.Config
	publicationCrawler *cron.PublicationCrawler
}

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dataDir := filepath.Dir(cfg.DBPath)
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatal(err)
	}

	if err := db.InitDB(cfg.DBPath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	localizedStringRepo := repository.NewSQLiteLocalizedStringRepo(db.DB)
	partnerRepo := repository.NewSQLitePartnerRepo(db.DB)
	researcherRepo := repository.NewSQLiteResearcherRepo(db.DB, localizedStringRepo)
	publicationRepo := repository.NewSQLitePublicationRepo(db.DB, localizedStringRepo, researcherRepo)
	projectRepo := repository.NewSQLiteProjectRepo(db.DB, localizedStringRepo)
	trainingMaterialRepo := repository.NewSQLiteTrainingMaterialRepo(db.DB, localizedStringRepo)

	router := mux.NewRouter()

	router.Use(middleware.Logger)

	docs.SwaggerInfo.BasePath = "/api"
	docs.SwaggerInfo.Host = cfg.Server.Host + ":" + cfg.Server.Port
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	partnersHandler := handlers.NewPartnerHandler(partnerRepo)
	projectsHandler := handlers.NewProjectHandler(projectRepo)
	researchersHandler := handlers.NewResearcherHandler(researcherRepo)
	publicationsHandler := handlers.NewPublicationHandler(publicationRepo)
	trainingHandler := handlers.NewTrainingHandler(trainingMaterialRepo)
	authHandler := handlers.NewAuthHandler(cfg)
	fileHandler := handlers.NewFileHandler()

	api := router.PathPrefix("/api").Subrouter()

	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST", "OPTIONS")
	api.HandleFunc("/publications/public", publicationsHandler.GetPublicPublications).Methods("GET")

	protected := api.PathPrefix("").Subrouter()
	protected.Use(handlers.AuthMiddleware(cfg))

	api.HandleFunc("/partners", partnersHandler.GetAllPartners).Methods("GET")
	api.HandleFunc("/partners/{id}", partnersHandler.GetPartnerByID).Methods("GET")
	protected.HandleFunc("/partners", partnersHandler.CreatePartner).Methods("POST")
	protected.HandleFunc("/partners/{id}", partnersHandler.UpdatePartner).Methods("PUT")
	protected.HandleFunc("/partners/{id}", partnersHandler.DeletePartner).Methods("DELETE")

	api.HandleFunc("/projects", projectsHandler.GetProjects).Methods("GET")
	api.HandleFunc("/projects/{id}", projectsHandler.GetProject).Methods("GET")
	protected.HandleFunc("/projects", projectsHandler.CreateProject).Methods("POST")
	protected.HandleFunc("/projects/{id}", projectsHandler.UpdateProject).Methods("PUT")
	protected.HandleFunc("/projects/{id}", projectsHandler.DeleteProject).Methods("DELETE")

	api.HandleFunc("/researchers", researchersHandler.GetResearchers).Methods("GET")
	api.HandleFunc("/researchers/{id}", researchersHandler.GetResearcher).Methods("GET")
	protected.HandleFunc("/researchers", researchersHandler.CreateResearcher).Methods("POST")
	protected.HandleFunc("/researchers/{id}", researchersHandler.UpdateResearcher).Methods("PUT")
	protected.HandleFunc("/researchers/{id}", researchersHandler.DeleteResearcher).Methods("DELETE")

	protected.HandleFunc("/publications", publicationsHandler.GetPublications).Methods("GET")
	protected.HandleFunc("/publications", publicationsHandler.CreatePublication).Methods("POST")
	protected.HandleFunc("/publications/{id}", publicationsHandler.GetPublication).Methods("GET")
	protected.HandleFunc("/publications/{id}", publicationsHandler.UpdatePublication).Methods("PUT")
	protected.HandleFunc("/publications/{id}", publicationsHandler.DeletePublication).Methods("DELETE")
	protected.HandleFunc("/publications/{id}/toggle-visibility", publicationsHandler.TogglePublicationVisibility).Methods("PUT")
	protected.HandleFunc("/publications/{id}/authors", publicationsHandler.GetPublicationAuthors).Methods("GET")

	api.HandleFunc("/training", trainingHandler.GetTrainingMaterials).Methods("GET")
	api.HandleFunc("/training/{id}", trainingHandler.GetTrainingMaterial).Methods("GET")
	protected.HandleFunc("/training", trainingHandler.CreateTrainingMaterial).Methods("POST")
	protected.HandleFunc("/training/{id}", trainingHandler.UpdateTrainingMaterial).Methods("PUT")
	protected.HandleFunc("/training/{id}", trainingHandler.DeleteTrainingMaterial).Methods("DELETE")

	protected.HandleFunc("/upload", fileHandler.UploadFile).Methods("POST")

	router.HandleFunc("/uploads/{filename}", fileHandler.ServeFile).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{cfg.ClientHost},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Cookie"},
		ExposedHeaders:   []string{"Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           86400,
	})

	var publicationCrawler *cron.PublicationCrawler
	if cfg.Cron.Enabled {
		publicationCrawler = cron.NewPublicationCrawler(
			db.DB,
			researcherRepo,
			publicationRepo,
			cfg.Cron.CrawlInterval,
			ctx,
		)

		googleScholarRepo := repository.NewGoogleScholar(researcherRepo, publicationRepo)
		log.Println("Initializing Google Scholar repository")

		googleScholarRepo.EnableCache()
		googleScholarRepo.SetCacheDuration(24 * time.Hour)
		googleScholarRepo.SetCacheDir("./cache/google_scholar")

		publicationCrawler.AddSource(cron.NewGoogleScholarSourceWithRepo(googleScholarRepo))
		log.Println("Added Google Scholar source with repository to the crawler")
	}

	app := &application{
		server: &http.Server{
			Addr:         ":" + cfg.Server.Port,
			Handler:      c.Handler(router),
			IdleTimeout:  time.Minute,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 30 * time.Second,
		},
		db:                 db.DB,
		config:             cfg,
		publicationCrawler: publicationCrawler,
	}

	if cfg.Cron.Enabled && publicationCrawler != nil {
		go publicationCrawler.Start()
		log.Printf("Publication crawler started with interval: %v", cfg.Cron.CrawlInterval)
	}

	go func() {
		log.Printf("Server starting on %s:%s...", cfg.Server.Host, cfg.Server.Port)
		log.Printf("Swagger documentation available at http://%s:%s/swagger/index.html", cfg.Server.Host, cfg.Server.Port)
		if err := app.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
			cancel()
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-quit:
		log.Println("Shutting down server...")
		cancel()
	case <-ctx.Done():
		log.Printf("Shutting down server due to context cancellation... %v", ctx.Err())
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	if err := app.server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	if err := app.db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server exited properly")
}
