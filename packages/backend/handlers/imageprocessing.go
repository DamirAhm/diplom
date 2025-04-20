package handlers

import (
	"encoding/json"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"math"
	"math/rand"
	"net/http"
	"path/filepath"
	"sync"
	"time"
)

// SuperpixelRequest represents the parameters for the superpixel processing
type SuperpixelRequest struct {
	NumberOfSuperpixels int     `json:"numberOfSuperpixels"`
	CompactnessFactor   float64 `json:"compactnessFactor"`
	Elongation          float64 `json:"elongation"` // p parameter in the formula
	Iterations          int     `json:"iterations"`
	GridSize            int     `json:"gridSize"`       // Size of the gradient vector grid
	AdaptiveFactor      float64 `json:"adaptiveFactor"` // Controls adaptive distribution (0.0-1.0), 0 = regular grid only
}

// Stroke represents a single brush stroke with its properties
type Stroke struct {
	ID             int      `json:"id"` // Cluster ID
	CenterX        float64  `json:"centerX"`
	CenterY        float64  `json:"centerY"`
	Color          [3]uint8 `json:"color"`          // RGB color
	Pixels         [][2]int `json:"pixels"`         // Array of [x,y] coordinates belonging to this stroke
	Theta          float64  `json:"theta"`          // Orientation angle
	Width          float64  `json:"width"`          // Approximate width of the stroke
	Height         float64  `json:"height"`         // Approximate height of the stroke
	ThetaCoherence float64  `json:"thetaCoherence"` // Coherence of pixel orientations within the cluster (0-1)
	MinX           int      `json:"minX"`           // Bounding box min X
	MinY           int      `json:"minY"`           // Bounding box min Y
	MaxX           int      `json:"maxX"`           // Bounding box max X
	MaxY           int      `json:"maxY"`           // Bounding box max Y
}

// GridVector represents a vector in a grid for gradient visualization
type GridVector struct {
	X      int     `json:"x"`      // X coordinate
	Y      int     `json:"y"`      // Y coordinate
	Theta  float64 `json:"theta"`  // Direction angle
	Length float64 `json:"length"` // Vector length (based on gradient magnitude)
}

// SuperpixelResponse represents the result of superpixel processing
type SuperpixelResponse struct {
	ImageWidth    int          `json:"imageWidth"`
	ImageHeight   int          `json:"imageHeight"`
	Strokes       []Stroke     `json:"strokes"`
	GridVectors   []GridVector `json:"gridVectors"`   // Grid of vectors for gradient visualization
	GradientDebug [][]float64  `json:"gradientDebug"` // Debug visualization of color gradients
}

// ImageProcessingHandler handles image processing operations
type ImageProcessingHandler struct {
	uploadDir string
}

// NewImageProcessingHandler creates a new image processing handler
func NewImageProcessingHandler(uploadDir string) *ImageProcessingHandler {
	return &ImageProcessingHandler{uploadDir: uploadDir}
}

// ProcessSuperpixels handles the superpixel processing request
func (h *ImageProcessingHandler) ProcessSuperpixels(w http.ResponseWriter, r *http.Request) {
	// Initialize random seed for reproducible results
	rand.Seed(time.Now().UnixNano())

	// Parse multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Get parameters
	var req SuperpixelRequest
	paramJSON := r.FormValue("params")
	if err := json.Unmarshal([]byte(paramJSON), &req); err != nil {
		http.Error(w, "Invalid parameters: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Установка значения по умолчанию для размера сетки, если не указан
	if req.GridSize <= 0 {
		req.GridSize = 20
	}

	// Установка значения по умолчанию для адаптивного фактора
	if req.AdaptiveFactor < 0 || req.AdaptiveFactor > 1.0 {
		req.AdaptiveFactor = 0.5
	}

	// Get image file
	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Failed to get image file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Decode image
	var img image.Image
	ext := filepath.Ext(header.Filename)
	switch ext {
	case ".jpg", ".jpeg":
		img, err = jpeg.Decode(file)
	case ".png":
		img, err = png.Decode(file)
	default:
		http.Error(w, "Unsupported image format", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "Failed to decode image: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Prepare the image for processing
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	labImg, _ := h.preprocessImage(img)

	// Calculate color gradients for visualization
	colorGradients := h.calculateColorGradients(labImg, width, height)

	// Normalize gradients for visualization (0.0-1.0 range)
	normalizedGradients := h.normalizeGradientsForVisualization(colorGradients, width, height)

	// Process image with modified SLIC algorithm and extract stroke data
	strokes := h.extractStrokeData(img, req.NumberOfSuperpixels, req.CompactnessFactor, req.Elongation, req.Iterations, req.AdaptiveFactor)

	// Создаем сетку векторов с указанным размером
	gridVectors := h.createGradientGrid(img, req.GridSize)

	// Return stroke data
	resp := SuperpixelResponse{
		ImageWidth:    width,
		ImageHeight:   height,
		Strokes:       strokes,
		GridVectors:   gridVectors,
		GradientDebug: normalizedGradients,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// Pixel represents a pixel with its coordinates and lab color
type Pixel struct {
	X, Y      int
	L, A, B   float64
	Theta     float64 // Gradient direction
	GradientX float64
	GradientY float64
}

// Cluster represents a superpixel cluster
type Cluster struct {
	CenterX, CenterY float64
	L, A, B          float64
	Theta            float64 // Average gradient direction
	Pixels           []Pixel
}

// calculateStructureTensor вычисляет структурный тензор изображения и его собственные векторы
func (h *ImageProcessingHandler) calculateStructureTensor(img image.Image) ([][]float64, [][]float64, [][]float64) {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Подготавливаем изображение - конвертируем в градации серого
	grayImg := make([][]float64, height)
	for y := 0; y < height; y++ {
		grayImg[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			// Преобразуем в яркость
			grayImg[y][x] = 0.2126*float64(r)/65535.0 + 0.7152*float64(g)/65535.0 + 0.0722*float64(b)/65535.0
		}
	}

	// Применяем предварительное размытие по Гауссу к изображению для уменьшения шума
	grayImg = h.applyGaussianSmoothing(grayImg, width, height)

	// Вычисляем градиенты с помощью оператора Собеля
	gradX := make([][]float64, height)
	gradY := make([][]float64, height)

	for y := 0; y < height; y++ {
		gradX[y] = make([]float64, width)
		gradY[y] = make([]float64, width)
	}

	// Оператор Собеля для X и Y направлений
	kernelX := [][]float64{
		{-1, 0, 1},
		{-2, 0, 2},
		{-1, 0, 1},
	}
	kernelY := [][]float64{
		{-1, -2, -1},
		{0, 0, 0},
		{1, 2, 1},
	}

	// Вычисляем градиенты для всего изображения
	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			sumX, sumY := 0.0, 0.0

			for ky := -1; ky <= 1; ky++ {
				for kx := -1; kx <= 1; kx++ {
					sumX += grayImg[y+ky][x+kx] * kernelX[ky+1][kx+1]
					sumY += grayImg[y+ky][x+kx] * kernelY[ky+1][kx+1]
				}
			}

			gradX[y][x] = sumX
			gradY[y][x] = sumY
		}
	}

	// Создаем тензорное поле структуры
	tensorA := make([][]float64, height)
	tensorB := make([][]float64, height)
	tensorC := make([][]float64, height)

	for y := 0; y < height; y++ {
		tensorA[y] = make([]float64, width)
		tensorB[y] = make([]float64, width)
		tensorC[y] = make([]float64, width)
	}

	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			// Создаем тензорное поле структуры (матрица 2x2)
			gx := gradX[y][x]
			gy := gradY[y][x]

			// A = Gx*Gx, B = Gx*Gy, C = Gy*Gy
			tensorA[y][x] = gx * gx
			tensorB[y][x] = gx * gy
			tensorC[y][x] = gy * gy
		}
	}

	// Применяем сглаживание к тензорному полю с помощью гауссова фильтра
	// Несколько проходов сглаживания для лучшей связности
	for i := 0; i < 3; i++ {
		tensorA = h.applyGaussianSmoothing(tensorA, width, height)
		tensorB = h.applyGaussianSmoothing(tensorB, width, height)
		tensorC = h.applyGaussianSmoothing(tensorC, width, height)
	}

	// Вычисляем собственные векторы и собственные значения
	majorVectorX := make([][]float64, height)
	majorVectorY := make([][]float64, height)
	coherence := make([][]float64, height)

	for y := 0; y < height; y++ {
		majorVectorX[y] = make([]float64, width)
		majorVectorY[y] = make([]float64, width)
		coherence[y] = make([]float64, width)
	}

	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			a := tensorA[y][x]
			b := tensorB[y][x]
			c := tensorC[y][x]

			// Вычисляем собственные значения
			// λ1,2 = (A + C ± sqrt((A-C)² + 4B²))/2
			discriminant := math.Sqrt(math.Max(0, (a-c)*(a-c)+4*b*b))
			lambda1 := (a + c + discriminant) / 2
			lambda2 := (a + c - discriminant) / 2

			// Вычисляем когерентность (меру анизотропии)
			if lambda1+lambda2 > 1e-10 {
				coherence[y][x] = (lambda1 - lambda2) / (lambda1 + lambda2)
			} else {
				coherence[y][x] = 0
			}

			// Вычисляем собственный вектор для наибольшего собственного значения
			// Этот вектор указывает направление максимального изменения (перпендикулярно границе)
			if math.Abs(b) < 1e-10 {
				// Если B близко к нулю, собственный вектор (1,0) или (0,1)
				if a >= c {
					majorVectorX[y][x] = 1
					majorVectorY[y][x] = 0
				} else {
					majorVectorX[y][x] = 0
					majorVectorY[y][x] = 1
				}
			} else {
				// Иначе используем формулу для собственного вектора
				majorVectorX[y][x] = lambda1 - c
				majorVectorY[y][x] = b

				// Нормализуем вектор
				length := math.Sqrt(majorVectorX[y][x]*majorVectorX[y][x] + majorVectorY[y][x]*majorVectorY[y][x])
				if length > 1e-10 {
					majorVectorX[y][x] /= length
					majorVectorY[y][x] /= length
				}
			}
		}
	}

	// Сглаживаем векторное поле для устранения локальных флуктуаций
	for i := 0; i < 2; i++ {
		majorVectorX = h.smoothVector(majorVectorX, width, height)
		majorVectorY = h.smoothVector(majorVectorY, width, height)
	}

	return majorVectorX, majorVectorY, coherence
}

// extractStrokeData processes the image and returns stroke data for frontend rendering
func (h *ImageProcessingHandler) extractStrokeData(img image.Image, numberOfSuperpixels int, compactness float64, elongation float64, iterations int, adaptiveFactor float64) []Stroke {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Вычисляем структурный тензор изображения и получаем поле направлений
	// Используем тот же код для вычисления тензорного поля, что и в createGradientGrid
	majorVectorX, majorVectorY, _ := h.calculateStructureTensor(img)

	// Convert image to LAB color space
	labImg, _ := h.preprocessImage(img)

	// Initialize clusters with adaptive factor
	clusters := h.initializeClustersWithAdaptive(labImg, nil, numberOfSuperpixels, width, height, majorVectorX, majorVectorY, adaptiveFactor)

	// Compute S - the grid interval (approximately equal to sqrt(N/k))
	S := int(math.Sqrt(float64(width*height) / float64(numberOfSuperpixels)))

	// Assign pixels to nearest cluster
	labels := make([][]int, height)
	for i := range labels {
		labels[i] = make([]int, width)
		for j := range labels[i] {
			labels[i][j] = -1
		}
	}

	distances := make([][]float64, height)
	for i := range distances {
		distances[i] = make([]float64, width)
		for j := range distances[i] {
			distances[i][j] = math.Inf(1)
		}
	}

	// Iterate
	for iter := 0; iter < iterations; iter++ {
		// Reset cluster pixels
		for i := range clusters {
			clusters[i].Pixels = nil
		}

		// For each cluster
		var wg sync.WaitGroup
		for i := range clusters {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				c := &clusters[i]

				// Search in a 2S x 2S region
				startX := int(math.Max(0, c.CenterX-float64(S)))
				endX := int(math.Min(float64(width-1), c.CenterX+float64(S)))
				startY := int(math.Max(0, c.CenterY-float64(S)))
				endY := int(math.Min(float64(height-1), c.CenterY+float64(S)))

				for y := startY; y <= endY; y++ {
					for x := startX; x <= endX; x++ {
						// Modified distance calculation using the formula from the image
						// X^2 + (pY)^2 ≤ d^2; p > 1
						// Transform coordinates to align with gradient direction
						dx := float64(x) - c.CenterX
						dy := float64(y) - c.CenterY

						// Rotate coordinates to align with theta
						X := dx*math.Cos(c.Theta) + dy*math.Sin(c.Theta)
						Y := -dx*math.Sin(c.Theta) + dy*math.Cos(c.Theta)

						// Apply elongation factor p to Y component
						spatialDist := math.Sqrt(X*X + (elongation*Y)*(elongation*Y))

						// Color distance in LAB space
						l, a, b := rgbToLab(img.At(x, y))
						colorDist := math.Sqrt(
							(l-c.L)*(l-c.L) +
								(a-c.A)*(a-c.A) +
								(b-c.B)*(b-c.B),
						)

						// Combined distance with compactness factor
						dist := 4*colorDist*colorDist + compactness*spatialDist/float64(S)

						// Update if this distance is smaller
						if dist < distances[y][x] {
							distances[y][x] = dist
							labels[y][x] = i
						}
					}
				}
			}(i)
		}
		wg.Wait()

		// Update cluster centers
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if labels[y][x] >= 0 {
					// Add this pixel to the corresponding cluster
					l, a, b := rgbToLab(img.At(x, y))

					// Важно: используем тот же самый метод вычисления угла, что и в createGradientGrid
					// Получаем перпендикулярный вектор (вдоль структуры)
					var theta float64
					if x >= 2 && x < width-2 && y >= 2 && y < height-2 {
						perpX := -majorVectorY[y][x] // Поворачиваем на 90 градусов
						perpY := majorVectorX[y][x]
						theta = math.Atan2(perpY, perpX)
					} else {
						// Для граничных случаев
						theta = 0.0
					}

					pixel := Pixel{
						X:     x,
						Y:     y,
						L:     l,
						A:     a,
						B:     b,
						Theta: theta,
					}
					clusters[labels[y][x]].Pixels = append(clusters[labels[y][x]].Pixels, pixel)
				}
			}
		}

		// Recalculate cluster centers
		for i := range clusters {
			if len(clusters[i].Pixels) == 0 {
				continue
			}

			sumX, sumY, sumL, sumA, sumB := 0.0, 0.0, 0.0, 0.0, 0.0

			// Для направления используем другой подход
			// Усредняем компоненты направления, а не сами углы
			sumCosTheta, sumSinTheta := 0.0, 0.0

			for _, p := range clusters[i].Pixels {
				sumX += float64(p.X)
				sumY += float64(p.Y)
				sumL += p.L
				sumA += p.A
				sumB += p.B

				// Избегаем проблемы с усреднением углов, используя суммирование векторов
				sumCosTheta += math.Cos(p.Theta)
				sumSinTheta += math.Sin(p.Theta)
			}

			n := float64(len(clusters[i].Pixels))
			clusters[i].CenterX = sumX / n
			clusters[i].CenterY = sumY / n
			clusters[i].L = sumL / n
			clusters[i].A = sumA / n
			clusters[i].B = sumB / n

			// Вычисляем средний угол из компонентов вектора
			clusters[i].Theta = math.Atan2(sumSinTheta, sumCosTheta)
		}
	}

	// После окончания итераций, проверяем наличие незакрашенных пикселей
	// и назначаем их ближайшему кластеру
	hasUnlabeledPixels := false
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if labels[y][x] == -1 {
				hasUnlabeledPixels = true
				break
			}
		}
		if hasUnlabeledPixels {
			break
		}
	}

	// Если найдены незакрашенные пиксели
	if hasUnlabeledPixels {
		// Создаем дополнительную итерацию с увеличенной областью поиска
		// для назначения всех незакрашенных пикселей ближайшему кластеру

		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if labels[y][x] == -1 {
					// Ищем ближайший кластер для этого пикселя
					minDist := math.Inf(1)
					nearestCluster := -1

					for i, c := range clusters {
						// Вычисляем простое евклидово расстояние для поиска ближайшего кластера
						dx := float64(x) - c.CenterX
						dy := float64(y) - c.CenterY
						dist := dx*dx + dy*dy

						if dist < minDist {
							minDist = dist
							nearestCluster = i
						}
					}

					if nearestCluster >= 0 {
						// Назначаем пиксель ближайшему кластеру
						labels[y][x] = nearestCluster

						// Добавляем пиксель в кластер
						l, a, b := rgbToLab(img.At(x, y))
						var theta float64
						if x >= 2 && x < width-2 && y >= 2 && y < height-2 {
							perpX := -majorVectorY[y][x]
							perpY := majorVectorX[y][x]
							theta = math.Atan2(perpY, perpX)
						} else {
							theta = 0.0
						}

						pixel := Pixel{
							X:     x,
							Y:     y,
							L:     l,
							A:     a,
							B:     b,
							Theta: theta,
						}
						clusters[nearestCluster].Pixels = append(clusters[nearestCluster].Pixels, pixel)
					}
				}
			}
		}
	}

	// Convert clusters to strokes
	return h.clustersToStrokes(img, clusters, labels)
}

// clustersToStrokes converts processed clusters to stroke data for rendering
func (h *ImageProcessingHandler) clustersToStrokes(img image.Image, clusters []Cluster, labels [][]int) []Stroke {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	strokes := make([]Stroke, 0, len(clusters))

	for i, cluster := range clusters {
		if len(cluster.Pixels) == 0 {
			continue
		}

		// Convert LAB color to RGB for the stroke
		r, g, b := labToRgb(cluster.L, cluster.A, cluster.B)
		color := [3]uint8{uint8(r * 255), uint8(g * 255), uint8(b * 255)}

		// Collect all pixels belonging to this cluster
		pixels := make([][2]int, 0, len(cluster.Pixels))
		minX, minY := width, height
		maxX, maxY := 0, 0
		sumCosTheta, sumSinTheta := 0.0, 0.0 // Для расчета когерентности
		numPixels := 0.0

		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if labels[y][x] == i {
					pixels = append(pixels, [2]int{x, y})

					// Track bounds of this stroke
					if x < minX {
						minX = x
					}
					if x > maxX {
						maxX = x
					}
					if y < minY {
						minY = y
					}
					if y > maxY {
						maxY = y
					}

					// Суммируем компоненты угла пикселя для расчета когерентности
					// Находим соответствующий пиксель в cluster.Pixels (это не самый эффективный способ, но для отладки пойдет)
					for _, p := range cluster.Pixels {
						if p.X == x && p.Y == y {
							sumCosTheta += math.Cos(p.Theta)
							sumSinTheta += math.Sin(p.Theta)
							numPixels++
							break
						}
					}
				}
			}
		}

		// Calculate approximate width and height of the stroke
		strokeWidth := float64(maxX - minX)
		strokeHeight := float64(maxY - minY)

		// Calculate theta coherence (0-1 range)
		thetaCoherence := 0.0
		if numPixels > 0 {
			// Длина среднего вектора направления
			thetaCoherence = math.Sqrt(sumCosTheta*sumCosTheta+sumSinTheta*sumSinTheta) / numPixels
		}

		// Create the stroke
		stroke := Stroke{
			ID:             i,
			CenterX:        cluster.CenterX,
			CenterY:        cluster.CenterY,
			Color:          color,
			Pixels:         pixels,
			Theta:          cluster.Theta, // Средний угол, рассчитанный ранее
			Width:          strokeWidth,
			Height:         strokeHeight,
			ThetaCoherence: thetaCoherence, // Добавленная когерентность
			MinX:           minX,
			MinY:           minY,
			MaxX:           maxX,
			MaxY:           maxY,
		}

		strokes = append(strokes, stroke)
	}

	// Sort strokes by size (for animation - drawing larger strokes first)
	// This is a simple sort - you could implement a more sophisticated ordering
	// based on stroke size, position, or other factors
	for i := 0; i < len(strokes); i++ {
		for j := i + 1; j < len(strokes); j++ {
			if len(strokes[i].Pixels) < len(strokes[j].Pixels) {
				strokes[i], strokes[j] = strokes[j], strokes[i]
			}
		}
	}

	return strokes
}

// preprocessImage computes gradients and prepares data for SLIC
func (h *ImageProcessingHandler) preprocessImage(img image.Image) ([][]Pixel, [][][]float64) {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Initialize pixel array
	pixels := make([][]Pixel, height)
	for y := 0; y < height; y++ {
		pixels[y] = make([]Pixel, width)
	}

	// Initialize gradient array
	gradients := make([][][]float64, height)
	for y := 0; y < height; y++ {
		gradients[y] = make([][]float64, width)
		for x := 0; x < width; x++ {
			gradients[y][x] = make([]float64, 2) // [gx, gy]
		}
	}

	// First pass: initialize pixels and compute raw gradients
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			l, a, b := rgbToLab(img.At(x, y))

			pixels[y][x] = Pixel{
				X: x,
				Y: y,
				L: l,
				A: a,
				B: b,
			}

			// Calculate gradient if not at border
			if x > 0 && x < width-1 && y > 0 && y < height-1 {
				// Sobel operator for L channel
				gx := (pixels[y-1][x+1].L + 2*pixels[y][x+1].L + pixels[y+1][x+1].L) -
					(pixels[y-1][x-1].L + 2*pixels[y][x-1].L + pixels[y+1][x-1].L)

				gy := (pixels[y+1][x-1].L + 2*pixels[y+1][x].L + pixels[y+1][x+1].L) -
					(pixels[y-1][x-1].L + 2*pixels[y-1][x].L + pixels[y-1][x+1].L)

				pixels[y][x].GradientX = gx
				pixels[y][x].GradientY = gy
				gradients[y][x][0] = gx
				gradients[y][x][1] = gy

				// Compute gradient direction theta (normal to gradient)
				if gx != 0 || gy != 0 {
					// Get perpendicular direction to gradient
					pixels[y][x].Theta = math.Atan2(-gx, gy) // Perpendicular to (gx, gy)
				}
			}
		}
	}

	// Second pass: apply Gaussian smoothing to gradients
	smoothedGradients := h.smoothGradients(pixels, gradients, width, height)

	// Update theta in pixels from smoothed gradients
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if x > 0 && x < width-1 && y > 0 && y < height-1 {
				gx := smoothedGradients[y][x][0]
				gy := smoothedGradients[y][x][1]

				if gx != 0 || gy != 0 {
					// Direction perpendicular to gradient
					pixels[y][x].Theta = math.Atan2(-gx, gy)
				}
			}
		}
	}

	return pixels, smoothedGradients
}

// smoothGradients applies Gaussian smoothing to gradients
func (h *ImageProcessingHandler) smoothGradients(pixels [][]Pixel, rawGradients [][][]float64, width, height int) [][][]float64 {
	// Gaussian kernel 5x5
	kernel := [][]float64{
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{7.0 / 273, 26.0 / 273, 41.0 / 273, 26.0 / 273, 7.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
	}

	smoothedGradients := make([][][]float64, height)
	for y := 0; y < height; y++ {
		smoothedGradients[y] = make([][]float64, width)
		for x := 0; x < width; x++ {
			smoothedGradients[y][x] = make([]float64, 2) // [gx, gy]
		}
	}

	// Apply convolution with kernel
	kernelSize := 5
	halfKernel := kernelSize / 2

	for y := halfKernel; y < height-halfKernel; y++ {
		for x := halfKernel; x < width-halfKernel; x++ {
			sumGx, sumGy := 0.0, 0.0

			for ky := -halfKernel; ky <= halfKernel; ky++ {
				for kx := -halfKernel; kx <= halfKernel; kx++ {
					gx := rawGradients[y+ky][x+kx][0]
					gy := rawGradients[y+ky][x+kx][1]
					k := kernel[ky+halfKernel][kx+halfKernel]

					sumGx += gx * k
					sumGy += gy * k
				}
			}

			smoothedGradients[y][x][0] = sumGx
			smoothedGradients[y][x][1] = sumGy
		}
	}

	return smoothedGradients
}

// initializeClustersWithAdaptive initializes the superpixel clusters with adaptive distribution
func (h *ImageProcessingHandler) initializeClustersWithAdaptive(pixels [][]Pixel, gradients [][][]float64, numberOfSuperpixels int, width, height int, majorVectorX, majorVectorY [][]float64, adaptiveFactor float64) []Cluster {
	// Calculate color gradient magnitude map for adaptive clustering
	colorGradients := h.calculateColorGradients(pixels, width, height)

	// Усиливаем влияние градиента, применяя степенную функцию
	// power > 1 увеличивает контраст между областями с высоким и низким градиентом
	power := 2.5

	// Находим максимальное значение градиента для нормализации
	maxGradient := 0.0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if colorGradients[y][x] > maxGradient {
				maxGradient = colorGradients[y][x]
			}
		}
	}

	// Избегаем деления на ноль
	if maxGradient < 0.001 {
		maxGradient = 0.001
	}

	// Улучшаем чувствительность градиента
	enhancedGradients := make([][]float64, height)
	for y := 0; y < height; y++ {
		enhancedGradients[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			// Нормализуем и усиливаем градиент
			normalized := colorGradients[y][x] / maxGradient
			enhancedGradients[y][x] = math.Pow(normalized, power)
		}
	}

	// Compute grid interval for base grid
	// Увеличиваем долю кластеров для регулярной сетки, чтобы обеспечить полное покрытие
	// При adaptiveFactor = 1.0, примерно 40% кластеров будут в регулярной сетке, 60% - адаптивные
	baseGridSuperpixels := numberOfSuperpixels

	if adaptiveFactor > 0 {
		baseGridPercentage := 0.9 - adaptiveFactor*0.5 // от 90% до 40% в зависимости от адаптивного фактора
		baseGridSuperpixels = int(float64(numberOfSuperpixels) * baseGridPercentage)
		if baseGridSuperpixels < numberOfSuperpixels/3 {
			baseGridSuperpixels = numberOfSuperpixels / 3 // Минимум 1/3 от общего числа для базовой сетки
		}
	}

	S := int(math.Sqrt(float64(width*height) / float64(baseGridSuperpixels)))

	// Initialize clusters on a jittered regular grid
	clusters := []Cluster{}
	jitterFactor := float64(S) * 0.3 // Allow up to 30% jitter

	// First pass: Initialize with jittered grid to ensure coverage
	for y := S / 2; y < height; y += S {
		for x := S / 2; x < width; x += S {
			// Add jitter to the grid position
			jitterX := int(rand.Float64()*jitterFactor*2 - jitterFactor)
			jitterY := int(rand.Float64()*jitterFactor*2 - jitterFactor)

			// Ensure jittered position is within bounds
			posX := x + jitterX
			posY := y + jitterY

			if posX < 0 {
				posX = 0
			} else if posX >= width {
				posX = width - 1
			}

			if posY < 0 {
				posY = 0
			} else if posY >= height {
				posY = height - 1
			}

			// Find local minimum gradient in 3x3 neighborhood to place cluster
			minGradient := math.Inf(1)
			minX, minY := posX, posY

			for ny := -1; ny <= 1; ny++ {
				for nx := -1; nx <= 1; nx++ {
					newX, newY := posX+nx, posY+ny

					if newX >= 0 && newX < width && newY >= 0 && newY < height {
						var g float64

						if gradients != nil {
							// Если доступны градиенты из preprocessImage, используем их
							gx := gradients[newY][newX][0]
							gy := gradients[newY][newX][1]
							g = gx*gx + gy*gy
						} else if majorVectorX != nil && majorVectorY != nil {
							// Если доступны компоненты векторов из тензорного поля, используем их
							vx := majorVectorX[newY][newX]
							vy := majorVectorY[newY][newX]
							g = 1.0 - (vx*vx + vy*vy) // Инвертируем для поиска минимума в местах с максимальной согласованностью
						} else {
							// Используем простой подход из оригинального кода
							g = 1.0 // Значение по умолчанию
						}

						if g < minGradient {
							minGradient = g
							minX, minY = newX, newY
						}
					}
				}
			}

			// Create cluster at local minimum
			var theta float64
			var l, a, b float64

			if pixels != nil && minY < len(pixels) && minX < len(pixels[minY]) {
				// Используем данные из подготовленных пикселей
				theta = pixels[minY][minX].Theta
				l = pixels[minY][minX].L
				a = pixels[minY][minX].A
				b = pixels[minY][minX].B
			} else {
				// Если предобработанные пиксели не доступны
				if majorVectorX != nil && majorVectorY != nil && minX > 0 && minX < width-1 && minY > 0 && minY < height-1 {
					// Используем направление из тензорного поля
					vx := majorVectorX[minY][minX]
					vy := majorVectorY[minY][minX]
					perpX := -vy // Перпендикулярный вектор
					perpY := vx
					theta = math.Atan2(perpY, perpX)
				} else {
					// Значение по умолчанию
					theta = 0.0
				}

				// Если нет LAB значений, вычисляем из RGB
				if minY < len(pixels) && minX < len(pixels[minY]) {
					l = pixels[minY][minX].L
					a = pixels[minY][minX].A
					b = pixels[minY][minX].B
				} else {
					// Просто используем чёрный цвет, если все другие методы недоступны
					l, a, b = 0, 0, 0
				}
			}

			clusters = append(clusters, Cluster{
				CenterX: float64(minX),
				CenterY: float64(minY),
				L:       l,
				A:       a,
				B:       b,
				Theta:   theta,
			})
		}
	}

	// Second pass: Add additional clusters in high-gradient areas if adaptive clustering is enabled
	if adaptiveFactor > 0 && len(enhancedGradients) > 0 {
		// Determine number of additional clusters to add
		additionalClusters := numberOfSuperpixels - len(clusters)

		if additionalClusters > 0 {
			// Create gradient-weighted probability distribution
			// Нормализуем улучшенные градиенты для вероятностного распределения
			totalGradient := 0.0
			for y := 0; y < height; y++ {
				for x := 0; x < width; x++ {
					totalGradient += enhancedGradients[y][x]
				}
			}

			// Создаем кумулятивное распределение с улучшенной чувствительностью
			cumGradient := make([]float64, width*height)
			idx := 0
			cumSum := 0.0

			for y := 0; y < height; y++ {
				for x := 0; x < width; x++ {
					cumSum += enhancedGradients[y][x] / totalGradient
					cumGradient[idx] = cumSum
					idx++
				}
			}

			// Вычисляем минимальное расстояние между кластерами
			// Уменьшаем расстояние в зависимости от адаптивного фактора (более высокий фактор = более плотное размещение)
			minDistFactor := 0.7 - adaptiveFactor*0.4 // От 0.7 до 0.3 мин. расстояния
			minDistMultiplier := math.Max(0.3, minDistFactor)

			// Probabilistically select additional cluster centers based on gradient magnitude
			for i := 0; i < additionalClusters; i++ {
				// Generate random value between 0 and 1
				r := rand.Float64()

				// Find corresponding position in cumulative distribution
				selectedIdx := 0
				for j := 0; j < len(cumGradient); j++ {
					if r <= cumGradient[j] {
						selectedIdx = j
						break
					}
				}

				// Convert linear index back to x,y
				selectedY := selectedIdx / width
				selectedX := selectedIdx % width

				// Skip if this position is too close to existing clusters
				// Расстояние зависит от градиента - в областях с высоким градиентом разрешаем более плотное размещение
				tooClose := false

				// Получаем значение градиента в выбранной точке для адаптивного минимального расстояния
				gradientValue := enhancedGradients[selectedY][selectedX]
				// Коэффициент, уменьшающий минимальное расстояние в областях с высоким градиентом
				gradientEffect := math.Max(0.5, 1.0-gradientValue)

				minDistance := float64(S) * minDistMultiplier * gradientEffect

				for _, cluster := range clusters {
					dx := float64(selectedX) - cluster.CenterX
					dy := float64(selectedY) - cluster.CenterY
					dist := math.Sqrt(dx*dx + dy*dy)

					if dist < minDistance {
						tooClose = true
						break
					}
				}

				if tooClose {
					// Try again with different random value
					i--
					continue
				}

				// Create cluster at selected position
				var theta float64
				var l, a, b float64

				if pixels != nil && selectedY < len(pixels) && selectedX < len(pixels[selectedY]) {
					theta = pixels[selectedY][selectedX].Theta
					l = pixels[selectedY][selectedX].L
					a = pixels[selectedY][selectedX].A
					b = pixels[selectedY][selectedX].B
				} else {
					if majorVectorX != nil && majorVectorY != nil &&
						selectedX > 0 && selectedX < width-1 &&
						selectedY > 0 && selectedY < height-1 {
						vx := majorVectorX[selectedY][selectedX]
						vy := majorVectorY[selectedY][selectedX]
						perpX := -vy
						perpY := vx
						theta = math.Atan2(perpY, perpX)
					} else {
						theta = 0.0
					}

					if selectedY < len(pixels) && selectedX < len(pixels[selectedY]) {
						l = pixels[selectedY][selectedX].L
						a = pixels[selectedY][selectedX].A
						b = pixels[selectedY][selectedX].B
					} else {
						l, a, b = 0, 0, 0
					}
				}

				clusters = append(clusters, Cluster{
					CenterX: float64(selectedX),
					CenterY: float64(selectedY),
					L:       l,
					A:       a,
					B:       b,
					Theta:   theta,
				})
			}
		}
	}

	return clusters
}

// initializeClusters initializes the superpixel clusters (for backward compatibility)
func (h *ImageProcessingHandler) initializeClusters(pixels [][]Pixel, gradients [][][]float64, numberOfSuperpixels int, width, height int, majorVectorX, majorVectorY [][]float64) []Cluster {
	// For backward compatibility, use the adaptive implementation with default adaptive factor
	return h.initializeClustersWithAdaptive(pixels, gradients, numberOfSuperpixels, width, height, majorVectorX, majorVectorY, 0.5)
}

// calculateColorGradients computes the color gradient magnitude at each pixel
func (h *ImageProcessingHandler) calculateColorGradients(pixels [][]Pixel, width, height int) [][]float64 {
	if pixels == nil || len(pixels) == 0 {
		return nil
	}

	// Создаем временную матрицу для хранения сглаженных L*a*b* значений
	smoothedL := make([][]float64, height)
	smoothedA := make([][]float64, height)
	smoothedB := make([][]float64, height)

	for y := 0; y < height; y++ {
		smoothedL[y] = make([]float64, width)
		smoothedA[y] = make([]float64, width)
		smoothedB[y] = make([]float64, width)

		// Заполняем матрицы исходными значениями
		for x := 0; x < width; x++ {
			if y < len(pixels) && x < len(pixels[y]) {
				smoothedL[y][x] = pixels[y][x].L
				smoothedA[y][x] = pixels[y][x].A
				smoothedB[y][x] = pixels[y][x].B
			}
		}
	}

	// Применяем гауссовское размытие к каждому каналу L*a*b* перед вычислением градиента
	smoothedL = h.applyGaussianSmoothing(smoothedL, width, height)
	smoothedA = h.applyGaussianSmoothing(smoothedA, width, height)
	smoothedB = h.applyGaussianSmoothing(smoothedB, width, height)

	gradients := make([][]float64, height)
	for y := 0; y < height; y++ {
		gradients[y] = make([]float64, width)
	}

	// Compute color gradient magnitudes using smoothed L*a*b* differences
	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			// Horizontal gradient using smoothed values
			dLdx := smoothedL[y][x+1] - smoothedL[y][x-1]
			dAdx := smoothedA[y][x+1] - smoothedA[y][x-1]
			dBdx := smoothedB[y][x+1] - smoothedB[y][x-1]

			// Vertical gradient using smoothed values
			dLdy := smoothedL[y+1][x] - smoothedL[y-1][x]
			dAdy := smoothedA[y+1][x] - smoothedA[y-1][x]
			dBdy := smoothedB[y+1][x] - smoothedB[y-1][x]

			// Gradient magnitude (Euclidean distance in LAB space)
			gradX := math.Sqrt(dLdx*dLdx + dAdx*dAdx + dBdx*dBdx)
			gradY := math.Sqrt(dLdy*dLdy + dAdy*dAdy + dBdy*dBdy)

			// Overall gradient magnitude
			gradients[y][x] = math.Sqrt(gradX*gradX + gradY*gradY)
		}
	}

	// Apply additional Gaussian smoothing to the gradient map for better coherence
	return h.applyGaussianSmoothing(gradients, width, height)
}

// rgbToLab converts RGB color to LAB color space
func rgbToLab(c color.Color) (float64, float64, float64) {
	r, g, b, _ := c.RGBA()
	// Convert to 0-1 range
	rf, gf, bf := float64(r)/65535.0, float64(g)/65535.0, float64(b)/65535.0

	// RGB to XYZ
	rf = pivotRgb(rf)
	gf = pivotRgb(gf)
	bf = pivotRgb(bf)

	x := 0.4124*rf + 0.3576*gf + 0.1805*bf
	y := 0.2126*rf + 0.7152*gf + 0.0722*bf
	z := 0.0193*rf + 0.1192*gf + 0.9505*bf

	// XYZ to LAB
	x = pivotXyz(x / 0.95047)
	y = pivotXyz(y / 1.00000)
	z = pivotXyz(z / 1.08883)

	l := 116*y - 16
	a := 500 * (x - y)
	bValue := 200 * (y - z)

	return l, a, bValue
}

// labToRgb converts LAB color to RGB
func labToRgb(l, a, b float64) (float64, float64, float64) {
	// LAB to XYZ
	y := (l + 16) / 116
	x := a/500 + y
	z := y - b/200

	x = 0.95047 * unpivotXyz(x)
	y = 1.00000 * unpivotXyz(y)
	z = 1.08883 * unpivotXyz(z)

	// XYZ to RGB
	r := 3.2406*x - 1.5372*y - 0.4986*z
	g := -0.9689*x + 1.8758*y + 0.0415*z
	b = 0.0557*x - 0.2040*y + 1.0570*z

	r = unpivotRgb(r)
	g = unpivotRgb(g)
	b = unpivotRgb(b)

	return math.Max(0, math.Min(1, r)), math.Max(0, math.Min(1, g)), math.Max(0, math.Min(1, b))
}

func pivotRgb(n float64) float64 {
	if n > 0.04045 {
		return math.Pow((n+0.055)/1.055, 2.4)
	}
	return n / 12.92
}

func unpivotRgb(n float64) float64 {
	if n > 0.0031308 {
		return 1.055*math.Pow(n, 1/2.4) - 0.055
	}
	return 12.92 * n
}

func pivotXyz(n float64) float64 {
	if n > 0.008856 {
		return math.Pow(n, 1.0/3.0)
	}
	return (903.3*n + 16) / 116
}

func unpivotXyz(n float64) float64 {
	if n*n*n > 0.008856 {
		return n * n * n
	}
	return (n*116 - 16) / 903.3
}

// createGradientGrid создает сетку векторов направлений градиентов для визуализации
func (h *ImageProcessingHandler) createGradientGrid(img image.Image, gridSize int) []GridVector {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Вычисляем структурный тензор и получаем поле направлений
	// Используем тот же самый метод, что и в extractStrokeData
	majorVectorX, majorVectorY, coherence := h.calculateStructureTensor(img)

	// Определяем шаг сетки
	stepX := width / gridSize
	stepY := height / gridSize

	if stepX < 1 {
		stepX = 1
	}
	if stepY < 1 {
		stepY = 1
	}

	// Формируем сетку векторов, усредняя направления в каждой клетке
	vectors := make([]GridVector, 0, gridSize*gridSize)

	for cellY := 0; cellY < gridSize; cellY++ {
		for cellX := 0; cellX < gridSize; cellX++ {
			// Определяем границы текущей клетки
			startX := cellX * stepX
			endX := (cellX + 1) * stepX
			if endX > width {
				endX = width
			}

			startY := cellY * stepY
			endY := (cellY + 1) * stepY
			if endY > height {
				endY = height
			}

			// Пропускаем клетки, которые не полностью входят в изображение
			if startX < 3 || endX >= width-3 || startY < 3 || endY >= height-3 {
				continue
			}

			// Вычисляем средний вектор для всех точек в клетке
			sumVecX := 0.0
			sumVecY := 0.0
			sumCoherence := 0.0
			pointCount := 0

			for y := startY; y < endY; y++ {
				for x := startX; x < endX; x++ {
					// Получаем перпендикулярный вектор (вдоль структуры)
					// Тот же метод, что используется в extractStrokeData
					perpX := -majorVectorY[y][x] // Поворачиваем на 90 градусов
					perpY := majorVectorX[y][x]

					// Суммируем компоненты векторов (это правильно для усреднения направлений)
					sumVecX += perpX
					sumVecY += perpY
					sumCoherence += coherence[y][x]
					pointCount++
				}
			}

			// Если в клетке нет точек, пропускаем её
			if pointCount == 0 {
				continue
			}

			// Вычисляем среднее
			avgVecX := sumVecX / float64(pointCount)
			avgVecY := sumVecY / float64(pointCount)
			avgCoherence := sumCoherence / float64(pointCount)

			// Нормализуем вектор
			length := math.Sqrt(avgVecX*avgVecX + avgVecY*avgVecY)
			if length > 1e-10 {
				avgVecX /= length
				avgVecY /= length
			}

			// Вычисляем угол среднего вектора
			theta := math.Atan2(avgVecY, avgVecX)

			// Координаты центра клетки для отображения вектора
			centerX := startX + (endX-startX)/2
			centerY := startY + (endY-startY)/2

			// Длина вектора пропорциональна когерентности
			vecLength := math.Min(1.0, math.Max(0.1, avgCoherence*2.0))

			vectors = append(vectors, GridVector{
				X:      centerX,
				Y:      centerY,
				Theta:  theta,
				Length: vecLength,
			})
		}
	}

	return vectors
}

// smoothVector применяет сглаживание к полю векторов
func (h *ImageProcessingHandler) smoothVector(vectorField [][]float64, width, height int) [][]float64 {
	result := make([][]float64, height)
	for y := 0; y < height; y++ {
		result[y] = make([]float64, width)
	}

	// Простое усреднение по соседям 3x3
	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			sum := 0.0
			count := 0.0

			for ky := -1; ky <= 1; ky++ {
				for kx := -1; kx <= 1; kx++ {
					sum += vectorField[y+ky][x+kx]
					count += 1.0
				}
			}

			result[y][x] = sum / count
		}
	}

	// Копируем граничные значения
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if y < 1 || y >= height-1 || x < 1 || x >= width-1 {
				result[y][x] = vectorField[y][x]
			}
		}
	}

	return result
}

// applyGaussianSmoothing применяет гауссовское сглаживание к матрице данных
func (h *ImageProcessingHandler) applyGaussianSmoothing(data [][]float64, width, height int) [][]float64 {
	// Создаем новую матрицу для результата
	result := make([][]float64, height)
	for y := 0; y < height; y++ {
		result[y] = make([]float64, width)
	}

	// Гауссов фильтр 5x5
	kernel := [][]float64{
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{7.0 / 273, 26.0 / 273, 41.0 / 273, 26.0 / 273, 7.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
	}

	kernelSize := 5
	halfKernel := kernelSize / 2

	// Применяем свертку с ядром
	for y := halfKernel; y < height-halfKernel; y++ {
		for x := halfKernel; x < width-halfKernel; x++ {
			sum := 0.0

			for ky := -halfKernel; ky <= halfKernel; ky++ {
				for kx := -halfKernel; kx <= halfKernel; kx++ {
					gx := data[y+ky][x+kx] * kernel[ky+halfKernel][kx+halfKernel]
					sum += gx
				}
			}

			result[y][x] = sum
		}
	}

	// Копируем граничные значения
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if y < halfKernel || y >= height-halfKernel || x < halfKernel || x >= width-halfKernel {
				result[y][x] = data[y][x]
			}
		}
	}

	return result
}

// normalizeGradientsForVisualization normalizes the gradient values to 0.0-1.0 range for visualization
func (h *ImageProcessingHandler) normalizeGradientsForVisualization(gradients [][]float64, width, height int) [][]float64 {
	if gradients == nil || len(gradients) == 0 {
		return nil
	}

	// Find max gradient value
	maxGradient := 0.0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if gradients[y][x] > maxGradient {
				maxGradient = gradients[y][x]
			}
		}
	}

	// Avoid division by zero
	if maxGradient < 0.001 {
		maxGradient = 0.001
	}

	// Create normalized gradient map with increased sensitivity
	normalized := make([][]float64, height)
	for y := 0; y < height; y++ {
		normalized[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			// Apply power function to enhance contrast between low and high gradient areas
			// This makes weak gradients more visible and high gradients more pronounced
			normalValue := gradients[y][x] / maxGradient

			// Apply gamma correction to increase sensitivity (gamma < 1 increases visibility of details in dark areas)
			gamma := 0.5
			enhancedValue := math.Pow(normalValue, gamma)

			normalized[y][x] = enhancedValue
		}
	}

	return normalized
}
