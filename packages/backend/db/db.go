package db

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	return createTables()
}

func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS localized_strings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			en TEXT NOT NULL,
			ru TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS partners (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			logo TEXT NOT NULL,
			url TEXT NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('university', 'enterprise'))
		)`,
		`CREATE TABLE IF NOT EXISTS projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			description_id INTEGER,
			github_link TEXT,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id),
			FOREIGN KEY (description_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS project_publications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			link TEXT NOT NULL,
			project_id INTEGER,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id),
			FOREIGN KEY (project_id) REFERENCES projects(id)
		)`,
		`CREATE TABLE IF NOT EXISTS project_videos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			embed_url TEXT NOT NULL,
			project_id INTEGER,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id),
			FOREIGN KEY (project_id) REFERENCES projects(id)
		)`,
		`CREATE TABLE IF NOT EXISTS publications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			authors TEXT NOT NULL,
			journal TEXT NOT NULL,
			year INTEGER NOT NULL,
			link TEXT NOT NULL,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS researchers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			title_id INTEGER NOT NULL,
			photo TEXT NOT NULL,
			bio_id INTEGER,
			research_gate TEXT,
			google_scholar TEXT,
			scopus TEXT,
			publons TEXT,
			orcid TEXT,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id),
			FOREIGN KEY (bio_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS researcher_publications (
			researcher_id INTEGER NOT NULL,
			publication_id INTEGER NOT NULL,
			PRIMARY KEY (researcher_id, publication_id),
			FOREIGN KEY (researcher_id) REFERENCES researchers(id),
			FOREIGN KEY (publication_id) REFERENCES publications(id)
		)`,
		`CREATE TABLE IF NOT EXISTS training_materials (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			description_id INTEGER NOT NULL,
			url TEXT NOT NULL,
			image TEXT NOT NULL,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id),
			FOREIGN KEY (description_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS joint_projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			year INTEGER NOT NULL,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS joint_project_partners (
			project_id INTEGER NOT NULL,
			partner_name TEXT NOT NULL,
			PRIMARY KEY (project_id, partner_name),
			FOREIGN KEY (project_id) REFERENCES joint_projects(id)
		)`,
		`CREATE TABLE IF NOT EXISTS joint_publications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title_id INTEGER NOT NULL,
			authors TEXT NOT NULL,
			journal TEXT NOT NULL,
			year INTEGER NOT NULL,
			link TEXT NOT NULL
		)`,
	}

	for _, table := range tables {
		_, err := DB.Exec(table)

		if err != nil {
			return err
		}
	}

	return nil
}
