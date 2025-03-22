package cron

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/damirahm/diplom/backend/models"
)

type ScopusSource struct {
	client *http.Client
	apiKey string
}

func NewScopusSource(apiKey string) *ScopusSource {
	return &ScopusSource{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		apiKey: apiKey,
	}
}

func (ss *ScopusSource) Name() string {
	return "Scopus"
}

func (ss *ScopusSource) FetchPublications(researcher models.Researcher) ([]models.Publication, error) {
	if researcher.Profiles.Scopus == nil || *researcher.Profiles.Scopus == "" {
		return nil, nil
	}

	scopusID := extractScopusID(*researcher.Profiles.Scopus)
	if scopusID == "" {
		return nil, fmt.Errorf("invalid Scopus URL")
	}

	// In a real implementation, you would:
	// 1. Make an HTTP request to the Scopus API using the API key
	// 2. Parse the JSON response
	// 3. Extract publication information

	// For demonstration purposes, we'll use a mock implementation
	return ss.mockFetchPublications(scopusID, researcher.Name.En)
}

func extractScopusID(scopusURL string) string {
	parsedURL, err := url.Parse(scopusURL)
	if err != nil {
		return ""
	}

	values, err := url.ParseQuery(parsedURL.RawQuery)
	if err != nil {
		return ""
	}

	return values.Get("authorId")
}

func (ss *ScopusSource) mockFetchPublications(scopusID, researcherName string) ([]models.Publication, error) {
	// In a real implementation, this would make an actual API call
	// For now, we'll return a mock publication

	// Only return a new publication occasionally to simulate finding new publications
	if time.Now().Unix()%15 == 0 {
		return []models.Publication{
			{
				Title: models.LocalizedString{
					En: fmt.Sprintf("Scopus Research Paper by %s", researcherName),
					Ru: fmt.Sprintf("Научная статья Scopus от %s", researcherName),
				},
				Authors:     []int{1},
				Journal:     "International Journal of Science",
				PublishedAt: time.Now().Format("2006-01-02"),
				Link:        fmt.Sprintf("https://www.scopus.com/authid/detail.uri?authorId=%s", scopusID),
			},
		}, nil
	}

	return []models.Publication{}, nil
}
