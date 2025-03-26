package cron

import (
	"fmt"
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

// Обновленная версия с использованием репозитория GoogleScholar
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

func (gs *GoogleScholarSource) FetchPublications(researcher models.Researcher) ([]models.Publication, error) {
	if researcher.Profiles.GoogleScholar == nil || *researcher.Profiles.GoogleScholar == "" {
		return nil, nil
	}

	scholarID := extractScholarID(*researcher.Profiles.GoogleScholar)
	if scholarID == "" {
		return nil, fmt.Errorf("invalid Google Scholar URL")
	}

	// Используем старую реализацию, если репозиторий не был инициализирован
	if gs.googleScholar == nil {
		// Здесь будет старая реализация
		return nil, fmt.Errorf("legacy implementation removed, please initialize with repository")
	}

	url := constructURL(scholarID)

	publications, err := gs.googleScholar.Scrape(url)
	if err != nil {
		return nil, fmt.Errorf("error scraping Google Scholar: %w", err)
	}

	return publications, nil
}

func extractScholarID(url string) string {
	// Extract the user ID from the URL using a regular expression
	re := regexp.MustCompile(`user=([^&]+)`)
	match := re.FindStringSubmatch(url)
	if len(match) < 2 {
		return ""
	}

	scholarID := match[1]
	return scholarID
}

func constructURL(scholarID string) string {
	url := fmt.Sprintf("https://scholar.google.com/citations?user=%s&hl=en&view_op=list_works&sortby=pubdate", scholarID)
	return url
}
