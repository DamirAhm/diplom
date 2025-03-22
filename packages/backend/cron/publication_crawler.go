package cron

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
)

type PublicationCrawler struct {
	db              *sql.DB
	researcherRepo  *repository.SQLiteResearcherRepo
	publicationRepo *repository.SQLitePublicationRepo
	crawlInterval   time.Duration
	lastCrawlTime   time.Time
	sources         []PublicationSource
	ctx             context.Context
}

type PublicationSource interface {
	Name() string
	FetchPublications(researcher models.Researcher) ([]models.Publication, error)
}

func NewPublicationCrawler(
	db *sql.DB,
	researcherRepo *repository.SQLiteResearcherRepo,
	publicationRepo *repository.SQLitePublicationRepo,
	crawlInterval time.Duration,
	ctx context.Context,
) *PublicationCrawler {
	return &PublicationCrawler{
		db:              db,
		researcherRepo:  researcherRepo,
		publicationRepo: publicationRepo,
		crawlInterval:   crawlInterval,
		ctx:             ctx,
		sources:         []PublicationSource{},
	}
}

func (pc *PublicationCrawler) AddSource(source PublicationSource) {
	pc.sources = append(pc.sources, source)
}

func (pc *PublicationCrawler) Start() {
	log.Println("Starting publication crawler...")

	go pc.crawlAllResearchers()

	ticker := time.NewTicker(pc.crawlInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go pc.crawlAllResearchers()
		case <-pc.ctx.Done():
			log.Println("Stopping publication crawler...")
			return
		}
	}
}

func (pc *PublicationCrawler) crawlAllResearchers() {
	log.Println("Crawling for new publications...")

	researchers, err := pc.researcherRepo.GetAll()
	if err != nil {
		log.Printf("Error fetching researchers: %v", err)
		return
	}

	for _, researcher := range researchers {
		pc.crawlResearcher(researcher)
	}

	pc.lastCrawlTime = time.Now()
	log.Println("Crawling completed")
}

func (pc *PublicationCrawler) crawlResearcher(researcher models.Researcher) {
	log.Printf("Checking for new publications for researcher: %s", researcher.Name)

	existingPubs := make(map[string]bool)
	for _, pub := range researcher.Publications {
		key := fmt.Sprintf("%s-%s-%s", pub.Title.En, pub.Authors, pub.PublishedAt)
		existingPubs[key] = true
	}

	for _, source := range pc.sources {
		publications, err := source.FetchPublications(researcher)
		if err != nil {
			log.Printf("Error fetching publications from %s for %s: %v",
				source.Name(), researcher.Name, err)
			continue
		}

		for _, pub := range publications {
			key := fmt.Sprintf("%s-%s-%s", pub.Title.En, pub.Authors, pub.PublishedAt)
			if !existingPubs[key] {
				log.Printf("Found new publication: %s", pub.Title.En)

				pubID, err := pc.publicationRepo.Create(pub)
				if err != nil {
					log.Printf("Error saving publication: %v", err)
					continue
				}

				if pubID > 0 {
					err = pc.researcherRepo.AddPublication(researcher.ID, int(pubID))
					if err != nil {
						log.Printf("Error associating publication with researcher: %v", err)
					}
				}
			}
		}
	}
}
