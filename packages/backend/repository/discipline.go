package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteDisciplineRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
	researcherRepo      ResearcherRepo
}

func NewSQLiteDisciplineRepo(db *sql.DB, lsRepo LocalizedStringRepo, rRepo ResearcherRepo) *SQLiteDisciplineRepo {
	return &SQLiteDisciplineRepo{
		db:                  db,
		localizedStringRepo: lsRepo,
		researcherRepo:      rRepo,
	}
}

func (r *SQLiteDisciplineRepo) Create(discipline models.Discipline) (int64, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Create localized strings
	titleID, err := r.localizedStringRepo.CreateTx(tx, discipline.Title)
	if err != nil {
		return 0, err
	}

	descriptionID, err := r.localizedStringRepo.CreateTx(tx, discipline.Description)
	if err != nil {
		return 0, err
	}

	// Insert the discipline
	res, err := tx.Exec(
		`INSERT INTO disciplines (title_id, description_id, image) 
		VALUES (?, ?, ?)`,
		titleID, descriptionID, discipline.Image,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Add researchers to the discipline
	for _, researcher := range discipline.Researchers {
		_, err = tx.Exec(
			`INSERT INTO discipline_researchers (discipline_id, researcher_id) 
			VALUES (?, ?)`,
			id, researcher.ID,
		)
		if err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return id, nil
}

func (r *SQLiteDisciplineRepo) GetByID(id int) (*models.Discipline, error) {
	var discipline models.Discipline
	var titleID, descriptionID int64

	err := r.db.QueryRow(
		`SELECT id, title_id, description_id, image 
		FROM disciplines WHERE id = ?`,
		id,
	).Scan(
		&discipline.ID, &titleID, &descriptionID, &discipline.Image,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("discipline not found")
		}
		return nil, err
	}

	// Get localized strings
	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	discipline.Title = *title

	description, err := r.localizedStringRepo.Get(descriptionID)
	if err != nil {
		return nil, err
	}
	discipline.Description = *description

	// Get researchers for this discipline
	researchers, err := r.getDisciplineResearchers(id)
	if err != nil {
		return nil, err
	}
	discipline.Researchers = researchers

	return &discipline, nil
}

func (r *SQLiteDisciplineRepo) GetAll() ([]models.Discipline, error) {
	rows, err := r.db.Query(`SELECT id, title_id, description_id, image FROM disciplines`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	disciplines := []models.Discipline{}
	for rows.Next() {
		var discipline models.Discipline
		var titleID, descriptionID int64

		err := rows.Scan(
			&discipline.ID, &titleID, &descriptionID, &discipline.Image,
		)
		if err != nil {
			return nil, err
		}

		// Get localized strings
		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		discipline.Title = *title

		description, err := r.localizedStringRepo.Get(descriptionID)
		if err != nil {
			return nil, err
		}
		discipline.Description = *description

		// Get researchers for this discipline
		researchers, err := r.getDisciplineResearchers(discipline.ID)
		if err != nil {
			return nil, err
		}
		discipline.Researchers = researchers

		disciplines = append(disciplines, discipline)
	}

	return disciplines, nil
}

func (r *SQLiteDisciplineRepo) Update(discipline models.Discipline) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get current discipline data
	var titleID, descriptionID int64
	var currentImage string
	err = tx.QueryRow(
		`SELECT title_id, description_id, image 
		FROM disciplines WHERE id = ?`,
		discipline.ID,
	).Scan(&titleID, &descriptionID, &currentImage)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("discipline not found")
		}
		return err
	}

	// Update localized strings
	if err := r.localizedStringRepo.UpdateTx(tx, titleID, discipline.Title); err != nil {
		return err
	}

	if err := r.localizedStringRepo.UpdateTx(tx, descriptionID, discipline.Description); err != nil {
		return err
	}

	// Update discipline
	_, err = tx.Exec(
		`UPDATE disciplines SET image = ? WHERE id = ?`,
		discipline.Image, discipline.ID,
	)
	if err != nil {
		return err
	}

	// Delete existing researcher associations
	_, err = tx.Exec(`DELETE FROM discipline_researchers WHERE discipline_id = ?`, discipline.ID)
	if err != nil {
		return err
	}

	// Add updated researchers
	for _, researcher := range discipline.Researchers {
		_, err = tx.Exec(
			`INSERT INTO discipline_researchers (discipline_id, researcher_id) 
			VALUES (?, ?)`,
			discipline.ID, researcher.ID,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *SQLiteDisciplineRepo) Delete(id int) error {
	discipline, err := r.GetByID(id)
	if err != nil {
		return err
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get localized string IDs
	var titleID, descriptionID int64
	err = tx.QueryRow(
		`SELECT title_id, description_id
		FROM disciplines WHERE id = ?`,
		id,
	).Scan(&titleID, &descriptionID)
	if err != nil {
		return err
	}

	// Delete researcher associations
	_, err = tx.Exec(`DELETE FROM discipline_researchers WHERE discipline_id = ?`, id)
	if err != nil {
		return err
	}

	// Delete the discipline
	_, err = tx.Exec(`DELETE FROM disciplines WHERE id = ?`, id)
	if err != nil {
		return err
	}

	// Delete localized strings
	if err := r.localizedStringRepo.DeleteTx(tx, titleID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.DeleteTx(tx, descriptionID); err != nil {
		return err
	}

	// Delete the image file if it exists
	if discipline.Image != "" {
		filePath := filepath.Join("../", discipline.Image)
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			// Just log the error but don't fail the transaction
			fmt.Printf("Error removing discipline image file: %v\n", err)
		}
	}

	return tx.Commit()
}

// Helper function to get researchers for a discipline
func (r *SQLiteDisciplineRepo) getDisciplineResearchers(disciplineID int) ([]models.DisciplineResearcher, error) {
	rows, err := r.db.Query(`
		SELECT r.id, ls_name.en, ls_name.ru, ls_last_name.en, ls_last_name.ru
		FROM discipline_researchers dr
		JOIN researchers r ON dr.researcher_id = r.id
		JOIN localized_strings ls_name ON r.name_id = ls_name.id
		JOIN localized_strings ls_last_name ON r.last_name_id = ls_last_name.id
		WHERE dr.discipline_id = ?
	`, disciplineID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	researchers := []models.DisciplineResearcher{}
	for rows.Next() {
		var researcher models.DisciplineResearcher
		var nameEn, nameRu, lastNameEn, lastNameRu string

		err := rows.Scan(&researcher.ID, &nameEn, &nameRu, &lastNameEn, &lastNameRu)
		if err != nil {
			return nil, err
		}

		researcher.Name = models.LocalizedString{
			En: nameEn,
			Ru: nameRu,
		}

		researcher.LastName = models.LocalizedString{
			En: lastNameEn,
			Ru: lastNameRu,
		}

		researchers = append(researchers, researcher)
	}

	return researchers, nil
}
