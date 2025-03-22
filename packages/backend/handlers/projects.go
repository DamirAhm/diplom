package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/damirahm/diplom/backend/utils"
	"github.com/gorilla/mux"
)

type ProjectHandler struct {
	projectRepo repository.ProjectRepo
}

func NewProjectHandler(pr repository.ProjectRepo) *ProjectHandler {
	return &ProjectHandler{projectRepo: pr}
}

// GetProjects godoc
// @Summary Get all projects
// @Description Get a list of all projects
// @Tags projects
// @Accept json
// @Produce json
// @Success 200 {array} models.Project
// @Failure 500 {object} string "Internal Server Error"
// @Router /projects [get]
func (h *ProjectHandler) GetProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectRepo.GetAll()
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to fetch projects", err)
		return
	}
	json.NewEncoder(w).Encode(projects)
}

// GetProject godoc
// @Summary Get a project by ID
// @Description Get a single project by its ID
// @Tags projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Success 200 {object} models.Project
// @Failure 400 {object} string "Invalid project ID"
// @Failure 404 {object} string "Project not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /projects/{id} [get]
func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	project, err := h.projectRepo.GetByID(id)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to fetch project", err)
		return
	}
	if project == nil {
		utils.RespondWithError(w, http.StatusNotFound, "Project not found", nil)
		return
	}

	json.NewEncoder(w).Encode(project)
}

// CreateProject godoc
// @Summary Create a new project
// @Description Create a new project
// @Tags projects
// @Accept json
// @Produce json
// @Param project body models.Project true "Project object"
// @Success 201 {object} models.Project
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /projects [post]
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var project models.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid project data", err)
		return
	}

	id, err := h.projectRepo.Create(project)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create project", err)
		return
	}
	project.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

// UpdateProject godoc
// @Summary Update a project
// @Description Update an existing project's information
// @Tags projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Param project body models.Project true "Project object"
// @Success 200 {object} models.Project
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /projects/{id} [put]
func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	var project models.Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid project data", err)
		return
	}
	project.ID = id

	err = h.projectRepo.Update(project)
	if err != nil {
		if err.Error() == "project not found" {
			utils.RespondWithError(w, http.StatusNotFound, "Project not found", err)
			return
		}
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update project", err)
		return
	}

	json.NewEncoder(w).Encode(project)
}

// DeleteProject godoc
// @Summary Delete a project
// @Description Delete a project by ID
// @Tags projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /projects/{id} [delete]
func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid project ID", err)
		return
	}

	err = h.projectRepo.Delete(id)
	if err != nil {
		if err.Error() == "project not found" {
			utils.RespondWithError(w, http.StatusNotFound, "Project not found", err)
			return
		}
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete project", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
