package cron

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
)

type GoogleScholarSource struct {
	client        *http.Client
	googleScholar *repository.GoogleScholar
}

func NewGoogleScholarSource() *GoogleScholarSource {
	return &GoogleScholarSource{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func NewGoogleScholarSourceWithRepo(googleScholar *repository.GoogleScholar) *GoogleScholarSource {
	return &GoogleScholarSource{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		googleScholar: googleScholar,
	}
}

func (gs *GoogleScholarSource) Name() string {
	return "Google Scholar"
}

func (gs *GoogleScholarSource) FetchPublications(researcher models.Researcher) ([]models.Publication, []models.Publication, error) {
	if researcher.Profiles.GoogleScholar == nil || *researcher.Profiles.GoogleScholar == "" {
		return nil, nil, nil
	}

	scholarID := extractScholarID(*researcher.Profiles.GoogleScholar)
	if scholarID == "" {
		return nil, nil, fmt.Errorf("invalid Google Scholar URL")
	}

	url := constructURL(scholarID, "pubdate")

	publications, publicationsToUpdateByDate, err := gs.googleScholar.Scrape(url, []string{})
	if err != nil {
		log.Printf("error scraping Google Scholar: %w", err)
	}

	url = constructURL(scholarID, "citations")

	fetchedPublicationTitles := make([]string, 0, len(publications))

	for _, publication := range publications {
		fetchedPublicationTitles = append(fetchedPublicationTitles, publication.Title.En)
	}

	publications, publicationsToUpdateByCitations, err := gs.googleScholar.Scrape(url, fetchedPublicationTitles)
	if err != nil {
		log.Printf("error scraping Google Scholar: %w", err)
	}

	return publications, append(publicationsToUpdateByCitations, publicationsToUpdateByDate...), nil
}

func extractScholarID(url string) string {
	re := regexp.MustCompile(`user=([^&]+)`)
	match := re.FindStringSubmatch(url)
	if len(match) < 2 {
		return ""
	}

	scholarID := match[1]
	return scholarID
}

func constructURL(scholarID string, sortBy string) string {
	url := fmt.Sprintf("https://scholar.google.com/citations?user=%s&hl=en&view_op=list_works&sortby=%s", scholarID, sortBy)
	return url
}
