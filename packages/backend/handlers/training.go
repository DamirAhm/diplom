package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/damirahm/diplom/backend/models"
	"github.com/damirahm/diplom/backend/repository"
	"github.com/gorilla/mux"
)

type TrainingHandler struct {
	trainingMaterialRepo repository.TrainingMaterialRepo
}

func NewTrainingHandler(tr repository.TrainingMaterialRepo) *TrainingHandler {
	return &TrainingHandler{trainingMaterialRepo: tr}
}

// GetTrainingMaterials godoc
// @Summary Get all training materials
// @Description Get a list of all training materials
// @Tags training
// @Accept json
// @Produce json
// @Success 200 {array} models.TrainingMaterial
// @Failure 500 {object} string "Internal Server Error"
// @Router /training [get]
func (h *TrainingHandler) GetTrainingMaterials(w http.ResponseWriter, r *http.Request) {
	materials, err := h.trainingMaterialRepo.GetAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(materials)
}

// GetTrainingMaterial godoc
// @Summary Get a training material by ID
// @Description Get a single training material by its ID
// @Tags training
// @Accept json
// @Produce json
// @Param id path int true "Training Material ID"
// @Success 200 {object} models.TrainingMaterial
// @Failure 400 {object} string "Invalid training material ID"
// @Failure 404 {object} string "Training material not found"
// @Failure 500 {object} string "Internal Server Error"
// @Router /training/{id} [get]
func (h *TrainingHandler) GetTrainingMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid training material ID", http.StatusBadRequest)
		return
	}

	material, err := h.trainingMaterialRepo.GetByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if material == nil {
		http.Error(w, "Training material not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(material)
}

// CreateTrainingMaterial godoc
// @Summary Create a new training material
// @Description Create a new training material
// @Tags training
// @Accept json
// @Produce json
// @Param material body models.TrainingMaterial true "Training Material object"
// @Success 201 {object} models.TrainingMaterial
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /training [post]
func (h *TrainingHandler) CreateTrainingMaterial(w http.ResponseWriter, r *http.Request) {
	var material models.TrainingMaterial
	if err := json.NewDecoder(r.Body).Decode(&material); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.trainingMaterialRepo.Create(material)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	material.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(material)
}

// UpdateTrainingMaterial godoc
// @Summary Update a training material
// @Description Update an existing training material's information
// @Tags training
// @Accept json
// @Produce json
// @Param id path int true "Training Material ID"
// @Param material body models.TrainingMaterial true "Training Material object"
// @Success 200 {object} models.TrainingMaterial
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /training/{id} [put]
func (h *TrainingHandler) UpdateTrainingMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid training material ID", http.StatusBadRequest)
		return
	}

	var material models.TrainingMaterial
	if err := json.NewDecoder(r.Body).Decode(&material); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	material.ID = id

	err = h.trainingMaterialRepo.Update(material)
	if err != nil {
		if err.Error() == "training material not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(material)
}

// DeleteTrainingMaterial godoc
// @Summary Delete a training material
// @Description Delete a training material by ID
// @Tags training
// @Accept json
// @Produce json
// @Param id path int true "Training Material ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "Not Found"
// @Failure 500 {string} string "Internal Server Error"
// @Router /training/{id} [delete]
func (h *TrainingHandler) DeleteTrainingMaterial(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid training material ID", http.StatusBadRequest)
		return
	}

	err = h.trainingMaterialRepo.Delete(id)
	if err != nil {
		if err.Error() == "training material not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
