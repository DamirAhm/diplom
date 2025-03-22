package cron

import (
	"fmt"
	"net/http"
	"path"
	"time"

	"github.com/damirahm/diplom/backend/models"
)

type OrcidSource struct {
	client *http.Client
}

func NewOrcidSource() *OrcidSource {
	return &OrcidSource{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (os *OrcidSource) Name() string {
	return "ORCID"
}

func (os *OrcidSource) FetchPublications(researcher models.Researcher) ([]models.Publication, error) {
	if researcher.Profiles.Orcid == nil || *researcher.Profiles.Orcid == "" {
		return nil, nil
	}

	orcidID := extractOrcidID(*researcher.Profiles.Orcid)
	if orcidID == "" {
		return nil, fmt.Errorf("invalid ORCID URL")
	}

	// In a real implementation, you would:
	// 1. Make an HTTP request to the ORCID API
	// 2. Parse the JSON response
	// 3. Extract publication information

	// For demonstration purposes, we'll use a mock implementation
	return os.mockFetchPublications(orcidID, researcher.Name.En)
}

// extractOrcidID extracts the ORCID ID from an ORCID URL
func extractOrcidID(orcidURL string) string {
	// Example URL: https://orcid.org/0000-0000-0000-0000
	// Extract the last path component
	return path.Base(orcidURL)
}

// mockFetchPublications is a mock implementation for demonstration
func (os *OrcidSource) mockFetchPublications(orcidID, researcherName string) ([]models.Publication, error) {
	// In a real implementation, this would make an actual API call
	// For now, we'll return a mock publication

	// Only return a new publication occasionally to simulate finding new publications
	if time.Now().Unix()%12 == 0 {
		return []models.Publication{
			{
				Title: models.LocalizedString{
					En: fmt.Sprintf("ORCID Research Paper by %s", researcherName),
					Ru: fmt.Sprintf("Научная статья ORCID от %s", researcherName),
				},
				Authors:     []int{1},
				Journal:     "Science and Technology Journal",
				PublishedAt: time.Now().Format("2006-01-02"),
				Link:        fmt.Sprintf("https://orcid.org/%s", orcidID),
			},
		}, nil
	}

	return []models.Publication{}, nil
}
