package repository

import (
	"database/sql"
	"os"
	"path/filepath"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteTrainingMaterialRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLiteTrainingMaterialRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLiteTrainingMaterialRepo {
	return &SQLiteTrainingMaterialRepo{db: db, localizedStringRepo: lsRepo}
}

func (r *SQLiteTrainingMaterialRepo) Create(material models.TrainingMaterial) (int64, error) {
	titleID, err := r.localizedStringRepo.Create(material.Title)
	if err != nil {
		return 0, err
	}

	descriptionID, err := r.localizedStringRepo.Create(material.Description)
	if err != nil {
		return 0, err
	}

	res, err := r.db.Exec(
		"INSERT INTO training_materials (title_id, description_id, url, image) VALUES (?, ?, ?, ?)",
		titleID, descriptionID, material.URL, material.Image,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	return id, err
}

func (r *SQLiteTrainingMaterialRepo) GetByID(id int) (*models.TrainingMaterial, error) {
	var material models.TrainingMaterial
	var titleID, descriptionID int64
	err := r.db.QueryRow(
		"SELECT id, title_id, description_id, url, image FROM training_materials WHERE id = ?",
		id,
	).Scan(&material.ID, &titleID, &descriptionID, &material.URL, &material.Image)
	if err != nil {
		return nil, err
	}

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	material.Title = *title

	description, err := r.localizedStringRepo.Get(descriptionID)
	if err != nil {
		return nil, err
	}
	material.Description = *description

	return &material, nil
}

func (r *SQLiteTrainingMaterialRepo) GetAll() ([]models.TrainingMaterial, error) {
	rows, err := r.db.Query(
		"SELECT id, title_id, description_id, url, image FROM training_materials",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	materials := []models.TrainingMaterial{}
	for rows.Next() {
		var material models.TrainingMaterial
		var titleID, descriptionID int64
		if err := rows.Scan(&material.ID, &titleID, &descriptionID, &material.URL, &material.Image); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		material.Title = *title

		description, err := r.localizedStringRepo.Get(descriptionID)
		if err != nil {
			return nil, err
		}
		material.Description = *description

		materials = append(materials, material)
	}
	return materials, nil
}

func (r *SQLiteTrainingMaterialRepo) Update(material models.TrainingMaterial) error {
	var titleID, descriptionID int64
	err := r.db.QueryRow(
		"SELECT title_id, description_id FROM training_materials WHERE id = ?",
		material.ID,
	).Scan(&titleID, &descriptionID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, material.Title); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(descriptionID, material.Description); err != nil {
		return err
	}

	_, err = r.db.Exec(
		"UPDATE training_materials SET url = ?, image = ? WHERE id = ?",
		material.URL, material.Image, material.ID,
	)
	return err
}

func (r *SQLiteTrainingMaterialRepo) Delete(id int) error {
	var titleID, descriptionID int64
	var image string
	err := r.db.QueryRow(
		"SELECT title_id, description_id, image FROM training_materials WHERE id = ?",
		id,
	).Scan(&titleID, &descriptionID, &image)
	if err != nil {
		return err
	}

	if image != "" {
		filePath := filepath.Join("../", image)
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			return err
		}
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(descriptionID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM training_materials WHERE id = ?", id)
	return err
}
