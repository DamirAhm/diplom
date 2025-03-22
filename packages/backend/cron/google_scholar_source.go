package cron

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/damirahm/diplom/backend/models"
)

type GoogleScholarSource struct {
	client *http.Client
}

func NewGoogleScholarSource() *GoogleScholarSource {
	return &GoogleScholarSource{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
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

	// This is a simplified example. In a real implementation, you would need to:
	// 1. Make an HTTP request to Google Scholar
	// 2. Parse the HTML response (likely using a library like goquery)
	// 3. Extract publication information

	// For demonstration purposes, we'll use a mock implementation
	return gs.mockFetchPublications(scholarID, researcher.Name.En)
}

func extractScholarID(scholarURL string) string {
	parsedURL, err := url.Parse(scholarURL)
	if err != nil {
		return ""
	}

	values, err := url.ParseQuery(parsedURL.RawQuery)
	if err != nil {
		return ""
	}

	return values.Get("user")
}

func (gs *GoogleScholarSource) mockFetchPublications(scholarID, researcherName string) ([]models.Publication, error) {
	// In a real implementation, this would make an actual API call
	// For now, we'll return a mock publication

	// Only return a new publication occasionally to simulate finding new publications
	if time.Now().Unix()%10 == 0 {
		return []models.Publication{
			{
				Title: models.LocalizedString{
					En: fmt.Sprintf("New Research Paper by %s", researcherName),
					Ru: fmt.Sprintf("Новая научная статья от %s", researcherName),
				},
				Authors:     []int{1},
				Journal:     "Journal of Advanced Research",
				PublishedAt: time.Now().Format("2006-01-02"),
				Link:        fmt.Sprintf("https://scholar.google.com/citations?user=%s", scholarID),
			},
		}, nil
	}

	return []models.Publication{}, nil
}
