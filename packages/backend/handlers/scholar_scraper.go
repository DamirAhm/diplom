package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// Publication represents a single academic publication
type Publication struct {
	Title         string   `json:"title"`
	Authors       []string `json:"authors"`
	Journal       string   `json:"journal,omitempty"`
	PublishedYear int      `json:"year,omitempty"`
	CitationCount int      `json:"citations,omitempty"`
	URL           string   `json:"url,omitempty"`
	Abstract      string   `json:"abstract,omitempty"`
	Publisher     string   `json:"publisher,omitempty"`
	Volume        string   `json:"volume,omitempty"`
	Issue         string   `json:"issue,omitempty"`
	Pages         string   `json:"pages,omitempty"`
}

// ScholarScraperRequest defines the request structure for the scholar scraper
type ScholarScraperRequest struct {
	URL    string `json:"url"`
	SortBy string `json:"sort_by,omitempty"` // Optional: "pubdate", "citations", "title" or empty for default
}

// ScholarScraperResponse defines the response structure for the scholar scraper
type ScholarScraperResponse struct {
	Publications []Publication `json:"publications"`
	TotalCount   int           `json:"total_count"`
	SortBy       string        `json:"sort_by,omitempty"`
}

// ScholarScraperHandler handles the Google Scholar scraping functionality
type ScholarScraperHandler struct{}

// NewScholarScraperHandler creates a new scholar scraper handler
func NewScholarScraperHandler() *ScholarScraperHandler {
	return &ScholarScraperHandler{}
}

// ScrapePublications handles the request to scrape publications from Google Scholar
// @Summary Scrape publications from Google Scholar
// @Description Fetches all publications from a Google Scholar researcher profile URL
// @Tags scholar
// @Accept json
// @Produce json
// @Param request body ScholarScraperRequest true "Google Scholar URL with optional sort_by parameter ('pubdate', 'citations', or empty for default)"
// @Success 200 {object} ScholarScraperResponse
// @Failure 400 {string} string "Bad request"
// @Failure 500 {string} string "Internal server error"
// @Router /scholar/scrape [post]
func (h *ScholarScraperHandler) ScrapePublications(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var request ScholarScraperRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Validate URL
	if request.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	// Use Google Scholar's native sorting
	sortBy := request.SortBy
	scholarURL := request.URL

	// Add or modify 'sortby' parameter if needed
	if sortBy != "" {
		scholarURL = addSortParameter(scholarURL, sortBy)
	}

	// Scrape publications
	publications, err := scrapePublications(scholarURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error scraping publications: %v", err), http.StatusInternalServerError)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ScholarScraperResponse{
		Publications: publications,
		TotalCount:   len(publications),
		SortBy:       sortBy,
	})
}

// addSortParameter adds or replaces the sortby parameter in the Google Scholar URL
func addSortParameter(scholarURL, sortBy string) string {
	// Parse the URL
	parsedURL, err := url.Parse(scholarURL)
	if err != nil {
		// If there's an error parsing, just return the original URL
		return scholarURL
	}

	// Get the query parameters
	values := parsedURL.Query()

	// Update or add the sortby parameter
	values.Set("sortby", sortBy)
	if sortBy == "pubdate" {
		// Make sure we're viewing list_works
		values.Set("view_op", "list_works")
	}

	// Update the URL with the new query parameters
	parsedURL.RawQuery = values.Encode()

	return parsedURL.String()
}

// scrapePublications retrieves all publications for a Google Scholar profile
func scrapePublications(scholarURL string) ([]Publication, error) {
	// Validate URL
	if !isValidScholarURL(scholarURL) {
		return nil, errors.New("invalid Google Scholar URL format")
	}

	// Create HTTP client with reasonable timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Send HTTP request
	req, err := http.NewRequest("GET", scholarURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Set common headers to avoid being blocked
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 response: %d", resp.StatusCode)
	}

	// Parse HTML document
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error parsing HTML: %w", err)
	}

	// Extract publications
	var publications []Publication
	doc.Find("#gsc_a_b .gsc_a_tr").Each(func(i int, s *goquery.Selection) {
		// Extract publication data
		titleElement := s.Find(".gsc_a_t a")
		title := titleElement.Text()
		pubURL, _ := titleElement.Attr("href")

		// Extract authors and journal info
		authorPublisherInfo := s.Find(".gsc_a_t .gs_gray").First().Text()
		authors := parseAuthors(authorPublisherInfo)

		// Extract journal/conference and year
		journalInfo := s.Find(".gsc_a_t .gs_gray").Last().Text()
		journal, volume, issue, pages := parseJournalInfo(journalInfo)

		// Extract citation count
		citationText := s.Find(".gsc_a_c a").Text()
		citationCount := 0
		if citationText != "" {
			fmt.Sscanf(citationText, "%d", &citationCount)
		}

		// Extract year
		yearText := s.Find(".gsc_a_y").Text()
		year := 0
		if yearText != "" {
			fmt.Sscanf(yearText, "%d", &year)
		}

		// Create publication entry with base URL for Google Scholar
		pub := Publication{
			Title:         title,
			Authors:       authors,
			Journal:       journal,
			PublishedYear: year,
			CitationCount: citationCount,
			URL:           constructFullURL(pubURL),
			Volume:        volume,
			Issue:         issue,
			Pages:         pages,
		}

		publications = append(publications, pub)
	})

	if len(publications) == 0 {
		return nil, errors.New("no publications found")
	}

	return publications, nil
}

func isValidScholarURL(inputURL string) bool {
	parsed, err := url.Parse(inputURL)
	if err != nil {
		return false
	}

	if !strings.HasSuffix(parsed.Hostname(), "scholar.google.com") {
		return false
	}

	if !strings.Contains(parsed.Path, "citations") {
		return false
	}

	query := parsed.Query()
	if query.Get("user") == "" {
		return false
	}

	return true
}

func parseAuthors(authorText string) []string {
	authors := strings.Split(authorText, ",")
	var cleanedAuthors []string
	for _, author := range authors {
		cleaned := strings.TrimSpace(author)
		if cleaned != "" {
			cleanedAuthors = append(cleanedAuthors, cleaned)
		}
	}
	return cleanedAuthors
}

func parseJournalInfo(info string) (journal, volume, issue, pages string) {
	re := regexp.MustCompile(`,\s*\d{4}$`)
	info = re.ReplaceAllString(info, "")

	volRe := regexp.MustCompile(`(\d+)\s*\((\d+)\)`)   // For format "Volume (Issue)"
	pagesRe := regexp.MustCompile(`(\d+)\s*-\s*(\d+)`) // For page ranges

	volMatch := volRe.FindStringSubmatch(info)
	if len(volMatch) > 2 {
		volume = volMatch[1]
		issue = volMatch[2]
		info = strings.Replace(info, volMatch[0], "", 1)
	}

	pagesMatch := pagesRe.FindStringSubmatch(info)
	if len(pagesMatch) > 2 {
		pages = pagesMatch[0]
		info = strings.Replace(info, pagesMatch[0], "", 1)
	}

	journal = strings.TrimSpace(info)
	return
}

func constructFullURL(relativeURL string) string {
	if relativeURL == "" {
		return ""
	}
	return "https://scholar.google.com" + relativeURL
}
