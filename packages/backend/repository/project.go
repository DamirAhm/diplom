package repository

import (
	"database/sql"
	"os"
	"path/filepath"

	"github.com/damirahm/diplom/backend/models"
)

type SQLiteProjectRepo struct {
	db                  *sql.DB
	localizedStringRepo LocalizedStringRepo
}

func NewSQLiteProjectRepo(db *sql.DB, lsRepo LocalizedStringRepo) *SQLiteProjectRepo {
	return &SQLiteProjectRepo{db: db, localizedStringRepo: lsRepo}
}

func (r *SQLiteProjectRepo) Create(project models.Project) (int64, error) {
	titleID, err := r.localizedStringRepo.Create(project.Title)
	if err != nil {
		return 0, err
	}

	descriptionID, err := r.localizedStringRepo.Create(project.Description)
	if err != nil {
		return 0, err
	}

	res, err := r.db.Exec(
		"INSERT INTO projects (title_id, description_id, github_link) VALUES (?, ?, ?)",
		titleID, descriptionID, project.GithubLink,
	)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	for _, image := range project.Images {
		if err := r.AddImage(int(id), image); err != nil {
			return 0, err
		}
	}

	return id, nil
}

func (r *SQLiteProjectRepo) GetByID(id int) (*models.Project, error) {
	project := models.NewProject()
	var titleID, descriptionID int64

	err := r.db.QueryRow(
		"SELECT id, title_id, description_id, github_link FROM projects WHERE id = ?",
		id,
	).Scan(&project.ID, &titleID, &descriptionID, &project.GithubLink)
	if err != nil {
		return nil, err
	}

	title, err := r.localizedStringRepo.Get(titleID)
	if err != nil {
		return nil, err
	}
	project.Title = *title

	description, err := r.localizedStringRepo.Get(descriptionID)
	if err != nil {
		return nil, err
	}
	project.Description = *description

	publications, err := r.getProjectPublications(id)
	if err != nil {
		return nil, err
	}
	if publications != nil {
		project.Publications = publications
	}

	videos, err := r.getProjectVideos(id)
	if err != nil {
		return nil, err
	}
	if videos != nil {
		project.Videos = videos
	}

	images, err := r.getProjectImages(id)
	if err != nil {
		return nil, err
	}
	if images != nil {
		project.Images = images
	}

	return &project, nil
}

func (r *SQLiteProjectRepo) GetAll() ([]models.Project, error) {
	rows, err := r.db.Query("SELECT id, title_id, description_id, github_link FROM projects")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		project := models.NewProject()
		var titleID, descriptionID int64
		if err := rows.Scan(&project.ID, &titleID, &descriptionID, &project.GithubLink); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		project.Title = *title

		description, err := r.localizedStringRepo.Get(descriptionID)
		if err != nil {
			return nil, err
		}
		project.Description = *description

		publications, err := r.getProjectPublications(project.ID)
		if err != nil {
			return nil, err
		}
		if publications != nil {
			project.Publications = publications
		}

		images, err := r.getProjectImages(project.ID)
		if err != nil {
			return nil, err
		}
		if images != nil {
			project.Images = images
		}

		projects = append(projects, project)
	}

	return projects, nil
}

func (r *SQLiteProjectRepo) Update(project models.Project) error {
	var titleID, descriptionID int64
	err := r.db.QueryRow(
		"SELECT title_id, description_id FROM projects WHERE id = ?",
		project.ID,
	).Scan(&titleID, &descriptionID)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(titleID, project.Title); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Update(descriptionID, project.Description); err != nil {
		return err
	}

	_, err = r.db.Exec(
		"UPDATE projects SET github_link = ? WHERE id = ?",
		project.GithubLink, project.ID,
	)
	if err != nil {
		return err
	}

	// Delete existing images
	_, err = r.db.Exec("DELETE FROM project_images WHERE project_id = ?", project.ID)
	if err != nil {
		return err
	}

	// Add new images
	for _, image := range project.Images {
		if err := r.AddImage(project.ID, image); err != nil {
			return err
		}
	}

	// Delete existing videos
	_, err = r.db.Exec("DELETE FROM project_videos WHERE project_id = ?", project.ID)
	if err != nil {
		return err
	}

	// Add new videos
	for _, video := range project.Videos {
		if err := r.AddVideo(project.ID, video); err != nil {
			return err
		}
	}

	// Delete existing publications
	_, err = r.db.Exec("DELETE FROM project_publications WHERE project_id = ?", project.ID)
	if err != nil {
		return err
	}

	// Add new publications
	for _, pub := range project.Publications {
		if err := r.AddPublication(project.ID, pub); err != nil {
			return err
		}
	}

	return nil
}

func (r *SQLiteProjectRepo) Delete(id int) error {
	var titleID, descriptionID int64
	err := r.db.QueryRow(
		"SELECT title_id, description_id FROM projects WHERE id = ?",
		id,
	).Scan(&titleID, &descriptionID)
	if err != nil {
		return err
	}

	images, err := r.getProjectImages(id)
	if err != nil {
		return err
	}

	for _, image := range images {
		if image.URL != "" {
			filePath := filepath.Join("../", image.URL)
			if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
				return err
			}
		}
	}

	_, err = r.db.Exec("DELETE FROM project_images WHERE project_id = ?", id)
	if err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM project_videos WHERE project_id = ?", id)
	if err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(titleID); err != nil {
		return err
	}

	if err := r.localizedStringRepo.Delete(descriptionID); err != nil {
		return err
	}

	_, err = r.db.Exec("DELETE FROM projects WHERE id = ?", id)
	return err
}

func (r *SQLiteProjectRepo) AddPublication(projectID int, pub models.ProjectPublication) error {
	titleID, err := r.localizedStringRepo.Create(pub.Title)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		"INSERT INTO project_publications (project_id, title_id, link) VALUES (?, ?, ?)",
		projectID, titleID, pub.Link,
	)
	return err
}

func (r *SQLiteProjectRepo) AddVideo(projectID int, video models.ProjectVideo) error {
	titleID, err := r.localizedStringRepo.Create(video.Title)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(
		"INSERT INTO project_videos (project_id, title_id, embed_url) VALUES (?, ?, ?)",
		projectID, titleID, video.EmbedURL,
	)
	return err
}

func (r *SQLiteProjectRepo) AddImage(projectID int, image models.ProjectImage) error {
	_, err := r.db.Exec(
		"INSERT INTO project_images (project_id, url, image_order) VALUES (?, ?, ?)",
		projectID, image.URL, image.Order,
	)
	return err
}

func (r *SQLiteProjectRepo) getProjectPublications(projectID int) ([]models.ProjectPublication, error) {
	rows, err := r.db.Query(
		"SELECT id, title_id, link FROM project_publications WHERE project_id = ?",
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var publications []models.ProjectPublication
	for rows.Next() {
		var pub models.ProjectPublication
		var titleID int64
		if err := rows.Scan(&pub.ID, &titleID, &pub.Link); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		pub.Title = *title

		publications = append(publications, pub)
	}
	return publications, nil
}

func (r *SQLiteProjectRepo) getProjectVideos(projectID int) ([]models.ProjectVideo, error) {
	rows, err := r.db.Query(
		"SELECT id, title_id, embed_url FROM project_videos WHERE project_id = ?",
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []models.ProjectVideo
	for rows.Next() {
		var video models.ProjectVideo
		var titleID int64
		if err := rows.Scan(&video.ID, &titleID, &video.EmbedURL); err != nil {
			return nil, err
		}

		title, err := r.localizedStringRepo.Get(titleID)
		if err != nil {
			return nil, err
		}
		video.Title = *title

		videos = append(videos, video)
	}
	return videos, nil
}

func (r *SQLiteProjectRepo) getProjectImages(projectID int) ([]models.ProjectImage, error) {
	rows, err := r.db.Query(
		"SELECT id, url, image_order FROM project_images WHERE project_id = ? ORDER BY image_order",
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []models.ProjectImage
	for rows.Next() {
		var image models.ProjectImage
		if err := rows.Scan(&image.ID, &image.URL, &image.Order); err != nil {
			return nil, err
		}
		images = append(images, image)
	}
	return images, nil
}
