package db

import (
	"database/sql"
	"strconv"

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

	if err = createTables(); err != nil {
		return err
	}

	// Run migrations
	if err = migrateAddLastNameToResearchers(); err != nil {
		return err
	}

	// Run publication fields migration
	if err = migratePublicationFields(); err != nil {
		return err
	}

	// Run migration to add position_id column if missing
	if err = migrateAddPositionToResearchers(); err != nil {
		return err
	}

	// Run publication external authors migration
	if err = migratePublicationExternalAuthors(); err != nil {
		return err
	}

	// Run migration to add visible column to publications
	if err = migrateAddVisibleToPublications(); err != nil {
		return err
	}

	return nil
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
			journal TEXT NOT NULL,
			published_at TEXT NOT NULL,
			citations_count INTEGER DEFAULT 0,
			link TEXT NOT NULL,
			FOREIGN KEY (title_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS researchers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name_id INTEGER NOT NULL,
			last_name_id INTEGER NOT NULL,
			position_id INTEGER NOT NULL,
			photo TEXT NOT NULL,
			bio_id INTEGER,
			research_gate TEXT,
			google_scholar TEXT,
			scopus TEXT,
			publons TEXT,
			orcid TEXT,
			FOREIGN KEY (name_id) REFERENCES localized_strings(id),
			FOREIGN KEY (last_name_id) REFERENCES localized_strings(id),
			FOREIGN KEY (position_id) REFERENCES localized_strings(id),
			FOREIGN KEY (bio_id) REFERENCES localized_strings(id)
		)`,
		`CREATE TABLE IF NOT EXISTS researcher_publications (
			researcher_id INTEGER NOT NULL,
			publication_id INTEGER NOT NULL,
			PRIMARY KEY (researcher_id, publication_id),
			FOREIGN KEY (researcher_id) REFERENCES researchers(id),
			FOREIGN KEY (publication_id) REFERENCES publications(id)
		)`,
		`CREATE TABLE IF NOT EXISTS publication_authors (
			publication_id INTEGER NOT NULL,
			researcher_id INTEGER NOT NULL,
			PRIMARY KEY (publication_id, researcher_id),
			FOREIGN KEY (publication_id) REFERENCES publications(id),
			FOREIGN KEY (researcher_id) REFERENCES researchers(id)
		)`,
		`CREATE TABLE IF NOT EXISTS publication_external_authors (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			publication_id INTEGER NOT NULL,
			name_id INTEGER NOT NULL,
			FOREIGN KEY (publication_id) REFERENCES publications(id),
			FOREIGN KEY (name_id) REFERENCES localized_strings(id)
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
	}

	for _, table := range tables {
		_, err := DB.Exec(table)

		if err != nil {
			return err
		}
	}

	return nil
}

// migrateAddLastNameToResearchers adds the last_name column to the researchers table if it doesn't exist
func migrateAddLastNameToResearchers() error {
	// This migration is no longer needed as we're using localized_strings for last_name
	// We'll replace it with a migration to convert existing researchers to use localized strings

	// Check if the name_id column exists
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='name_id'`).Scan(&count)
	if err != nil {
		return err
	}

	// If the column doesn't exist, migrate the data
	if count == 0 {
		// Create a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Get all researchers
		rows, err := tx.Query(`SELECT id, name, last_name FROM researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer rows.Close()

		// For each researcher, create localized strings for name and last_name
		for rows.Next() {
			var id int
			var name, lastName string
			if err := rows.Scan(&id, &name, &lastName); err != nil {
				tx.Rollback()
				return err
			}

			// Create localized string for name
			nameRes, err := tx.Exec(`INSERT INTO localized_strings (en, ru) VALUES (?, ?)`, name, name)
			if err != nil {
				tx.Rollback()
				return err
			}
			nameID, err := nameRes.LastInsertId()
			if err != nil {
				tx.Rollback()
				return err
			}

			// Create localized string for last_name
			lastNameRes, err := tx.Exec(`INSERT INTO localized_strings (en, ru) VALUES (?, ?)`, lastName, lastName)
			if err != nil {
				tx.Rollback()
				return err
			}
			lastNameID, err := lastNameRes.LastInsertId()
			if err != nil {
				tx.Rollback()
				return err
			}

			// Update the researcher
			_, err = tx.Exec(`UPDATE researchers SET name_id = ?, last_name_id = ? WHERE id = ?`, nameID, lastNameID, id)
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Add the new columns
		_, err = tx.Exec(`ALTER TABLE researchers ADD COLUMN name_id INTEGER REFERENCES localized_strings(id)`)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec(`ALTER TABLE researchers ADD COLUMN last_name_id INTEGER REFERENCES localized_strings(id)`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}

		// Create a new transaction for schema changes
		tx, err = DB.Begin()
		if err != nil {
			return err
		}

		// Create a temporary table with the new schema
		_, err = tx.Exec(`
			CREATE TABLE researchers_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name_id INTEGER NOT NULL,
				last_name_id INTEGER NOT NULL,
				position_id INTEGER NOT NULL,
				photo TEXT NOT NULL,
				bio_id INTEGER,
				research_gate TEXT,
				google_scholar TEXT,
				scopus TEXT,
				publons TEXT,
				orcid TEXT,
				FOREIGN KEY (name_id) REFERENCES localized_strings(id),
				FOREIGN KEY (last_name_id) REFERENCES localized_strings(id),
				FOREIGN KEY (position_id) REFERENCES localized_strings(id),
				FOREIGN KEY (bio_id) REFERENCES localized_strings(id)
			)
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Copy data to the new table
		_, err = tx.Exec(`
			INSERT INTO researchers_new (id, name_id, last_name_id, position_id, photo, bio_id, research_gate, google_scholar, scopus, publons, orcid)
			SELECT id, name_id, last_name_id, position_id, photo, bio_id, research_gate, google_scholar, scopus, publons, orcid FROM researchers
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Drop the old table
		_, err = tx.Exec(`DROP TABLE researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Rename the new table
		_, err = tx.Exec(`ALTER TABLE researchers_new RENAME TO researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	// Check if the publication_authors table exists
	err = DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='publication_authors'`).Scan(&count)
	if err != nil {
		return err
	}

	// If the table doesn't exist, migrate the data
	if count == 0 {
		// Create a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Create the publication_authors table
		_, err = tx.Exec(`
			CREATE TABLE publication_authors (
				publication_id INTEGER NOT NULL,
				researcher_id INTEGER NOT NULL,
				PRIMARY KEY (publication_id, researcher_id),
				FOREIGN KEY (publication_id) REFERENCES publications(id),
				FOREIGN KEY (researcher_id) REFERENCES researchers(id)
			)
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

// migratePublicationFields converts year field to published_at and adds citations_count field
func migratePublicationFields() error {
	// Check if the published_at column exists
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='published_at'`).Scan(&count)
	if err != nil {
		return err
	}

	// If published_at column doesn't exist, migrate the data
	if count == 0 {
		// Create a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Check if the year column exists
		var yearCount int
		err = tx.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='year'`).Scan(&yearCount)
		if err != nil {
			tx.Rollback()
			return err
		}

		if yearCount > 0 {
			// Create a new publications table with the updated schema
			_, err = tx.Exec(`
				CREATE TABLE publications_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					title_id INTEGER NOT NULL,
					journal TEXT NOT NULL,
					published_at TEXT NOT NULL,
					citations_count INTEGER DEFAULT 0,
					link TEXT NOT NULL,
					FOREIGN KEY (title_id) REFERENCES localized_strings(id)
				)
			`)
			if err != nil {
				tx.Rollback()
				return err
			}

			// Copy data from old table to new table, converting year to published_at
			_, err = tx.Exec(`
				INSERT INTO publications_new (id, title_id, journal, published_at, citations_count, link)
				SELECT id, title_id, journal, year || '-01-01', 0, link FROM publications
			`)
			if err != nil {
				tx.Rollback()
				return err
			}

			// Drop the old table
			_, err = tx.Exec(`DROP TABLE publications`)
			if err != nil {
				tx.Rollback()
				return err
			}

			// Rename the new table to the original table name
			_, err = tx.Exec(`ALTER TABLE publications_new RENAME TO publications`)
			if err != nil {
				tx.Rollback()
				return err
			}
		} else {
			// If we don't have the year column, just add the new columns
			_, err = tx.Exec(`ALTER TABLE publications ADD COLUMN published_at TEXT NOT NULL DEFAULT '2023-01-01'`)
			if err != nil {
				tx.Rollback()
				return err
			}

			_, err = tx.Exec(`ALTER TABLE publications ADD COLUMN citations_count INTEGER DEFAULT 0`)
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

// migrateAddPositionToResearchers adds position_id column if it doesn't exist
func migrateAddPositionToResearchers() error {
	// Check if the position_id column exists
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='position_id'`).Scan(&count)
	if err != nil {
		return err
	}

	// If the position_id column doesn't exist, add it
	if count == 0 {
		// Create a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Create a localized string for a default position
		res, err := tx.Exec(`INSERT INTO localized_strings (en, ru) VALUES ('Researcher', 'Исследователь')`)
		if err != nil {
			tx.Rollback()
			return err
		}

		defaultPositionID, err := res.LastInsertId()
		if err != nil {
			tx.Rollback()
			return err
		}

		// Add the position_id column with the default value
		// SQLite doesn't support parameters in ALTER TABLE statements
		// so we need to construct the query with the actual value
		query := "ALTER TABLE researchers ADD COLUMN position_id INTEGER NOT NULL DEFAULT " +
			strconv.FormatInt(defaultPositionID, 10) +
			" REFERENCES localized_strings(id)"
		_, err = tx.Exec(query)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Update all existing researchers to use the default position
		_, err = tx.Exec("UPDATE researchers SET position_id = ?", defaultPositionID)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	// Check if title_id column exists before trying to remove it
	var titleIdExists int
	err = DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='title_id'`).Scan(&titleIdExists)
	if err != nil {
		return err
	}

	// If title_id exists, we need to remove it
	// SQLite doesn't support DROP COLUMN directly before version 3.35.0 (2021)
	// We need to create a new table without the column and copy the data
	if titleIdExists > 0 {
		// Start a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Create a new table without the title_id column
		_, err = tx.Exec(`
			CREATE TABLE researchers_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name_id INTEGER NOT NULL,
				last_name_id INTEGER NOT NULL,
				position_id INTEGER NOT NULL,
				photo TEXT NOT NULL,
				bio_id INTEGER,
				research_gate TEXT,
				google_scholar TEXT,
				scopus TEXT,
				publons TEXT,
				orcid TEXT,
				FOREIGN KEY (name_id) REFERENCES localized_strings(id),
				FOREIGN KEY (last_name_id) REFERENCES localized_strings(id),
				FOREIGN KEY (position_id) REFERENCES localized_strings(id),
				FOREIGN KEY (bio_id) REFERENCES localized_strings(id)
			)
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Copy data from the old table to the new one, excluding title_id
		_, err = tx.Exec(`
			INSERT INTO researchers_new (id, name_id, last_name_id, position_id, photo, bio_id, 
				research_gate, google_scholar, scopus, publons, orcid)
			SELECT id, name_id, last_name_id, position_id, photo, bio_id, 
				research_gate, google_scholar, scopus, publons, orcid 
			FROM researchers
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Drop the old table
		_, err = tx.Exec(`DROP TABLE researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Rename the new table to the original name
		_, err = tx.Exec(`ALTER TABLE researchers_new RENAME TO researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

type NewAuthor struct {
	id            int
	publicationID int
	nameID        int
}

// migratePublicationExternalAuthors updates the publication_external_authors table to use localized strings
func migratePublicationExternalAuthors() error {
	// Check if the name_id column exists
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publication_external_authors') WHERE name='name_id'`).Scan(&count)
	if err != nil {
		return err
	}

	// If the name_id column doesn't exist, migrate the data
	if count == 0 {
		// Create a transaction
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		rows, err := tx.Query(`SELECT id, publication_id, name FROM publication_external_authors`)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer rows.Close()

		newAuthors := []NewAuthor{}

		for rows.Next() {
			var id, publicationID int
			var name string
			if err := rows.Scan(&id, &publicationID, &name); err != nil {
				tx.Rollback()
				return err
			}

			nameRes, err := tx.Exec(`INSERT INTO localized_strings (en, ru) VALUES (?, ?)`, name, name)
			if err != nil {
				tx.Rollback()
				return err
			}

			nameID, err := nameRes.LastInsertId()
			if err != nil {
				tx.Rollback()
				return err
			}

			newAuthors = append(newAuthors, NewAuthor{
				id:            id,
				publicationID: publicationID,
				nameID:        int(nameID),
			})
		}

		_, err = tx.Exec(`
			CREATE TABLE publication_external_authors_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				publication_id INTEGER NOT NULL,
				name_id INTEGER NOT NULL,
				FOREIGN KEY (publication_id) REFERENCES publications(id),
				FOREIGN KEY (name_id) REFERENCES localized_strings(id)
			)
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		for _, author := range newAuthors {
			_, err = tx.Exec(`INSERT INTO publication_external_authors_new (id, publication_id, name_id) VALUES (?, ?, ?)`, author.id, author.publicationID, author.nameID)
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		_, err = tx.Exec(`DROP TABLE publication_external_authors`)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec(`ALTER TABLE publication_external_authors_new RENAME TO publication_external_authors`)
		if err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

// migrateAddVisibleToPublications adds the visible column to the publications table if it doesn't exist
func migrateAddVisibleToPublications() error {
	// Check if the visible column exists
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='visible'`).Scan(&count)
	if err != nil {
		return err
	}

	// If the column doesn't exist, add it
	if count == 0 {
		_, err = DB.Exec(`ALTER TABLE publications ADD COLUMN visible BOOLEAN DEFAULT 0`)
		if err != nil {
			return err
		}
	}

	return nil
}
