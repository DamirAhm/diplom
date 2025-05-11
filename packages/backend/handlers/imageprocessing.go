package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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

const (
	DefaultGridSize       = 20
	DefaultAdaptiveFactor = 0.5
	GaussianKernelSize    = 5

	// Processing timeout in seconds
	ProcessingTimeout = 120

	// Coefficients for RGB to LAB conversion
	XyzRefWhiteX = 0.95047
	XyzRefWhiteY = 1.00000
	XyzRefWhiteZ = 1.08883

	// Values for adaptive clustering
	AdaptiveGradientPower     = 2.5
	BaseGridMinimumPercentage = 0.2
	JitterPercentage          = 0.3

	// Cluster distance factor
	MinDistFactorBase  = 0.7
	MinDistFactorRange = 0.4
)

// Coefficients for gradient calculations
var (
	SobelKernelX = [][]float64{
		{-1, 0, 1},
		{-2, 0, 2},
		{-1, 0, 1},
	}
	SobelKernelY = [][]float64{
		{-1, -2, -1},
		{0, 0, 0},
		{1, 2, 1},
	}
)

type SuperpixelRequest struct {
	NumberOfSuperpixels int     `json:"numberOfSuperpixels"`
	CompactnessFactor   float64 `json:"compactnessFactor"`
	Elongation          float64 `json:"elongation"`
	Iterations          int     `json:"iterations"`
	GridSize            int     `json:"gridSize"`
	AdaptiveFactor      float64 `json:"adaptiveFactor"`
	Mode                string  `json:"mode"`
}

type Stroke struct {
	ID             int      `json:"id"`
	CenterX        float64  `json:"centerX"`
	CenterY        float64  `json:"centerY"`
	Color          [3]uint8 `json:"color"`
	Pixels         [][2]int `json:"pixels"`
	Theta          float64  `json:"theta"`
	Width          float64  `json:"width"`
	Height         float64  `json:"height"`
	ThetaCoherence float64  `json:"thetaCoherence"`
	MinX           int      `json:"minX"`
	MinY           int      `json:"minY"`
	MaxX           int      `json:"maxX"`
	MaxY           int      `json:"maxY"`
}

type GridVector struct {
	X      int     `json:"x"`
	Y      int     `json:"y"`
	Theta  float64 `json:"theta"`
	Length float64 `json:"length"`
}

type SuperpixelResponse struct {
	ImageWidth  int          `json:"imageWidth"`
	ImageHeight int          `json:"imageHeight"`
	Strokes     []Stroke     `json:"strokes"`
	GridVectors []GridVector `json:"gridVectors"`
}

type ImageProcessingHandler struct {
	uploadDir string
}

type Pixel struct {
	X, Y      int
	L, A, B   float64
	Theta     float64
	GradientX float64
	GradientY float64
}

type Cluster struct {
	CenterX, CenterY float64
	L, A, B          float64
	Theta            float64
	Pixels           []Pixel
}

func NewImageProcessingHandler(uploadDir string) *ImageProcessingHandler {
	return &ImageProcessingHandler{uploadDir: uploadDir}
}

func (h *ImageProcessingHandler) ProcessSuperpixels(w http.ResponseWriter, r *http.Request) {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), ProcessingTimeout*time.Second)
	defer cancel()

	// Create channels for results and errors
	resultChan := make(chan SuperpixelResponse, 1)
	errChan := make(chan error, 1)

	rand.Seed(time.Now().UnixNano())

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	var req SuperpixelRequest
	paramJSON := r.FormValue("params")
	if err := json.Unmarshal([]byte(paramJSON), &req); err != nil {
		http.Error(w, "Invalid parameters: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Set default mode to "strokes" if not specified
	if req.Mode == "" {
		req.Mode = "strokes"
	}

	// Validate mode
	if req.Mode != "strokes" && req.Mode != "pixels" {
		http.Error(w, "Invalid mode. Must be 'strokes' or 'pixels'", http.StatusBadRequest)
		return
	}

	if req.GridSize <= 0 {
		req.GridSize = DefaultGridSize
	}

	if req.AdaptiveFactor < 0 || req.AdaptiveFactor > 1.0 {
		req.AdaptiveFactor = DefaultAdaptiveFactor
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Failed to get image file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

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

	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Run the intensive processing in a goroutine with timeout control
	go func() {
		// Check for context cancellation
		if ctx.Err() != nil {
			errChan <- errors.New("processing timed out")
			return
		}

		// Perform the resource-intensive operations
		strokes := h.extractStrokeData(img, req.NumberOfSuperpixels, req.CompactnessFactor, req.Elongation, req.Iterations, req.AdaptiveFactor)

		// Check for context cancellation after extractStrokeData
		if ctx.Err() != nil {
			errChan <- errors.New("processing timed out during stroke extraction")
			return
		}

		gridVectors := h.createGradientGrid(img, req.GridSize)

		// Check for context cancellation after createGradientGrid
		if ctx.Err() != nil {
			errChan <- errors.New("processing timed out during gradient grid creation")
			return
		}

		// Process strokes based on the requested mode
		if req.Mode == "strokes" {
			// For strokes mode, optimize by reducing the pixel data
			// Instead of sending all pixels, just send the contour
			for i := range strokes {
				// Extract only the contour for each stroke
				strokes[i].Pixels = h.extractStrokeContour(strokes[i].Pixels)
			}
		}
		// For pixels mode, we send all pixel data (no modification needed)

		resultChan <- SuperpixelResponse{
			ImageWidth:  width,
			ImageHeight: height,
			Strokes:     strokes,
			GridVectors: gridVectors,
		}
	}()

	// Wait for either the result, an error, or a timeout
	select {
	case resp := <-resultChan:
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
		}
	case err := <-errChan:
		http.Error(w, err.Error(), http.StatusRequestTimeout)
	case <-ctx.Done():
		http.Error(w, "Image processing timed out. Try reducing the number of superpixels or using a smaller image.", http.StatusRequestTimeout)
	}
}

// extractStrokeContour возвращает только внешний контур мазка вместо всех пикселей
func (h *ImageProcessingHandler) extractStrokeContour(pixels [][2]int) [][2]int {
	if len(pixels) <= 100 {
		return pixels // Для маленьких мазков оставляем как есть
	}

	// Создаем карту посещенных пикселей
	minX, minY := pixels[0][0], pixels[0][1]
	maxX, maxY := pixels[0][0], pixels[0][1]

	// Находим границы мазка
	for _, p := range pixels {
		if p[0] < minX {
			minX = p[0]
		}
		if p[0] > maxX {
			maxX = p[0]
		}
		if p[1] < minY {
			minY = p[1]
		}
		if p[1] > maxY {
			maxY = p[1]
		}
	}

	// Создаем сетку, отмечая все пиксели мазка
	width := maxX - minX + 3 // +3 для добавления границы в 1 пиксель
	height := maxY - minY + 3
	grid := make([][]bool, height)
	for i := range grid {
		grid[i] = make([]bool, width)
	}

	// Отмечаем пиксели мазка
	for _, p := range pixels {
		x := p[0] - minX + 1
		y := p[1] - minY + 1
		if x >= 0 && x < width && y >= 0 && y < height {
			grid[y][x] = true
		}
	}

	// Ищем контурные пиксели (те, у которых есть соседи, не принадлежащие мазку)
	contour := make([][2]int, 0)

	// Направления для проверки 8 соседей
	dx := []int{-1, 0, 1, -1, 1, -1, 0, 1}
	dy := []int{-1, -1, -1, 0, 0, 1, 1, 1}

	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			if !grid[y][x] {
				continue // Этот пиксель не принадлежит мазку
			}

			// Проверяем, является ли это граничным пикселем
			isBoundary := false
			for i := 0; i < 8; i++ {
				nx, ny := x+dx[i], y+dy[i]
				if nx >= 0 && nx < width && ny >= 0 && ny < height && !grid[ny][nx] {
					isBoundary = true
					break
				}
			}

			if isBoundary {
				contour = append(contour, [2]int{x + minX - 1, y + minY - 1})
			}
		}
	}

	// Если контур получился слишком большим, прореживаем его
	if len(contour) > 500 {
		samplingRate := len(contour)/500 + 1
		sampledContour := make([][2]int, 0, 500)

		for i := 0; i < len(contour); i += samplingRate {
			sampledContour = append(sampledContour, contour[i])
		}

		return sampledContour
	}

	return contour
}

func (h *ImageProcessingHandler) preprocessImage(img image.Image) ([][]Pixel, [][][]float64) {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	pixels := make([][]Pixel, height)
	for y := 0; y < height; y++ {
		pixels[y] = make([]Pixel, width)
	}

	gradients := make([][][]float64, height)
	for y := 0; y < height; y++ {
		gradients[y] = make([][]float64, width)
		for x := 0; x < width; x++ {
			gradients[y][x] = make([]float64, 2)
		}
	}

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

			if x > 0 && x < width-1 && y > 0 && y < height-1 {
				gx := (pixels[y-1][x+1].L + 2*pixels[y][x+1].L + pixels[y+1][x+1].L) -
					(pixels[y-1][x-1].L + 2*pixels[y][x-1].L + pixels[y+1][x-1].L)

				gy := (pixels[y+1][x-1].L + 2*pixels[y+1][x].L + pixels[y+1][x+1].L) -
					(pixels[y-1][x-1].L + 2*pixels[y-1][x].L + pixels[y-1][x+1].L)

				pixels[y][x].GradientX = gx
				pixels[y][x].GradientY = gy
				gradients[y][x][0] = gx
				gradients[y][x][1] = gy

				if gx != 0 || gy != 0 {
					pixels[y][x].Theta = math.Atan2(-gx, gy)
				}
			}
		}
	}

	smoothedGradients := h.smoothGradients(pixels, gradients, width, height)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if x > 0 && x < width-1 && y > 0 && y < height-1 {
				gx := smoothedGradients[y][x][0]
				gy := smoothedGradients[y][x][1]

				if gx != 0 || gy != 0 {
					pixels[y][x].Theta = math.Atan2(-gx, gy)
				}
			}
		}
	}

	return pixels, smoothedGradients
}

func (h *ImageProcessingHandler) smoothGradients(pixels [][]Pixel, rawGradients [][][]float64, width, height int) [][][]float64 {
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
			smoothedGradients[y][x] = make([]float64, 2)
		}
	}

	kernelSize := GaussianKernelSize
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

func (h *ImageProcessingHandler) initializeClusters(pixels [][]Pixel, gradients [][][]float64, numberOfSuperpixels int, width, height int, majorVectorX, majorVectorY [][]float64) []Cluster {
	return h.initializeClustersWithAdaptive(pixels, gradients, numberOfSuperpixels, width, height, majorVectorX, majorVectorY, DefaultAdaptiveFactor)
}

func (h *ImageProcessingHandler) initializeClustersWithAdaptive(pixels [][]Pixel, gradients [][][]float64, numberOfSuperpixels int, width, height int, majorVectorX, majorVectorY [][]float64, adaptiveFactor float64) []Cluster {
	colorGradients := h.calculateColorGradients(pixels, width, height)

	maxGradient := 0.0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if colorGradients[y][x] > maxGradient {
				maxGradient = colorGradients[y][x]
			}
		}
	}

	if maxGradient < 0.001 {
		maxGradient = 0.001
	}

	enhancedGradients := make([][]float64, height)
	for y := 0; y < height; y++ {
		enhancedGradients[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			normalized := colorGradients[y][x] / maxGradient
			enhancedGradients[y][x] = math.Pow(normalized, AdaptiveGradientPower)
		}
	}

	baseGridSuperpixels := numberOfSuperpixels

	if adaptiveFactor > 0 {
		baseGridPercentage := 0.9 - adaptiveFactor*0.5
		baseGridSuperpixels = int(float64(numberOfSuperpixels) * baseGridPercentage)
		if baseGridSuperpixels < int(float64(numberOfSuperpixels)*BaseGridMinimumPercentage) {
			baseGridSuperpixels = int(float64(numberOfSuperpixels) * BaseGridMinimumPercentage)
		}
	}

	S := int(math.Sqrt(float64(width*height) / float64(baseGridSuperpixels)))

	clusters := []Cluster{}
	jitterFactor := float64(S) * JitterPercentage

	for y := S / 2; y < height; y += S {
		for x := S / 2; x < width; x += S {
			jitterX := int(rand.Float64()*jitterFactor*2 - jitterFactor)
			jitterY := int(rand.Float64()*jitterFactor*2 - jitterFactor)

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

			minGradient := math.Inf(1)
			minX, minY := posX, posY

			for ny := -1; ny <= 1; ny++ {
				for nx := -1; nx <= 1; nx++ {
					newX, newY := posX+nx, posY+ny

					if newX >= 0 && newX < width && newY >= 0 && newY < height {
						var g float64

						if gradients != nil {
							gx := gradients[newY][newX][0]
							gy := gradients[newY][newX][1]
							g = gx*gx + gy*gy
						} else if majorVectorX != nil && majorVectorY != nil {
							vx := majorVectorX[newY][newX]
							vy := majorVectorY[newY][newX]
							g = 1.0 - (vx*vx + vy*vy)
						} else {
							g = 1.0
						}

						if g < minGradient {
							minGradient = g
							minX, minY = newX, newY
						}
					}
				}
			}

			var theta float64
			var l, a, b float64

			if pixels != nil && minY < len(pixels) && minX < len(pixels[minY]) {
				theta = pixels[minY][minX].Theta
				l = pixels[minY][minX].L
				a = pixels[minY][minX].A
				b = pixels[minY][minX].B
			} else {
				if majorVectorX != nil && majorVectorY != nil && minX > 0 && minX < width-1 && minY > 0 && minY < height-1 {
					vx := majorVectorX[minY][minX]
					vy := majorVectorY[minY][minX]
					perpX := -vy
					perpY := vx
					theta = math.Atan2(perpY, perpX)
				} else {
					theta = 0.0
				}

				if minY < len(pixels) && minX < len(pixels[minY]) {
					l = pixels[minY][minX].L
					a = pixels[minY][minX].A
					b = pixels[minY][minX].B
				} else {
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

	if adaptiveFactor > 0 && len(enhancedGradients) > 0 {
		additionalClusters := numberOfSuperpixels - len(clusters)

		if additionalClusters > 0 {
			totalGradient := 0.0
			for y := 0; y < height; y++ {
				for x := 0; x < width; x++ {
					totalGradient += enhancedGradients[y][x]
				}
			}

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

			minDistFactor := MinDistFactorBase - adaptiveFactor*MinDistFactorRange
			minDistMultiplier := math.Max(0.3, minDistFactor)

			for i := 0; i < additionalClusters; i++ {
				r := rand.Float64()

				selectedIdx := 0
				for j := 0; j < len(cumGradient); j++ {
					if r <= cumGradient[j] {
						selectedIdx = j
						break
					}
				}

				selectedY := selectedIdx / width
				selectedX := selectedIdx % width

				tooClose := false

				gradientValue := enhancedGradients[selectedY][selectedX]
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
					continue
				}

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

func (h *ImageProcessingHandler) calculateColorGradients(pixels [][]Pixel, width, height int) [][]float64 {
	if pixels == nil || len(pixels) == 0 {
		return nil
	}

	smoothedL := make([][]float64, height)
	smoothedA := make([][]float64, height)
	smoothedB := make([][]float64, height)

	for y := 0; y < height; y++ {
		smoothedL[y] = make([]float64, width)
		smoothedA[y] = make([]float64, width)
		smoothedB[y] = make([]float64, width)

		for x := 0; x < width; x++ {
			if y < len(pixels) && x < len(pixels[y]) {
				smoothedL[y][x] = pixels[y][x].L
				smoothedA[y][x] = pixels[y][x].A
				smoothedB[y][x] = pixels[y][x].B
			}
		}
	}

	smoothedL = h.applyGaussianSmoothing(smoothedL, width, height)
	smoothedA = h.applyGaussianSmoothing(smoothedA, width, height)
	smoothedB = h.applyGaussianSmoothing(smoothedB, width, height)

	gradients := make([][]float64, height)
	for y := 0; y < height; y++ {
		gradients[y] = make([]float64, width)
	}

	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			dLdx := smoothedL[y][x+1] - smoothedL[y][x-1]
			dAdx := smoothedA[y][x+1] - smoothedA[y][x-1]
			dBdx := smoothedB[y][x+1] - smoothedB[y][x-1]

			dLdy := smoothedL[y+1][x] - smoothedL[y-1][x]
			dAdy := smoothedA[y+1][x] - smoothedA[y-1][x]
			dBdy := smoothedB[y+1][x] - smoothedB[y-1][x]

			gradX := math.Sqrt(dLdx*dLdx + dAdx*dAdx + dBdx*dBdx)
			gradY := math.Sqrt(dLdy*dLdy + dAdy*dAdy + dBdy*dBdy)

			gradients[y][x] = math.Sqrt(gradX*gradX + gradY*gradY)
		}
	}

	return h.applyGaussianSmoothing(gradients, width, height)
}

func rgbToLab(c color.Color) (float64, float64, float64) {
	r, g, b, _ := c.RGBA()
	rf, gf, bf := float64(r)/65535.0, float64(g)/65535.0, float64(b)/65535.0

	rf = pivotRgb(rf)
	gf = pivotRgb(gf)
	bf = pivotRgb(bf)

	x := 0.4124*rf + 0.3576*gf + 0.1805*bf
	y := 0.2126*rf + 0.7152*gf + 0.0722*bf
	z := 0.0193*rf + 0.1192*gf + 0.9505*bf

	x = pivotXyz(x / XyzRefWhiteX)
	y = pivotXyz(y / XyzRefWhiteY)
	z = pivotXyz(z / XyzRefWhiteZ)

	l := 116*y - 16
	a := 500 * (x - y)
	bValue := 200 * (y - z)

	return l, a, bValue
}

func labToRgb(l, a, b float64) (float64, float64, float64) {
	y := (l + 16) / 116
	x := a/500 + y
	z := y - b/200

	x = XyzRefWhiteX * unpivotXyz(x)
	y = XyzRefWhiteY * unpivotXyz(y)
	z = XyzRefWhiteZ * unpivotXyz(z)

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

func (h *ImageProcessingHandler) createGradientGrid(img image.Image, gridSize int) []GridVector {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	majorVectorX, majorVectorY, coherence := h.calculateStructureTensor(img)

	stepX := width / gridSize
	stepY := height / gridSize

	if stepX < 1 {
		stepX = 1
	}
	if stepY < 1 {
		stepY = 1
	}

	vectors := make([]GridVector, 0, gridSize*gridSize)

	for cellY := 0; cellY < gridSize; cellY++ {
		for cellX := 0; cellX < gridSize; cellX++ {
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

			if startX < 3 || endX >= width-3 || startY < 3 || endY >= height-3 {
				continue
			}

			sumVecX := 0.0
			sumVecY := 0.0
			sumCoherence := 0.0
			pointCount := 0

			for y := startY; y < endY; y++ {
				for x := startX; x < endX; x++ {
					perpX := -majorVectorY[y][x]
					perpY := majorVectorX[y][x]

					sumVecX += perpX
					sumVecY += perpY
					sumCoherence += coherence[y][x]
					pointCount++
				}
			}

			if pointCount == 0 {
				continue
			}

			avgVecX := sumVecX / float64(pointCount)
			avgVecY := sumVecY / float64(pointCount)
			avgCoherence := sumCoherence / float64(pointCount)

			length := math.Sqrt(avgVecX*avgVecX + avgVecY*avgVecY)
			if length > 1e-10 {
				avgVecX /= length
				avgVecY /= length
			}

			theta := math.Atan2(avgVecY, avgVecX)
			centerX := startX + (endX-startX)/2
			centerY := startY + (endY-startY)/2
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

func (h *ImageProcessingHandler) smoothVector(vectorField [][]float64, width, height int) [][]float64 {
	result := make([][]float64, height)
	for y := 0; y < height; y++ {
		result[y] = make([]float64, width)
	}

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

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if y < 1 || y >= height-1 || x < 1 || x >= width-1 {
				result[y][x] = vectorField[y][x]
			}
		}
	}

	return result
}

func (h *ImageProcessingHandler) applyGaussianSmoothing(data [][]float64, width, height int) [][]float64 {
	result := make([][]float64, height)
	for y := 0; y < height; y++ {
		result[y] = make([]float64, width)
	}

	kernel := [][]float64{
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{7.0 / 273, 26.0 / 273, 41.0 / 273, 26.0 / 273, 7.0 / 273},
		{4.0 / 273, 16.0 / 273, 26.0 / 273, 16.0 / 273, 4.0 / 273},
		{1.0 / 273, 4.0 / 273, 7.0 / 273, 4.0 / 273, 1.0 / 273},
	}

	kernelSize := GaussianKernelSize
	halfKernel := kernelSize / 2

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

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if y < halfKernel || y >= height-halfKernel || x < halfKernel || x >= width-halfKernel {
				result[y][x] = data[y][x]
			}
		}
	}

	return result
}

func (h *ImageProcessingHandler) normalizeGradientsForVisualization(gradients [][]float64, width, height int) [][]float64 {
	if gradients == nil || len(gradients) == 0 {
		return nil
	}

	maxGradient := 0.0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if gradients[y][x] > maxGradient {
				maxGradient = gradients[y][x]
			}
		}
	}

	if maxGradient < 0.001 {
		maxGradient = 0.001
	}

	normalized := make([][]float64, height)
	for y := 0; y < height; y++ {
		normalized[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			normalValue := gradients[y][x] / maxGradient
			gamma := 0.5
			enhancedValue := math.Pow(normalValue, gamma)
			normalized[y][x] = enhancedValue
		}
	}

	return normalized
}

func (h *ImageProcessingHandler) calculateStructureTensor(img image.Image) ([][]float64, [][]float64, [][]float64) {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	grayImg := make([][]float64, height)
	for y := 0; y < height; y++ {
		grayImg[y] = make([]float64, width)
		for x := 0; x < width; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			grayImg[y][x] = 0.2126*float64(r)/65535.0 + 0.7152*float64(g)/65535.0 + 0.0722*float64(b)/65535.0
		}
	}

	grayImg = h.applyGaussianSmoothing(grayImg, width, height)

	gradX := make([][]float64, height)
	gradY := make([][]float64, height)

	for y := 0; y < height; y++ {
		gradX[y] = make([]float64, width)
		gradY[y] = make([]float64, width)
	}

	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			sumX, sumY := 0.0, 0.0

			for ky := -1; ky <= 1; ky++ {
				for kx := -1; kx <= 1; kx++ {
					sumX += grayImg[y+ky][x+kx] * SobelKernelX[ky+1][kx+1]
					sumY += grayImg[y+ky][x+kx] * SobelKernelY[ky+1][kx+1]
				}
			}

			gradX[y][x] = sumX
			gradY[y][x] = sumY
		}
	}

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
			gx := gradX[y][x]
			gy := gradY[y][x]

			tensorA[y][x] = gx * gx
			tensorB[y][x] = gx * gy
			tensorC[y][x] = gy * gy
		}
	}

	for i := 0; i < 3; i++ {
		tensorA = h.applyGaussianSmoothing(tensorA, width, height)
		tensorB = h.applyGaussianSmoothing(tensorB, width, height)
		tensorC = h.applyGaussianSmoothing(tensorC, width, height)
	}

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

			discriminant := math.Sqrt(math.Max(0, (a-c)*(a-c)+4*b*b))
			lambda1 := (a + c + discriminant) / 2
			lambda2 := (a + c - discriminant) / 2

			if lambda1+lambda2 > 1e-10 {
				coherence[y][x] = (lambda1 - lambda2) / (lambda1 + lambda2)
			} else {
				coherence[y][x] = 0
			}

			if math.Abs(b) < 1e-10 {
				if a >= c {
					majorVectorX[y][x] = 1
					majorVectorY[y][x] = 0
				} else {
					majorVectorX[y][x] = 0
					majorVectorY[y][x] = 1
				}
			} else {
				majorVectorX[y][x] = lambda1 - c
				majorVectorY[y][x] = b

				length := math.Sqrt(majorVectorX[y][x]*majorVectorX[y][x] + majorVectorY[y][x]*majorVectorY[y][x])
				if length > 1e-10 {
					majorVectorX[y][x] /= length
					majorVectorY[y][x] /= length
				}
			}
		}
	}

	for i := 0; i < 2; i++ {
		majorVectorX = h.smoothVector(majorVectorX, width, height)
		majorVectorY = h.smoothVector(majorVectorY, width, height)
	}

	return majorVectorX, majorVectorY, coherence
}

func (h *ImageProcessingHandler) extractStrokeData(img image.Image, numberOfSuperpixels int, compactness float64, elongation float64, iterations int, adaptiveFactor float64) []Stroke {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	majorVectorX, majorVectorY, _ := h.calculateStructureTensor(img)
	labImg, _ := h.preprocessImage(img)
	clusters := h.initializeClustersWithAdaptive(labImg, nil, numberOfSuperpixels, width, height, majorVectorX, majorVectorY, adaptiveFactor)
	S := int(math.Sqrt(float64(width*height) / float64(numberOfSuperpixels)))

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

	for iter := 0; iter < iterations; iter++ {
		// Очищаем пиксели кластеров
		for i := range clusters {
			clusters[i].Pixels = nil
		}

		// Очищаем расстояния для новой итерации
		for y := range distances {
			for x := range distances[y] {
				distances[y][x] = math.Inf(1)
				labels[y][x] = -1
			}
		}

		// Создаем структуру для хранения локальных результатов каждой горутины
		type ClusterResult struct {
			ClusterIdx int
			PixelX     int
			PixelY     int
			Distance   float64
		}

		// Канал для сбора результатов от всех горутин
		resultChan := make(chan ClusterResult, width*height)

		var wg sync.WaitGroup
		for i := range clusters {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				c := &clusters[i]

				startX := int(math.Max(0, c.CenterX-float64(S)))
				endX := int(math.Min(float64(width-1), c.CenterX+float64(S)))
				startY := int(math.Max(0, c.CenterY-float64(S)))
				endY := int(math.Min(float64(height-1), c.CenterY+float64(S)))

				for y := startY; y <= endY; y++ {
					for x := startX; x <= endX; x++ {
						dx := float64(x) - c.CenterX
						dy := float64(y) - c.CenterY

						X := dx*math.Cos(c.Theta) + dy*math.Sin(c.Theta)
						Y := -dx*math.Sin(c.Theta) + dy*math.Cos(c.Theta)

						spatialDist := math.Sqrt(X*X + (elongation*Y)*(elongation*Y))

						l, a, b := rgbToLab(img.At(x, y))
						colorDist := math.Sqrt(
							(l-c.L)*(l-c.L) +
								(a-c.A)*(a-c.A) +
								(b-c.B)*(b-c.B),
						)

						dist := colorDist + compactness*spatialDist/float64(S)

						// Добавляем результат в локальный буфер
						resultChan <- ClusterResult{
							ClusterIdx: i,
							PixelX:     x,
							PixelY:     y,
							Distance:   dist,
						}
					}
				}
			}(i)
		}

		labeledPixels := 0

		// Запускаем горутину для закрытия канала после обработки всех кластеров
		go func() {
			wg.Wait()
			close(resultChan)
		}()

		// Обрабатываем все результаты и выбираем лучший кластер для каждого пикселя
		for result := range resultChan {
			x := result.PixelX
			y := result.PixelY

			if result.Distance < distances[y][x] {
				distances[y][x] = result.Distance
				labels[y][x] = result.ClusterIdx
				labeledPixels++
			}
		}

		// Добавляем пиксели в найденные для них кластеры
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if labels[y][x] >= 0 {
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
					clusters[labels[y][x]].Pixels = append(clusters[labels[y][x]].Pixels, pixel)
				}
			}
		}

		// Пересчитываем центры кластеров
		for i := range clusters {
			if len(clusters[i].Pixels) == 0 {
				continue
			}

			sumX, sumY, sumL, sumA, sumB := 0.0, 0.0, 0.0, 0.0, 0.0
			sumCosTheta, sumSinTheta := 0.0, 0.0

			for _, p := range clusters[i].Pixels {
				sumX += float64(p.X)
				sumY += float64(p.Y)
				sumL += p.L
				sumA += p.A
				sumB += p.B

				sumCosTheta += math.Cos(p.Theta)
				sumSinTheta += math.Sin(p.Theta)
			}

			n := float64(len(clusters[i].Pixels))
			clusters[i].CenterX = sumX / n
			clusters[i].CenterY = sumY / n
			clusters[i].L = sumL / n
			clusters[i].A = sumA / n
			clusters[i].B = sumB / n
			clusters[i].Theta = math.Atan2(sumSinTheta, sumCosTheta)
		}
	}

	strokes := []Stroke{}

	for i, cluster := range clusters {
		r, g, b := labToRgb(cluster.L, cluster.A, cluster.B)
		color := [3]uint8{uint8(r * 255), uint8(g * 255), uint8(b * 255)}

		pixels := make([][2]int, 0, len(cluster.Pixels))
		for _, p := range cluster.Pixels {
			pixels = append(pixels, [2]int{p.X, p.Y})
		}

		// Определяем границы мазка
		minX, minY := width, height
		maxX, maxY := 0, 0
		for _, p := range pixels {
			if p[0] < minX {
				minX = p[0]
			}
			if p[0] > maxX {
				maxX = p[0]
			}
			if p[1] < minY {
				minY = p[1]
			}
			if p[1] > maxY {
				maxY = p[1]
			}
		}

		stroke := Stroke{
			ID:             i,
			CenterX:        cluster.CenterX,
			CenterY:        cluster.CenterY,
			Color:          color,
			Pixels:         pixels,
			Theta:          cluster.Theta,
			Width:          float64(maxX - minX),
			Height:         float64(maxY - minY),
			ThetaCoherence: 1,
			MinX:           minX,
			MinY:           minY,
			MaxX:           maxX,
			MaxY:           maxY,
		}

		strokes = append(strokes, stroke)
	}

	// Проверяем и разделяем мазки, если необходимо
	return h.processDisconnectedStrokes(strokes, width, height)
}

// processDisconnectedStrokes находит и разделяет мазки на отдельные компоненты связности
func (h *ImageProcessingHandler) processDisconnectedStrokes(strokes []Stroke, width, height int) []Stroke {
	result := make([]Stroke, 0, len(strokes))
	nextID := len(strokes)

	// Создаем карту, чтобы отслеживать, какие пиксели уже назначены новым мазкам
	assignedPixels := make(map[[2]int]bool)

	for _, stroke := range strokes {
		if len(stroke.Pixels) < 5 {
			result = append(result, stroke) // Слишком маленькие мазки не обрабатываем

			// Отмечаем пиксели как назначенные
			for _, p := range stroke.Pixels {
				assignedPixels[p] = true
			}

			continue
		}

		components := h.findConnectedComponents(stroke.Pixels, width, height)

		if len(components) <= 1 {
			result = append(result, stroke) // Мазок не разделен, используем как есть

			// Отмечаем пиксели как назначенные
			for _, p := range stroke.Pixels {
				assignedPixels[p] = true
			}
		} else {
			// Создаем карту для быстрого поиска всех пикселей этого мазка
			pixelMap := make(map[[2]int]bool)
			for _, p := range stroke.Pixels {
				pixelMap[p] = true
			}

			// Обнаруженные компоненты связности
			validComponents := make([][][2]int, 0, len(components))

			// Разделяем мазок на компоненты связности
			for _, component := range components {
				if len(component) < 5 {
					// Слишком маленькие компоненты сохраняем для последующей обработки
					continue
				}

				validComponents = append(validComponents, component)

				newStroke := h.createStrokeFromPixels(component, stroke.Color, nextID)
				nextID++
				result = append(result, newStroke)

				// Отмечаем пиксели как назначенные
				for _, p := range component {
					assignedPixels[p] = true
					delete(pixelMap, p) // Удаляем из карты пикселей, чтобы найти неназначенные
				}
			}

			// Обрабатываем оставшиеся пиксели (непривязанные или слишком маленькие компоненты)
			unassignedPixels := make([][2]int, 0)
			for p := range pixelMap {
				unassignedPixels = append(unassignedPixels, p)
			}

			if len(unassignedPixels) > 0 && len(validComponents) > 0 {
				// Назначаем непривязанные пиксели ближайшей компоненте
				h.assignUnassignedPixels(unassignedPixels, validComponents, result, assignedPixels)
			} else if len(unassignedPixels) > 0 {
				// Если нет ни одной валидной компоненты, но есть непривязанные пиксели,
				// создаем для них отдельный мазок
				if len(unassignedPixels) >= 5 {
					newStroke := h.createStrokeFromPixels(unassignedPixels, stroke.Color, nextID)
					nextID++
					result = append(result, newStroke)

					for _, p := range unassignedPixels {
						assignedPixels[p] = true
					}
				} else {
					// Если пикселей слишком мало, просто добавляем их к исходному мазку
					result = append(result, stroke)
					for _, p := range stroke.Pixels {
						assignedPixels[p] = true
					}
				}
			}
		}
	}

	// Проверяем, остались ли непривязанные пиксели в исходных мазках
	// и распределяем их к ближайшим новым мазкам
	h.redistributeUnassignedPixels(strokes, result, assignedPixels)

	return result
}

// assignUnassignedPixels назначает непривязанные пиксели ближайшим компонентам
func (h *ImageProcessingHandler) assignUnassignedPixels(pixels [][2]int, components [][][2]int, strokes []Stroke, assignedPixels map[[2]int]bool) {
	// Для каждого непривязанного пикселя находим ближайшую компоненту
	for _, pixel := range pixels {
		if assignedPixels[pixel] {
			continue // Пиксель уже назначен
		}

		bestComponentIdx := -1
		minDistance := math.Inf(1)

		// Найдем ближайшую компоненту
		for i, component := range components {
			for _, cp := range component {
				dist := float64((pixel[0]-cp[0])*(pixel[0]-cp[0]) + (pixel[1]-cp[1])*(pixel[1]-cp[1]))
				if dist < minDistance {
					minDistance = dist
					bestComponentIdx = i
				}
			}
		}

		// Если нашли ближайшую компоненту
		if bestComponentIdx >= 0 {
			// Находим индекс соответствующего мазка в результирующем массиве
			for i := range strokes {
				// Проверяем, содержит ли этот мазок хотя бы один пиксель из компоненты
				if contains(strokes[i].Pixels, components[bestComponentIdx][0]) {
					// Добавляем непривязанный пиксель к этому мазку
					strokes[i].Pixels = append(strokes[i].Pixels, pixel)
					assignedPixels[pixel] = true

					// Обновляем границы мазка, если нужно
					if pixel[0] < strokes[i].MinX {
						strokes[i].MinX = pixel[0]
					}
					if pixel[0] > strokes[i].MaxX {
						strokes[i].MaxX = pixel[0]
					}
					if pixel[1] < strokes[i].MinY {
						strokes[i].MinY = pixel[1]
					}
					if pixel[1] > strokes[i].MaxY {
						strokes[i].MaxY = pixel[1]
					}

					// Обновляем ширину и высоту
					strokes[i].Width = float64(strokes[i].MaxX - strokes[i].MinX)
					strokes[i].Height = float64(strokes[i].MaxY - strokes[i].MinY)

					// Пересчитываем центр
					sumX, sumY := 0, 0
					for _, p := range strokes[i].Pixels {
						sumX += p[0]
						sumY += p[1]
					}
					strokes[i].CenterX = float64(sumX) / float64(len(strokes[i].Pixels))
					strokes[i].CenterY = float64(sumY) / float64(len(strokes[i].Pixels))

					break
				}
			}
		}
	}
}

// redistributeUnassignedPixels находит пиксели, которые не были назначены ни одному мазку,
// и распределяет их к ближайшим мазкам
func (h *ImageProcessingHandler) redistributeUnassignedPixels(originalStrokes, newStrokes []Stroke, assignedPixels map[[2]int]bool) {
	// Собираем все непривязанные пиксели
	unassignedPixels := make([][2]int, 0)

	for _, stroke := range originalStrokes {
		for _, pixel := range stroke.Pixels {
			if !assignedPixels[pixel] {
				unassignedPixels = append(unassignedPixels, pixel)
			}
		}
	}

	// Если есть непривязанные пиксели, распределяем их
	if len(unassignedPixels) > 0 && len(newStrokes) > 0 {
		for _, pixel := range unassignedPixels {
			bestStrokeIdx := -1
			minDistance := math.Inf(1)

			// Найдем ближайший мазок
			for i, stroke := range newStrokes {
				centerDist := math.Sqrt(
					math.Pow(float64(pixel[0])-stroke.CenterX, 2) +
						math.Pow(float64(pixel[1])-stroke.CenterY, 2),
				)

				if centerDist < minDistance {
					minDistance = centerDist
					bestStrokeIdx = i
				}
			}

			// Если нашли ближайший мазок
			if bestStrokeIdx >= 0 {
				stroke := &newStrokes[bestStrokeIdx]

				// Добавляем пиксель к мазку
				stroke.Pixels = append(stroke.Pixels, pixel)
				assignedPixels[pixel] = true

				// Обновляем границы
				if pixel[0] < stroke.MinX {
					stroke.MinX = pixel[0]
				}
				if pixel[0] > stroke.MaxX {
					stroke.MaxX = pixel[0]
				}
				if pixel[1] < stroke.MinY {
					stroke.MinY = pixel[1]
				}
				if pixel[1] > stroke.MaxY {
					stroke.MaxY = pixel[1]
				}

				// Обновляем размеры
				stroke.Width = float64(stroke.MaxX - stroke.MinX)
				stroke.Height = float64(stroke.MaxY - stroke.MinY)

				// Пересчитываем центр
				sumX, sumY := 0, 0
				for _, p := range stroke.Pixels {
					sumX += p[0]
					sumY += p[1]
				}
				stroke.CenterX = float64(sumX) / float64(len(stroke.Pixels))
				stroke.CenterY = float64(sumY) / float64(len(stroke.Pixels))
			}
		}
	}
}

// contains проверяет, содержится ли пиксель в массиве пикселей
func contains(pixels [][2]int, pixel [2]int) bool {
	for _, p := range pixels {
		if p[0] == pixel[0] && p[1] == pixel[1] {
			return true
		}
	}
	return false
}

// findConnectedComponents находит компоненты связности в мазке используя BFS
func (h *ImageProcessingHandler) findConnectedComponents(pixels [][2]int, width, height int) [][][2]int {
	if len(pixels) == 0 {
		return nil
	}

	// Создаем карту пикселей для быстрого поиска
	pixelMap := make(map[[2]int]bool)
	for _, p := range pixels {
		pixelMap[p] = true
	}

	// Направления для поиска соседей (4-связность)
	dx := []int{0, 1, 0, -1}
	dy := []int{-1, 0, 1, 0}

	// Карта посещенных пикселей
	visited := make(map[[2]int]bool)

	components := make([][][2]int, 0)

	// BFS для каждого непосещенного пикселя
	for _, startPixel := range pixels {
		if visited[startPixel] {
			continue
		}

		component := make([][2]int, 0)
		queue := [][2]int{startPixel}
		visited[startPixel] = true

		for len(queue) > 0 {
			pixel := queue[0]
			queue = queue[1:]
			component = append(component, pixel)

			// Проверяем соседей
			for i := 0; i < 4; i++ {
				nx, ny := pixel[0]+dx[i], pixel[1]+dy[i]
				neighbor := [2]int{nx, ny}

				if nx >= 0 && nx < width &&
					ny >= 0 && ny < height &&
					pixelMap[neighbor] &&
					!visited[neighbor] {
					visited[neighbor] = true
					queue = append(queue, neighbor)
				}
			}
		}

		components = append(components, component)
	}

	return components
}

// createStrokeFromPixels создает новый мазок из списка пикселей
func (h *ImageProcessingHandler) createStrokeFromPixels(pixels [][2]int, color [3]uint8, id int) Stroke {
	if len(pixels) == 0 {
		return Stroke{ID: id}
	}

	// Вычисляем центр и границы мазка
	sumX, sumY := 0, 0
	minX, minY := pixels[0][0], pixels[0][1]
	maxX, maxY := pixels[0][0], pixels[0][1]

	for _, p := range pixels {
		sumX += p[0]
		sumY += p[1]

		if p[0] < minX {
			minX = p[0]
		}
		if p[0] > maxX {
			maxX = p[0]
		}
		if p[1] < minY {
			minY = p[1]
		}
		if p[1] > maxY {
			maxY = p[1]
		}
	}

	centerX := float64(sumX) / float64(len(pixels))
	centerY := float64(sumY) / float64(len(pixels))

	// Находим главное направление (используем простую аппроксимацию)
	// Упрощенный способ - направление от центра к самой дальней точке
	maxDist := 0.0
	var dirX, dirY float64

	for _, p := range pixels {
		dx := float64(p[0]) - centerX
		dy := float64(p[1]) - centerY
		dist := dx*dx + dy*dy

		if dist > maxDist {
			maxDist = dist
			dirX, dirY = dx, dy
		}
	}

	theta := math.Atan2(dirY, dirX)

	return Stroke{
		ID:             id,
		CenterX:        centerX,
		CenterY:        centerY,
		Color:          color,
		Pixels:         pixels,
		Theta:          theta,
		Width:          float64(maxX - minX),
		Height:         float64(maxY - minY),
		ThetaCoherence: 1.0, // Можно вычислить более точно
		MinX:           minX,
		MinY:           minY,
		MaxX:           maxX,
		MaxY:           maxY,
	}
}
