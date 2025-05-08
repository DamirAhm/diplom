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

	if err = migrateAddLastNameToResearchers(); err != nil {
		return err
	}

	if err = migratePublicationFields(); err != nil {
		return err
	}

	if err = migrateAddPositionToResearchers(); err != nil {
		return err
	}

	if err = migratePublicationExternalAuthors(); err != nil {
		return err
	}

	if err = migrateAddVisibleToPublications(); err != nil {
		return err
	}

	if err = migrateAddProjectImages(); err != nil {
		return err
	}

	if err = migrateAddCitationStats(); err != nil {
		return err
	}

	if err = migrateAddDisciplines(); err != nil {
		return err
	}

	if err = migrateRemoveLevelFromDisciplines(); err != nil {
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
		`CREATE TABLE IF NOT EXISTS project_images (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL,
			url TEXT NOT NULL,
			image_order INTEGER NOT NULL,
			FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
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
			total_citations INTEGER DEFAULT 0,
			h_index INTEGER DEFAULT 0,
			recent_citations INTEGER DEFAULT 0,
			recent_h_index INTEGER DEFAULT 0,
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

func migrateAddLastNameToResearchers() error {

	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='name_id'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		rows, err := tx.Query(`SELECT id, name, last_name FROM researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var id int
			var name, lastName string
			if err := rows.Scan(&id, &name, &lastName); err != nil {
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

			_, err = tx.Exec(`UPDATE researchers SET name_id = ?, last_name_id = ? WHERE id = ?`, nameID, lastNameID, id)
			if err != nil {
				tx.Rollback()
				return err
			}
		}

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

		if err := tx.Commit(); err != nil {
			return err
		}

		tx, err = DB.Begin()
		if err != nil {
			return err
		}

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

		_, err = tx.Exec(`
			INSERT INTO researchers_new (id, name_id, last_name_id, position_id, photo, bio_id, research_gate, google_scholar, scopus, publons, orcid)
			SELECT id, name_id, last_name_id, position_id, photo, bio_id, research_gate, google_scholar, scopus, publons, orcid FROM researchers
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec(`DROP TABLE researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec(`ALTER TABLE researchers_new RENAME TO researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	err = DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='publication_authors'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

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

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

func migratePublicationFields() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='published_at'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		var yearCount int
		err = tx.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='year'`).Scan(&yearCount)
		if err != nil {
			tx.Rollback()
			return err
		}

		if yearCount > 0 {
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

			_, err = tx.Exec(`
				INSERT INTO publications_new (id, title_id, journal, published_at, citations_count, link)
				SELECT id, title_id, journal, year || '-01-01', 0, link FROM publications
			`)
			if err != nil {
				tx.Rollback()
				return err
			}

			_, err = tx.Exec(`DROP TABLE publications`)
			if err != nil {
				tx.Rollback()
				return err
			}

			_, err = tx.Exec(`ALTER TABLE publications_new RENAME TO publications`)
			if err != nil {
				tx.Rollback()
				return err
			}
		} else {
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

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

func migrateAddPositionToResearchers() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='position_id'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

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

		query := "ALTER TABLE researchers ADD COLUMN position_id INTEGER NOT NULL DEFAULT " +
			strconv.FormatInt(defaultPositionID, 10) +
			" REFERENCES localized_strings(id)"
		_, err = tx.Exec(query)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec("UPDATE researchers SET position_id = ?", defaultPositionID)
		if err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	var titleIdExists int
	err = DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='title_id'`).Scan(&titleIdExists)
	if err != nil {
		return err
	}

	if titleIdExists > 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

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

		_, err = tx.Exec(`DROP TABLE researchers`)
		if err != nil {
			tx.Rollback()
			return err
		}

		_, err = tx.Exec(`ALTER TABLE researchers_new RENAME TO researchers`)
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

type NewAuthor struct {
	id            int
	publicationID int
	nameID        int
}

func migratePublicationExternalAuthors() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publication_external_authors') WHERE name='name_id'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
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

func migrateAddVisibleToPublications() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('publications') WHERE name='visible'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		_, err = DB.Exec(`ALTER TABLE publications ADD COLUMN visible BOOLEAN DEFAULT 0`)
		if err != nil {
			return err
		}
	}

	return nil
}

func migrateAddProjectImages() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='project_images'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		_, err = tx.Exec(`
			CREATE TABLE project_images (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				project_id INTEGER NOT NULL,
				url TEXT NOT NULL,
				image_order INTEGER NOT NULL,
				FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
			)
		`)
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

func migrateAddCitationStats() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('researchers') WHERE name='total_citations'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		_, err = DB.Exec(`
			ALTER TABLE researchers ADD COLUMN total_citations INTEGER DEFAULT 0;
			ALTER TABLE researchers ADD COLUMN h_index INTEGER DEFAULT 0;
			ALTER TABLE researchers ADD COLUMN recent_citations INTEGER DEFAULT 0;
			ALTER TABLE researchers ADD COLUMN recent_h_index INTEGER DEFAULT 0
		`)
		if err != nil {
			return err
		}
	}

	return nil
}

func migrateAddDisciplines() error {
	var count int
	err := DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='disciplines'`).Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		tx, err := DB.Begin()
		if err != nil {
			return err
		}

		// Create disciplines table
		_, err = tx.Exec(`
			CREATE TABLE disciplines (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title_id INTEGER NOT NULL,
				description_id INTEGER NOT NULL,
				image TEXT NOT NULL,
				FOREIGN KEY (title_id) REFERENCES localized_strings(id),
				FOREIGN KEY (description_id) REFERENCES localized_strings(id)
			)
		`)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Create discipline_researchers table for many-to-many relationship
		_, err = tx.Exec(`
			CREATE TABLE discipline_researchers (
				discipline_id INTEGER NOT NULL,
				researcher_id INTEGER NOT NULL,
				PRIMARY KEY (discipline_id, researcher_id),
				FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
				FOREIGN KEY (researcher_id) REFERENCES researchers(id) ON DELETE CASCADE
			)
		`)
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

func migrateRemoveLevelFromDisciplines() error {
	// Check if the table exists first
	var tableExists int
	err := DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='disciplines'`).Scan(&tableExists)
	if err != nil {
		return err
	}

	if tableExists == 0 {
		// Table doesn't exist yet, nothing to migrate
		return nil
	}

	// Check if the level_id column exists
	var levelIdExists int
	err = DB.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('disciplines') WHERE name='level_id'`).Scan(&levelIdExists)
	if err != nil {
		return err
	}

	if levelIdExists > 0 {
		// Level column exists, need to migrate
		tx, err := DB.Begin()
		if err != nil {
			return err
		}
		defer func() {
			if err != nil {
				tx.Rollback()
			}
		}()

		// Create a new table without the level_id field
		_, err = tx.Exec(`
			CREATE TABLE disciplines_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title_id INTEGER NOT NULL,
				description_id INTEGER NOT NULL,
				image TEXT NOT NULL,
				FOREIGN KEY (title_id) REFERENCES localized_strings(id),
				FOREIGN KEY (description_id) REFERENCES localized_strings(id)
			)
		`)
		if err != nil {
			return err
		}

		// Copy data to the new table
		_, err = tx.Exec(`
			INSERT INTO disciplines_new (id, title_id, description_id, image)
			SELECT id, title_id, description_id, image FROM disciplines
		`)
		if err != nil {
			return err
		}

		// Get all level_id values to delete them from localized_strings later
		rows, err := tx.Query(`SELECT level_id FROM disciplines`)
		if err != nil {
			return err
		}
		defer rows.Close()

		var levelIds []int64
		for rows.Next() {
			var levelId int64
			if err := rows.Scan(&levelId); err != nil {
				return err
			}
			levelIds = append(levelIds, levelId)
		}

		// Drop the old table
		_, err = tx.Exec(`DROP TABLE disciplines`)
		if err != nil {
			return err
		}

		// Rename the new table
		_, err = tx.Exec(`ALTER TABLE disciplines_new RENAME TO disciplines`)
		if err != nil {
			return err
		}

		// Delete the localized strings used for level
		for _, levelId := range levelIds {
			_, err = tx.Exec(`DELETE FROM localized_strings WHERE id = ?`, levelId)
			if err != nil {
				return err
			}
		}

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}
