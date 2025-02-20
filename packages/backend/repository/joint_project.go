package repository

import (
	"database/sql"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteJointProjectRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLiteJointProjectRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLiteJointProjectRepo {
	return &SQLiteJointProjectRepo{db: db, localizedStringRepo: lsRepo}
}

func (r *SQLiteJointProjectRepo) Create(project models.JointProject) error {
	titleID, err := r.localizedStringRepo.Create(project.Title)
	if err != nil {
		return err
	}

	result, err := r.db.Exec(
		"INSERT INTO joint_projects (title_id, year) VALUES (?, ?)",
		titleID, project.Year,
	)
	if err != nil {
		return err
	}

	projectID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	for _, partner := range project.Partners {
		_, err = r.db.Exec(
			"INSERT INTO joint_project_partners (project_id, partner_name) VALUES (?, ?)",
			projectID, partner,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *SQLiteJointProjectRepo) GetByID(id int) (*models.JointProject, error) {
	var project models.JointProject
	var titleID int64

	err := r.db.QueryRow(
		"SELECT id, title_id, year FROM joint_projects WHERE id = ?",
		id,
	).Scan(&project.ID, &titleID, &project.Year)
	if err != nil {
		return nil, err
	}

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	project.Title = *title

	partners, err := r.getProjectPartners(id)
	if err != nil {
		return nil, err
	}
	project.Partners = partners

	return &project, nil
}

func (r *SQLiteJointProjectRepo) GetAll() ([]models.JointProject, error) {
	projects := make([]models.JointProject, 0)

	rows, err := r.db.Query("SELECT id, title_id, year FROM joint_projects")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var project models.JointProject
		var titleID int64
		if err := rows.Scan(&project.ID, &titleID, &project.Year); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		project.Title = *title

		partners, err := r.getProjectPartners(project.ID)
		if err != nil {
			return nil, err
		}
		project.Partners = partners

		projects = append(projects, project)
	}
	return projects, nil
}

func (r *SQLiteJointProjectRepo) Update(project models.JointProject) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM joint_projects WHERE id = ?",
		project.ID,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, project.Title); err != nil {
		return err
	}

	_, err = r.db.Exec(
		"UPDATE joint_projects SET year = ? WHERE id = ?",
		project.Year, project.ID,
	)
	if err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM joint_project_partners WHERE project_id = ?", project.ID)
	if err != nil {
		return err
	}

	for _, partner := range project.Partners {
		_, err = r.db.Exec(
			"INSERT INTO joint_project_partners (project_id, partner_name) VALUES (?, ?)",
			project.ID, partner,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *SQLiteJointProjectRepo) Delete(id int) error {
	var titleID int64
	err := r.db.QueryRow(
		"SELECT title_id FROM joint_projects WHERE id = ?",
		id,
	).Scan(&titleID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM joint_project_partners WHERE project_id = ?", id)
	if err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM joint_projects WHERE id = ?", id)
	return err
}

func (r *SQLiteJointProjectRepo) getProjectPartners(projectID int) ([]string, error) {
	rows, err := r.db.Query(
		"SELECT partner_name FROM joint_project_partners WHERE project_id = ?",
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var partners []string
	for rows.Next() {
		var partner string
		if err := rows.Scan(&partner); err != nil {
			return nil, err
		}
		partners = append(partners, partner)
	}
	return partners, nil
}
