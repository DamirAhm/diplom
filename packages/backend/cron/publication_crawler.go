package cron

import (
	"context"
	"database/sql"
	"fmt"
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
	FetchPublications(researcher models.Researcher, withCitations bool) ([]models.Publication, []models.Publication, *models.Researcher, error)
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
	go pc.crawlAllResearchers()

	ticker := time.NewTicker(pc.crawlInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go pc.crawlAllResearchers()
		case <-pc.ctx.Done():
			return
		}
	}
}

func (pc *PublicationCrawler) crawlAllResearchers() {
	researchers, err := pc.researcherRepo.GetAll()
	if err != nil {
		return
	}

	successCount := 0
	errorCount := 0
	for _, researcherWithCount := range researchers {
		if err := pc.CrawlResearcher(researcherWithCount.Researcher, false); err != nil {
			errorCount++
		} else {
			successCount++
		}
	}

	pc.lastCrawlTime = time.Now()
}

func (pc *PublicationCrawler) CrawlResearcher(researcher models.Researcher, withCitations bool) error {
	if researcher.Profiles.GoogleScholar == nil || *researcher.Profiles.GoogleScholar == "" {
		return nil
	}

	existingPubs, err := pc.researcherRepo.GetResearcherPublications(researcher.ID)
	if err != nil {
		return fmt.Errorf("failed to get existing publications: %w", err)
	}

	existingPubMap := make(map[string]bool)
	for _, pub := range existingPubs {
		key := fmt.Sprintf("%s-%s", pub.Title.En, pub.PublishedAt)
		existingPubMap[key] = true
	}

	totalNewPubs := 0

	for _, source := range pc.sources {
		publications, publicationsToUpdate, updatedResearcher, err := source.FetchPublications(researcher, withCitations)
		if err != nil {
			continue
		}

		newPubCount := 0
		for _, pub := range publications {
			key := fmt.Sprintf("%s-%s", pub.Title.En, pub.PublishedAt)
			if !existingPubMap[key] {
				_, err := pc.publicationRepo.Create(pub)
				if err != nil {
					continue
				}
				newPubCount++
			}
		}

		for _, pub := range publicationsToUpdate {
			pc.publicationRepo.Update(pub)
		}

		totalNewPubs += newPubCount

		if err := pc.researcherRepo.Update(*updatedResearcher); err != nil {
			return fmt.Errorf("failed to update researcher citation stats: %w", err)
		}
	}

	return nil
}
