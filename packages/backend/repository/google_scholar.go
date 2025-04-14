package repository

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/PuerkitoBio/goquery"
	"github.com/damirahm/diplom/backend/models"
)

type GoogleScholar struct {
	researcherRepo  ResearcherRepo
	publicationRepo PublicationRepo
	cacheEnabled    bool
	cacheDuration   time.Duration
	cacheDir        string
	requestLimit    int
}

type CachedResponse struct {
	URL        string      `json:"url"`
	Content    string      `json:"content"`
	StatusCode int         `json:"status_code"`
	Headers    http.Header `json:"headers"`
	CachedAt   time.Time   `json:"cached_at"`
}

func NewGoogleScholar(researcherRepo ResearcherRepo, publicationRepo PublicationRepo) *GoogleScholar {
	requestLimit := 10
	if limitStr := os.Getenv("GOOGLE_SCHOLAR_REQUEST_LIMIT"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			requestLimit = limit
		}
	}

	return &GoogleScholar{
		researcherRepo:  researcherRepo,
		publicationRepo: publicationRepo,
		cacheEnabled:    true,
		cacheDuration:   24 * time.Hour,
		cacheDir:        "./cache/google_scholar",
		requestLimit:    requestLimit,
	}
}

func (g *GoogleScholar) DisableCache() {
	g.cacheEnabled = false
}

func (g *GoogleScholar) EnableCache() {
	g.cacheEnabled = true
}

func (g *GoogleScholar) SetCacheDuration(duration time.Duration) {
	g.cacheDuration = duration
}

func (g *GoogleScholar) SetCacheDir(dir string) {
	g.cacheDir = dir
}

func (g *GoogleScholar) SetRequestLimit(limit int) {
	if limit > 0 {
		g.requestLimit = limit
	}
}

func (g *GoogleScholar) getCacheFilePath(url string) string {
	h := sha256.New()
	h.Write([]byte(url))
	hash := hex.EncodeToString(h.Sum(nil))

	subDir := hash[:2]
	cacheDir := filepath.Join(g.cacheDir, subDir)

	if err := os.MkdirAll(cacheDir, 0755); err != nil {
	}

	cacheFile := filepath.Join(cacheDir, hash+".json")
	return cacheFile
}

func (g *GoogleScholar) saveToCache(urlStr string, resp *http.Response, content string) error {
	if !g.cacheEnabled {
		return nil
	}

	if err := os.MkdirAll(g.cacheDir, 0755); err != nil {
		return fmt.Errorf("не удалось создать каталог кеша: %w", err)
	}

	cachedResp := &CachedResponse{
		URL:        urlStr,
		Content:    content,
		StatusCode: resp.StatusCode,
		Headers:    resp.Header,
		CachedAt:   time.Now(),
	}

	data, err := json.Marshal(cachedResp)
	if err != nil {
		return fmt.Errorf("не удалось сериализовать кеш: %w", err)
	}

	cacheFile := g.getCacheFilePath(urlStr)
	if err := os.WriteFile(cacheFile, data, 0644); err != nil {
		return fmt.Errorf("не удалось записать кеш в файл: %w", err)
	}

	return nil
}

func (g *GoogleScholar) getFromCache(urlStr string) (*CachedResponse, error) {
	if !g.cacheEnabled {
		return nil, nil
	}

	cacheFile := g.getCacheFilePath(urlStr)

	data, err := os.ReadFile(cacheFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("не удалось прочитать файл кеша: %w", err)
	}

	var cachedResp CachedResponse
	if err := json.Unmarshal(data, &cachedResp); err != nil {
		return nil, fmt.Errorf("не удалось десериализовать кеш: %w", err)
	}

	if time.Since(cachedResp.CachedAt) > g.cacheDuration {
		return nil, nil
	}

	return &cachedResp, nil
}

func (g *GoogleScholar) Scrape(url string, fetchedPublicationTitles []string) (newPublications []models.Publication, publicationsToUpdate []models.Publication, err error) {
	if !isValidScholarURL(url) {
		return nil, nil, errors.New("invalid Google Scholar URL format")
	}

	log.Printf("Scraping Google Scholar with request limit: %d", g.requestLimit)

	var content string
	var resp *http.Response

	cachedResp, err := g.getFromCache(url)
	if err != nil {
		log.Println(err)
	}

	if cachedResp != nil {
		content = cachedResp.Content
	} else {
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, nil, fmt.Errorf("error creating request: %w", err)
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/536.21 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
		req.Header.Set("Accept-Language", "en-US,en;q=0.5")

		resp, err = client.Do(req)
		if err != nil {
			return nil, nil, fmt.Errorf("error sending request: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, nil, fmt.Errorf("received non-200 response: %d", resp.StatusCode)
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, nil, fmt.Errorf("error reading response body: %w", err)
		}
		content = string(bodyBytes)

		if err := g.saveToCache(url, resp, content); err != nil {
		}
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(content))
	if err != nil {
		return nil, nil, fmt.Errorf("error parsing HTML: %w", err)
	}

	var processingErrors []error
	requestCount := 0

	doc.Find("#gsc_a_b .gsc_a_tr").Each(func(i int, s *goquery.Selection) {
		titleElement := s.Find(".gsc_a_t a")
		title := titleElement.Text()
		pubURL, _ := titleElement.Attr("href")
		citationCount, err := strconv.Atoi(s.Find(".gsc_a_c").Text())
		if err != nil {
			citationCount = 0
		}

		if title == "" || pubURL == "" {
			return
		}

		if slices.Contains(fetchedPublicationTitles, title) {
			return
		}

		pub, err := g.publicationRepo.GetByTitle(title)
		if err != nil {
			processingErrors = append(processingErrors, fmt.Errorf("error checking publication '%s': %w", title, err))
			return
		}

		if pub != nil {
			publicationsToUpdate = append(publicationsToUpdate, *pub)

			return
		}

		detailURL := constructFullURL(pubURL)

		if requestCount >= g.requestLimit {
			return
		}

		detailedPub, err := g.fetchPublicationDetails(detailURL, title)
		if err != nil {
			processingErrors = append(processingErrors, fmt.Errorf("error fetching details for '%s': %w", title, err))
			return
		}

		if detailedPub.CitationsCount == 0 {
			detailedPub.CitationsCount = citationCount
		}

		newPublications = append(newPublications, *detailedPub)
		requestCount++
	})

	if len(newPublications) > 0 {
		log.Printf("Fetched %d publications from Google Scholar (made %d requests)", len(newPublications), requestCount)
		return newPublications, nil, nil
	}

	if len(processingErrors) > 0 {
		return nil, nil, fmt.Errorf("failed to fetch any publications: %w", processingErrors[0])
	}

	return []models.Publication{}, []models.Publication{}, nil
}

func (g *GoogleScholar) fetchPublicationDetails(url, title string) (*models.Publication, error) {
	var content string
	var resp *http.Response

	cachedResp, err := g.getFromCache(url)
	if err != nil {
	}

	if cachedResp != nil {
		content = cachedResp.Content
	} else {
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("error creating request: %w", err)
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
		req.Header.Set("Accept-Language", "en-US,en;q=0.5")

		resp, err = client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("error sending request: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("received non-200 response: %d", resp.StatusCode)
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("error reading response body: %w", err)
		}
		content = string(bodyBytes)

		if err := g.saveToCache(url, resp, content); err != nil {
		}
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(strings.TrimFunc(content, unicode.IsControl)))
	if err != nil {
		return nil, fmt.Errorf("error parsing HTML: %w", err)
	}

	if title == "" {
		title = doc.Find("#gsc_oci_title a").Text()
	}

	var authorText string
	var publishedAt string
	var journal string
	var volume string
	var issue string
	var pages string
	var publisher string
	var citationCount int

	doc.Find("#gsc_oci_table .gs_scl").Each(func(i int, s *goquery.Selection) {
		fieldName := s.Find(".gsc_oci_field").Text()
		fieldValue := s.Find(".gsc_oci_value").Text()

		switch fieldName {
		case "Авторы", "Authors":
			authorText = fieldValue
		case "Дата публикации", "Publication date":
			publishedAt = fieldValue
		case "Журнал", "Journal":
			journal = fieldValue
		case "Том", "Volume":
			volume = fieldValue
		case "Номер", "Issue":
			issue = fieldValue
		case "Страницы", "Pages":
			pages = fieldValue
		case "Издатель", "Publisher":
			publisher = fieldValue
		case "Total citations":
			realValue, err := s.Find(".gsc_oci_value a").Html()
			if err == nil {
				fmt.Sscanf(realValue, "Cited by %d", &citationCount)
			}
		case "Всего ссылок":
			realValue, err := s.Find(".gsc_oci_value a").Html()
			if err == nil {
				fmt.Sscanf(realValue, "Цитируется: %d", &citationCount)
			}
		}
	})

	authors := g.parseAuthors(authorText)

	fullJournal := journal
	if volume != "" {
		fullJournal += ", Vol. " + volume
	}
	if issue != "" {
		fullJournal += ", No. " + issue
	}
	if pages != "" {
		fullJournal += ", pp. " + pages
	}
	if publisher != "" {
		fullJournal += ", " + publisher
	}

	formattedDate, err := parseDate(publishedAt)
	if err != nil {
		return nil, fmt.Errorf("error parsing date: %w", err)
	}

	publication := &models.Publication{
		Title: models.LocalizedString{
			En: title,
			Ru: title,
		},
		Authors:        authors,
		Journal:        fullJournal,
		PublishedAt:    formattedDate,
		CitationsCount: citationCount,
		Link:           url,
	}

	return publication, nil
}

func parseDate(dateText string) (string, error) {
	dateText = strings.ReplaceAll(dateText, "\u202C", "")

	datePattern1 := regexp.MustCompile(`(\d{4})/(\d{1,2})/(\d{1,2})`)
	if match := datePattern1.FindStringSubmatch(dateText); len(match) == 4 {
		year := match[1]
		month := match[2]
		day := match[3]
		if len(month) == 1 {
			month = "0" + month
		}
		if len(day) == 1 {
			day = "0" + day
		}
		return fmt.Sprintf("%s-%s-%s", year, month, day), nil
	}

	datePattern2 := regexp.MustCompile(`(\d{4})/(\d{1,2})$`)
	if match := datePattern2.FindStringSubmatch(dateText); len(match) == 3 {
		year := match[1]
		month := match[2]
		if len(month) == 1 {
			month = "0" + month
		}
		return fmt.Sprintf("%s-%s-01", year, month), nil
	}

	datePattern3 := regexp.MustCompile(`^(\d{4})$`)
	if match := datePattern3.FindStringSubmatch(dateText); len(match) == 2 {
		return fmt.Sprintf("%s-01-01", match[1]), nil
	}

	return "", errors.New("failed to parse date")
}

func (g *GoogleScholar) parseAuthors(authorText string) []models.Author {
	authors := strings.Split(authorText, ",")

	var cleanedAuthors []string
	for _, author := range authors {
		cleaned := strings.TrimSpace(author)
		if cleaned != "" {
			cleanedAuthors = append(cleanedAuthors, cleaned)
		}
	}

	authorObjects := make([]models.Author, 0, len(cleanedAuthors))
	for _, authorName := range cleanedAuthors {
		researcher, err := g.researcherRepo.FindByFullName(authorName)
		if err == nil && researcher != nil {
			id := researcher.ID
			authorObjects = append(authorObjects, models.Author{
				Name: models.LocalizedString{
					En: authorName,
					Ru: authorName,
				},
				ID: &id,
			})
			continue
		}

		nameParts := strings.Fields(authorName)
		if len(nameParts) == 3 {
			nameWithoutMiddle := nameParts[0] + " " + nameParts[2]
			researcher, err = g.researcherRepo.FindByFullName(nameWithoutMiddle)
			if err == nil && researcher != nil {
				id := researcher.ID
				authorObjects = append(authorObjects, models.Author{
					Name: models.LocalizedString{
						En: authorName,
						Ru: authorName,
					},
					ID: &id,
				})
				continue
			}
		}

		authorObjects = append(authorObjects, models.Author{
			Name: models.LocalizedString{
				En: authorName,
				Ru: authorName,
			},
		})
	}

	return authorObjects
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

func constructFullURL(relativeURL string) string {
	if relativeURL == "" {
		return ""
	}
	fullURL := "https://scholar.google.com" + relativeURL
	return fullURL
}

func (g *GoogleScholar) EnableCaching(cacheDir string, cacheDuration time.Duration) {
	if cacheDir == "" {
		cacheDir = filepath.Join(os.TempDir(), "google_scholar_cache")
	}

	g.cacheDir = cacheDir
	g.cacheDuration = cacheDuration
	g.cacheEnabled = true

	if err := os.MkdirAll(cacheDir, 0755); err != nil {
	}
}
