package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type FileHandler struct {
	uploadsDir string
}

func NewFileHandler() *FileHandler {
	return &FileHandler{
		uploadsDir: "uploads",
	}
}

func (h *FileHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if err := os.MkdirAll(h.uploadsDir, 0755); err != nil {
		http.Error(w, "Error creating uploads directory", http.StatusInternalServerError)
		return
	}

	filename := filepath.Join(h.uploadsDir, header.Filename)

	dst, err := os.Create(filename)
	if err != nil {
		http.Error(w, "Error creating file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": "/" + filename,
	})
}

func (h *FileHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	filePath := r.URL.Path[1:]

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, filePath)
}
