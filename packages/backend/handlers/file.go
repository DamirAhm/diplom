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

	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll(h.uploadsDir, 0755); err != nil {
		http.Error(w, "Error creating uploads directory", http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	filename := filepath.Join(h.uploadsDir, header.Filename)

	// Create new file
	dst, err := os.Create(filename)
	if err != nil {
		http.Error(w, "Error creating file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file contents
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	// Return the file path
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": "/" + filename,
	})
}

func (h *FileHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	// Get the file path from the URL
	filePath := r.URL.Path[1:] // Remove leading slash

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Serve the file
	http.ServeFile(w, r, filePath)
}
