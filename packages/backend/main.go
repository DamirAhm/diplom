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

	// Создаем директорию для загруженных файлов, если она не существует
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory:", err)
	}

	// Создаем директорию для статических файлов, если она не существует
	if err := os.MkdirAll("./static", 0755); err != nil {
		log.Fatal("Failed to create static directory:", err)
	}

	localizedStringRepo := repository.NewSQLiteLocalizedStringRepo(db.DB)
	partnerRepo := repository.NewSQLitePartnerRepo(db.DB)
	researcherRepo := repository.NewSQLiteResearcherRepo(db.DB, localizedStringRepo)
	publicationRepo := repository.NewSQLitePublicationRepo(db.DB, localizedStringRepo, researcherRepo)
	projectRepo := repository.NewSQLiteProjectRepo(db.DB, localizedStringRepo)
	trainingMaterialRepo := repository.NewSQLiteTrainingMaterialRepo(db.DB, localizedStringRepo)
	disciplineRepo := repository.NewSQLiteDisciplineRepo(db.DB, localizedStringRepo, researcherRepo)

	publicationCrawler := cron.NewPublicationCrawler(
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

	partnersHandler := handlers.NewPartnerHandler(partnerRepo)
	projectsHandler := handlers.NewProjectHandler(projectRepo)
	researchersHandler := handlers.NewResearcherHandler(researcherRepo, publicationCrawler) // Now publicationCrawler is defined
	publicationsHandler := handlers.NewPublicationHandler(publicationRepo)
	trainingHandler := handlers.NewTrainingHandler(trainingMaterialRepo)
	disciplineHandler := handlers.NewDisciplineHandler(disciplineRepo)
	authHandler := handlers.NewAuthHandler(cfg)
	fileHandler := handlers.NewFileHandler()

	// Создание обработчика для алгоритма разбиения изображения
	imageProcessingHandler := handlers.NewImageProcessingHandler("./uploads")

	// Создание обработчика для симуляции нейрона с туннельным диодом
	neuronHandler := handlers.NewNeuronSimulationHandler()

	router := mux.NewRouter()

	router.Use(middleware.Logger)

	docs.SwaggerInfo.BasePath = "/api"
	docs.SwaggerInfo.Host = cfg.Server.Host + ":" + cfg.Server.Port
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	// Обработка статических файлов
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	// Демонстрация алгоритма
	router.HandleFunc("/demo/superpixels", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/superpixel.html")
	})

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

	api.HandleFunc("/disciplines", disciplineHandler.GetDisciplines).Methods("GET")
	api.HandleFunc("/disciplines/{id}", disciplineHandler.GetDiscipline).Methods("GET")
	protected.HandleFunc("/disciplines", disciplineHandler.CreateDiscipline).Methods("POST")
	protected.HandleFunc("/disciplines/{id}", disciplineHandler.UpdateDiscipline).Methods("PUT")
	protected.HandleFunc("/disciplines/{id}", disciplineHandler.DeleteDiscipline).Methods("DELETE")

	protected.HandleFunc("/upload", fileHandler.UploadFile).Methods("POST")

	// Новый маршрут для обработки изображений с модифицированным алгоритмом SLIC
	api.HandleFunc("/image/superpixels", imageProcessingHandler.ProcessSuperpixels).Methods("POST")

	// Маршруты для симуляции нейрона с туннельным диодом
	api.HandleFunc("/neuron/simulate", neuronHandler.TimeSeriesSimulation).Methods("POST")
	api.HandleFunc("/neuron/excitability", neuronHandler.ExcitabilityTest).Methods("POST")
	api.HandleFunc("/neuron/parameter-map", neuronHandler.ParameterMap).Methods("POST")
	api.HandleFunc("/neuron/custom-signal", neuronHandler.CustomSignalUpload).Methods("POST")

	router.HandleFunc("/uploads/{filename}", fileHandler.ServeFile).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{cfg.ClientHost},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Cookie"},
		ExposedHeaders:   []string{"Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           86400,
	})

	app := &application{
		server: &http.Server{
			Addr:         ":" + cfg.Server.Port,
			Handler:      c.Handler(router),
			IdleTimeout:  time.Minute * 2,
			ReadTimeout:  time.Minute * 2,
			WriteTimeout: time.Minute * 2,
		},
		db:                 db.DB,
		config:             cfg,
		publicationCrawler: publicationCrawler,
	}

	if cfg.Cron.Enabled && publicationCrawler != nil {
		go publicationCrawler.Start()
		log.Printf("Publication crawler started with interval: %v", cfg.Cron.CrawlInterval)
	} else if cfg.Cron.Enabled && publicationCrawler == nil {
		log.Println("Cron is enabled but publication crawler failed to initialize.")
	}

	go func() {
		log.Printf("Server starting on %s:%s...", cfg.Server.Host, cfg.Server.Port)
		log.Printf("Swagger documentation available at http://%s:%s/swagger/index.html", cfg.Server.Host, cfg.Server.Port)
		log.Printf("Superpixel demo available at http://%s:%s/demo/superpixels", cfg.Server.Host, cfg.Server.Port)
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
