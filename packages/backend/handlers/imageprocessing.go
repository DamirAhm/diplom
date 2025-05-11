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
					i--
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

	// Проверяем, есть ли непомеченные пиксели
	// hasUnlabeledPixels := labeledPixels < width*height

	// // Заполняем все непомеченные пиксели
	// if hasUnlabeledPixels {
	// 	for y := 0; y < height; y++ {
	// 		for x := 0; x < width; x++ {
	// 			if labels[y][x] == -1 {
	// 				minDist := math.Inf(1)
	// 				nearestCluster := -1

	// 				for i, c := range clusters {
	// 					dx := float64(x) - c.CenterX
	// 					dy := float64(y) - c.CenterY
	// 					dist := dx*dx + dy*dy

	// 					if dist < minDist {
	// 						minDist = dist
	// 						nearestCluster = i
	// 					}
	// 				}

	// 				if nearestCluster >= 0 {
	// 					labels[y][x] = nearestCluster

	// 					l, a, b := rgbToLab(img.At(x, y))
	// 					var theta float64
	// 					if x >= 2 && x < width-2 && y >= 2 && y < height-2 {
	// 						perpX := -majorVectorY[y][x]
	// 						perpY := majorVectorX[y][x]
	// 						theta = math.Atan2(perpY, perpX)
	// 					} else {
	// 						theta = 0.0
	// 					}

	// 					pixel := Pixel{
	// 						X:     x,
	// 						Y:     y,
	// 						L:     l,
	// 						A:     a,
	// 						B:     b,
	// 						Theta: theta,
	// 					}
	// 					clusters[nearestCluster].Pixels = append(clusters[nearestCluster].Pixels, pixel)
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	return h.clustersToStrokes(img, clusters, labels)
}

func (h *ImageProcessingHandler) clustersToStrokes(img image.Image, clusters []Cluster, labels [][]int) []Stroke {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	strokes := make([]Stroke, 0, len(clusters))

	// Define directions for BFS: up, right, down, left
	dx := []int{0, 1, 0, -1}
	dy := []int{-1, 0, 1, 0}

	// Создаем карту посещенных пикселей для всего изображения
	globalVisited := make([][]bool, height)
	for y := 0; y < height; y++ {
		globalVisited[y] = make([]bool, width)
	}

	for i, cluster := range clusters {
		if len(cluster.Pixels) == 0 {
			continue
		}

		r, g, b := labToRgb(cluster.L, cluster.A, cluster.B)
		color := [3]uint8{uint8(r * 255), uint8(g * 255), uint8(b * 255)}

		pixels := make([][2]int, 0, len(cluster.Pixels))
		minX, minY := width, height
		maxX, maxY := 0, 0
		sumCosTheta, sumSinTheta := 0.0, 0.0
		numPixels := 0.0

		// Создаем локальную карту посещенных пикселей для этого кластера
		visited := make([][]bool, height)
		for y := 0; y < height; y++ {
			visited[y] = make([]bool, width)
		}

		// Собираем все начальные точки для BFS
		seeds := []struct{ X, Y int }{}

		// Начинаем с центра кластера
		centerX := int(math.Round(cluster.CenterX))
		centerY := int(math.Round(cluster.CenterY))

		// Добавляем центр как начальную точку
		if centerX >= 0 && centerX < width && centerY >= 0 && centerY < height && !globalVisited[centerY][centerX] && labels[centerY][centerX] == i {
			seeds = append(seeds, struct{ X, Y int }{centerX, centerY})
		}

		// Проходим через все пиксели кластера и находим еще не посещенные
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if !globalVisited[y][x] && labels[y][x] == i {
					// Определяем, является ли этот пиксель потенциально "островом"
					// Проверяем, есть ли уже начальные точки поблизости
					isIsolated := true

					// Проверяем соседние пиксели
					for d := 0; d < 4; d++ {
						nx, ny := x+dx[d], y+dy[d]
						if nx >= 0 && nx < width && ny >= 0 && ny < height && globalVisited[ny][nx] {
							isIsolated = false
							break
						}
					}

					// Если пиксель кажется изолированным, добавляем его как начальную точку
					if isIsolated {
						seeds = append(seeds, struct{ X, Y int }{x, y})
					}
				}
			}
		}

		// Если не нашли ни одной начальной точки, но у кластера есть пиксели,
		// найдем хотя бы один пиксель, принадлежащий этому кластеру
		if len(seeds) == 0 {
			for y := 0; y < height; y++ {
				for x := 0; x < width; x++ {
					if !globalVisited[y][x] && labels[y][x] == i {
						seeds = append(seeds, struct{ X, Y int }{x, y})
						break
					}
				}
				if len(seeds) > 0 {
					break
				}
			}
		}

		// Запускаем BFS из всех начальных точек
		for _, seed := range seeds {
			queue := []struct{ X, Y int }{seed}
			visited[seed.Y][seed.X] = true

			for len(queue) > 0 {
				current := queue[0]
				queue = queue[1:]
				x, y := current.X, current.Y

				// Пропускаем, если за пределами изображения или уже посещен глобально
				if x < 0 || x >= width || y < 0 || y >= height || globalVisited[y][x] {
					continue
				}

				// Проверяем, принадлежит ли пиксель этому кластеру
				if labels[y][x] == i {
					// Добавляем этот пиксель в мазок
					pixels = append(pixels, [2]int{x, y})
					globalVisited[y][x] = true

					// Обновляем min/max координаты
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

					// Рассчитываем информацию о theta
					for _, p := range cluster.Pixels {
						if p.X == x && p.Y == y {
							sumCosTheta += math.Cos(p.Theta)
							sumSinTheta += math.Sin(p.Theta)
							numPixels++
							break
						}
					}

					// Добавляем соседей в очередь
					for d := 0; d < 4; d++ {
						nx, ny := x+dx[d], y+dy[d]

						// Проверяем границы и посещенность
						if nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx] {
							visited[ny][nx] = true
							queue = append(queue, struct{ X, Y int }{nx, ny})
						}
					}
				}
				// Если пиксель не принадлежит этому кластеру, мы не добавляем его соседей
			}
		}

		// Проверяем, что у мазка есть пиксели
		if len(pixels) == 0 {
			continue
		}

		strokeWidth := float64(maxX - minX)
		strokeHeight := float64(maxY - minY)

		thetaCoherence := 0.0
		if numPixels > 0 {
			thetaCoherence = math.Sqrt(sumCosTheta*sumCosTheta+sumSinTheta*sumSinTheta) / numPixels
		}

		stroke := Stroke{
			ID:             i,
			CenterX:        cluster.CenterX,
			CenterY:        cluster.CenterY,
			Color:          color,
			Pixels:         pixels,
			Theta:          cluster.Theta,
			Width:          strokeWidth,
			Height:         strokeHeight,
			ThetaCoherence: thetaCoherence,
			MinX:           minX,
			MinY:           minY,
			MaxX:           maxX,
			MaxY:           maxY,
		}

		strokes = append(strokes, stroke)
	}

	// Финальная проверка на непокрытые пиксели
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if !globalVisited[y][x] {
				// Определяем соседние кластеры, с которыми граничит этот пиксель
				// Эти направления: вверх, вправо, вниз, влево
				dx := []int{0, 1, 0, -1}
				dy := []int{-1, 0, 1, 0}

				// Карта для хранения соседних кластеров
				neighboringClusters := make(map[int]bool)

				// Проверяем соседние пиксели
				for d := 0; d < 4; d++ {
					nx, ny := x+dx[d], y+dy[d]

					// Проверяем границы и посещенность соседнего пикселя
					if nx >= 0 && nx < width && ny >= 0 && ny < height && globalVisited[ny][nx] {
						// Ищем, какому мазку принадлежит этот соседний пиксель
						for i, stroke := range strokes {
							// Проверяем каждый пиксель в мазке
							for _, pixelCoord := range stroke.Pixels {
								if pixelCoord[0] == nx && pixelCoord[1] == ny {
									// Добавляем этот мазок в список соседних
									neighboringClusters[i] = true
									break
								}
							}
						}
					}
				}

				// Если нет соседних кластеров, пропускаем этот пиксель для текущей итерации
				if len(neighboringClusters) == 0 {
					continue
				}

				// Находим ближайший мазок с учетом как пространственной, так и цветовой близости
				// из тех, что граничат с этим пикселем
				minCombinedDist := math.Inf(1)
				nearestStrokeIdx := -1

				// Получаем цвет текущего пикселя в пространстве LAB
				pixelL, pixelA, pixelB := rgbToLab(img.At(x, y))

				// Рассматриваем только граничащие кластеры
				for strokeIdx := range neighboringClusters {
					if strokeIdx >= len(strokes) {
						continue
					}

					stroke := strokes[strokeIdx]

					// Пространственное расстояние
					dx := float64(x) - stroke.CenterX
					dy := float64(y) - stroke.CenterY
					spatialDist := dx*dx + dy*dy

					// Цветовое расстояние (используем LAB значения кластера)
					clusterIdx := -1
					for j, cluster := range clusters {
						if cluster.CenterX == stroke.CenterX && cluster.CenterY == stroke.CenterY {
							clusterIdx = j
							break
						}
					}

					var colorDist float64
					if clusterIdx >= 0 && clusterIdx < len(clusters) {
						// Используем LAB значения кластера
						colorDist = math.Sqrt(
							(pixelL-clusters[clusterIdx].L)*(pixelL-clusters[clusterIdx].L) +
								(pixelA-clusters[clusterIdx].A)*(pixelA-clusters[clusterIdx].A) +
								(pixelB-clusters[clusterIdx].B)*(pixelB-clusters[clusterIdx].B),
						)
					} else {
						// Используем RGB цвет мазка как запасной вариант
						r := float64(stroke.Color[0]) / 255.0
						g := float64(stroke.Color[1]) / 255.0
						b := float64(stroke.Color[2]) / 255.0
						strokeL, strokeA, strokeB := rgbToLab(color.RGBA64{
							R: uint16(r * 65535),
							G: uint16(g * 65535),
							B: uint16(b * 65535),
							A: 65535,
						})

						colorDist = math.Sqrt(
							(pixelL-strokeL)*(pixelL-strokeL) +
								(pixelA-strokeA)*(pixelA-strokeA) +
								(pixelB-strokeB)*(pixelB-strokeB),
						)
					}

					// Комбинированное расстояние с весами
					// Баланс между пространственной и цветовой близостью
					spatialWeight := 0.3 // Меньший вес для пространственной близости
					colorWeight := 0.7   // Больший вес для цветовой близости

					// Нормализуем пространственное расстояние относительно размера изображения
					maxSpatialDist := float64(width*width + height*height)
					normalizedSpatialDist := spatialDist / maxSpatialDist

					// Нормализуем цветовое расстояние относительно максимального возможного в LAB
					// В пространстве LAB максимальное расстояние примерно 100 для L и 200 для a и b
					maxColorDist := math.Sqrt(100*100 + 200*200 + 200*200)
					normalizedColorDist := colorDist / maxColorDist

					combinedDist := spatialWeight*normalizedSpatialDist + colorWeight*normalizedColorDist

					if combinedDist < minCombinedDist {
						minCombinedDist = combinedDist
						nearestStrokeIdx = strokeIdx
					}
				}

				if nearestStrokeIdx >= 0 {
					// Добавляем пиксель в ближайший мазок
					strokes[nearestStrokeIdx].Pixels = append(strokes[nearestStrokeIdx].Pixels, [2]int{x, y})
					globalVisited[y][x] = true // Отмечаем пиксель как посещенный

					// Обновляем границы мазка если нужно
					if x < strokes[nearestStrokeIdx].MinX {
						strokes[nearestStrokeIdx].MinX = x
					}
					if x > strokes[nearestStrokeIdx].MaxX {
						strokes[nearestStrokeIdx].MaxX = x
					}
					if y < strokes[nearestStrokeIdx].MinY {
						strokes[nearestStrokeIdx].MinY = y
					}
					if y > strokes[nearestStrokeIdx].MaxY {
						strokes[nearestStrokeIdx].MaxY = y
					}

					// Обновляем размеры мазка
					strokes[nearestStrokeIdx].Width = float64(strokes[nearestStrokeIdx].MaxX - strokes[nearestStrokeIdx].MinX)
					strokes[nearestStrokeIdx].Height = float64(strokes[nearestStrokeIdx].MaxY - strokes[nearestStrokeIdx].MinY)
				}
			}
		}
	}

	// Нужно выполнить несколько итераций, чтобы обработать пиксели, которые не были соседними в первом проходе
	for iteration := 0; iteration < 5; iteration++ { // Максимум 5 итераций для обработки всех
		remainingPixels := false

		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if !globalVisited[y][x] {
					remainingPixels = true

					// Та же логика для поиска соседних кластеров
					dx := []int{0, 1, 0, -1}
					dy := []int{-1, 0, 1, 0}
					neighboringClusters := make(map[int]bool)

					for d := 0; d < 4; d++ {
						nx, ny := x+dx[d], y+dy[d]

						if nx >= 0 && nx < width && ny >= 0 && ny < height && globalVisited[ny][nx] {
							for i, stroke := range strokes {
								for _, pixelCoord := range stroke.Pixels {
									if pixelCoord[0] == nx && pixelCoord[1] == ny {
										neighboringClusters[i] = true
										break
									}
								}
							}
						}
					}

					if len(neighboringClusters) == 0 {
						continue
					}

					// Поиск ближайшего подходящего кластера
					minCombinedDist := math.Inf(1)
					nearestStrokeIdx := -1
					pixelL, pixelA, pixelB := rgbToLab(img.At(x, y))

					for strokeIdx := range neighboringClusters {
						if strokeIdx >= len(strokes) {
							continue
						}

						stroke := strokes[strokeIdx]

						// Пространственное расстояние
						dx := float64(x) - stroke.CenterX
						dy := float64(y) - stroke.CenterY
						spatialDist := dx*dx + dy*dy

						// Цветовое расстояние
						clusterIdx := -1
						for j, cluster := range clusters {
							if cluster.CenterX == stroke.CenterX && cluster.CenterY == stroke.CenterY {
								clusterIdx = j
								break
							}
						}

						var colorDist float64
						if clusterIdx >= 0 && clusterIdx < len(clusters) {
							colorDist = math.Sqrt(
								(pixelL-clusters[clusterIdx].L)*(pixelL-clusters[clusterIdx].L) +
									(pixelA-clusters[clusterIdx].A)*(pixelA-clusters[clusterIdx].A) +
									(pixelB-clusters[clusterIdx].B)*(pixelB-clusters[clusterIdx].B),
							)
						} else {
							r := float64(stroke.Color[0]) / 255.0
							g := float64(stroke.Color[1]) / 255.0
							b := float64(stroke.Color[2]) / 255.0
							strokeL, strokeA, strokeB := rgbToLab(color.RGBA64{
								R: uint16(r * 65535),
								G: uint16(g * 65535),
								B: uint16(b * 65535),
								A: 65535,
							})

							colorDist = math.Sqrt(
								(pixelL-strokeL)*(pixelL-strokeL) +
									(pixelA-strokeA)*(pixelA-strokeA) +
									(pixelB-strokeB)*(pixelB-strokeB),
							)
						}

						// Комбинированное расстояние
						spatialWeight := 0.3
						colorWeight := 0.7

						maxSpatialDist := float64(width*width + height*height)
						normalizedSpatialDist := spatialDist / maxSpatialDist

						maxColorDist := math.Sqrt(100*100 + 200*200 + 200*200)
						normalizedColorDist := colorDist / maxColorDist

						combinedDist := spatialWeight*normalizedSpatialDist + colorWeight*normalizedColorDist

						if combinedDist < minCombinedDist {
							minCombinedDist = combinedDist
							nearestStrokeIdx = strokeIdx
						}
					}

					if nearestStrokeIdx >= 0 {
						// Добавляем пиксель в ближайший мазок
						strokes[nearestStrokeIdx].Pixels = append(strokes[nearestStrokeIdx].Pixels, [2]int{x, y})
						globalVisited[y][x] = true

						// Обновляем границы и размеры мазка
						if x < strokes[nearestStrokeIdx].MinX {
							strokes[nearestStrokeIdx].MinX = x
						}
						if x > strokes[nearestStrokeIdx].MaxX {
							strokes[nearestStrokeIdx].MaxX = x
						}
						if y < strokes[nearestStrokeIdx].MinY {
							strokes[nearestStrokeIdx].MinY = y
						}
						if y > strokes[nearestStrokeIdx].MaxY {
							strokes[nearestStrokeIdx].MaxY = y
						}

						strokes[nearestStrokeIdx].Width = float64(strokes[nearestStrokeIdx].MaxX - strokes[nearestStrokeIdx].MinX)
						strokes[nearestStrokeIdx].Height = float64(strokes[nearestStrokeIdx].MaxY - strokes[nearestStrokeIdx].MinY)
					}
				}
			}
		}

		// Если не осталось непосещенных пикселей, выходим из цикла
		if !remainingPixels {
			break
		}
	}

	// Если после всех итераций остались неназначенные пиксели,
	// применим запасной подход для обеспечения 100% покрытия
	hasUnvisitedPixels := false
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if !globalVisited[y][x] {
				hasUnvisitedPixels = true
				break
			}
		}
		if hasUnvisitedPixels {
			break
		}
	}

	// Резервный механизм для любых оставшихся пикселей
	if hasUnvisitedPixels {
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				if !globalVisited[y][x] {
					// Ищем мазок с минимальным расстоянием (без проверки соседства)
					minDist := math.Inf(1)
					nearestStrokeIdx := -1

					for i, stroke := range strokes {
						dx := float64(x) - stroke.CenterX
						dy := float64(y) - stroke.CenterY
						dist := dx*dx + dy*dy

						if dist < minDist {
							minDist = dist
							nearestStrokeIdx = i
						}
					}

					if nearestStrokeIdx >= 0 {
						// Добавляем пиксель в ближайший мазок
						strokes[nearestStrokeIdx].Pixels = append(strokes[nearestStrokeIdx].Pixels, [2]int{x, y})
						globalVisited[y][x] = true

						// Обновляем границы и размеры мазка
						if x < strokes[nearestStrokeIdx].MinX {
							strokes[nearestStrokeIdx].MinX = x
						}
						if x > strokes[nearestStrokeIdx].MaxX {
							strokes[nearestStrokeIdx].MaxX = x
						}
						if y < strokes[nearestStrokeIdx].MinY {
							strokes[nearestStrokeIdx].MinY = y
						}
						if y > strokes[nearestStrokeIdx].MaxY {
							strokes[nearestStrokeIdx].MaxY = y
						}

						strokes[nearestStrokeIdx].Width = float64(strokes[nearestStrokeIdx].MaxX - strokes[nearestStrokeIdx].MinX)
						strokes[nearestStrokeIdx].Height = float64(strokes[nearestStrokeIdx].MaxY - strokes[nearestStrokeIdx].MinY)
					}
				}
			}
		}
	}

	// Сортируем мазки по размеру
	for i := 0; i < len(strokes); i++ {
		for j := i + 1; j < len(strokes); j++ {
			if len(strokes[i].Pixels) < len(strokes[j].Pixels) {
				strokes[i], strokes[j] = strokes[j], strokes[i]
			}
		}
	}

	return strokes
}
