# Publication Crawler

This module implements a cron job that periodically checks various academic sources (Google Scholar, Scopus, ORCID, etc.) for new publications by researchers in the system. When new publications are found, they are automatically added to the database and associated with the corresponding researcher.

## Configuration

The cron job can be configured using the following environment variables:

- `CRON_ENABLED`: Set to `true` to enable the cron job, `false` to disable it (default: `true`)
- `CRON_INTERVAL_HOURS`: The interval in hours between crawls (default: `24`)
- `SCOPUS_API_KEY`: API key for the Scopus API (optional)

## Supported Sources

The crawler currently supports the following sources:

1. **Google Scholar**: Extracts publications from a researcher's Google Scholar profile
2. **Scopus**: Extracts publications from a researcher's Scopus profile (requires API key)
3. **ORCID**: Extracts publications from a researcher's ORCID profile

## Adding New Sources

To add a new publication source, implement the `PublicationSource` interface:

```go
type PublicationSource interface {
	Name() string
	FetchPublications(researcher models.Researcher) ([]models.Publication, error)
}
```

Then add the new source to the crawler in `main.go`:

```go
publicationCrawler.AddSource(NewCustomSource())
```