package handlers

import (
	"encoding/json"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

// SuperpixelRequest represents the parameters for the superpixel processing
type SuperpixelRequest struct {
	NumberOfSuperpixels int     `json:"numberOfSuperpixels"`
	CompactnessFactor   float64 `json:"compactnessFactor"`
	Elongation          float64 `json:"elongation"` // p parameter in the formula
	Iterations          int     `json:"iterations"`
}

// SuperpixelResponse represents the result of superpixel processing
type SuperpixelResponse struct {
	ImageURL string `json:"imageUrl"`
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

	// Process image with modified SLIC algorithm
	resultImg := h.modifiedSLIC(img, req.NumberOfSuperpixels, req.CompactnessFactor, req.Elongation, req.Iterations)

	// Save resulting image
	filename := filepath.Base(header.Filename)
	if filename == "" {
		// Generate a random name if needed
		filename = "processed_" + filepath.Base(header.Filename)
	}
	outputPath := filepath.Join(h.uploadDir, filename)
	outputFile, err := createFile(outputPath)
	if err != nil {
		http.Error(w, "Failed to create output file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer outputFile.Close()

	if err := png.Encode(outputFile, resultImg); err != nil {
		http.Error(w, "Failed to encode output image: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return URL to the processed image
	resp := SuperpixelResponse{
		ImageURL: "/uploads/" + filename,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// Utility to create a file with proper permissions
func createFile(path string) (*os.File, error) {
	return os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0666)
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

// modifiedSLIC implements the modified SLIC algorithm with elliptical distance
func (h *ImageProcessingHandler) modifiedSLIC(img image.Image, numberOfSuperpixels int, compactness float64, elongation float64, iterations int) image.Image {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Convert image to LAB color space and compute gradients
	labImg, gradients := h.preprocessImage(img)

	// Initialize clusters
	clusters := h.initializeClusters(labImg, gradients, numberOfSuperpixels, width, height)

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
						dist := colorDist + compactness*spatialDist/float64(S)

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
					theta := calculateTheta(img, x, y)
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

			sumX, sumY, sumL, sumA, sumB, sumTheta := 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
			for _, p := range clusters[i].Pixels {
				sumX += float64(p.X)
				sumY += float64(p.Y)
				sumL += p.L
				sumA += p.A
				sumB += p.B
				sumTheta += p.Theta
			}

			n := float64(len(clusters[i].Pixels))
			clusters[i].CenterX = sumX / n
			clusters[i].CenterY = sumY / n
			clusters[i].L = sumL / n
			clusters[i].A = sumA / n
			clusters[i].B = sumB / n
			clusters[i].Theta = sumTheta / n
		}
	}

	// Create the output image
	return h.createOutputImage(img, clusters, labels)
}

// calculateTheta calculates the angle perpendicular to the gradient at (x,y)
func calculateTheta(img image.Image, x, y int) float64 {
	// Simple implementation - in a real app you'd want more sophisticated gradient calculation
	bounds := img.Bounds()
	if x <= bounds.Min.X || x >= bounds.Max.X-1 || y <= bounds.Min.Y || y >= bounds.Max.Y-1 {
		return 0 // Default for borders
	}

	// Calculate gradient using Sobel operator
	r1, g1, b1 := rgbToFloat(img.At(x+1, y))
	r2, g2, b2 := rgbToFloat(img.At(x-1, y))
	r3, g3, b3 := rgbToFloat(img.At(x, y+1))
	r4, g4, b4 := rgbToFloat(img.At(x, y-1))

	// Use luminance as gradient measure
	lum1 := 0.2126*r1 + 0.7152*g1 + 0.0722*b1
	lum2 := 0.2126*r2 + 0.7152*g2 + 0.0722*b2
	lum3 := 0.2126*r3 + 0.7152*g3 + 0.0722*b3
	lum4 := 0.2126*r4 + 0.7152*g4 + 0.0722*b4

	// Compute gradient in x and y directions
	gx := lum1 - lum2
	gy := lum3 - lum4

	// Return angle perpendicular to gradient
	return math.Atan2(-gx, gy)
}

// rgbToFloat converts a color.Color to r,g,b float values
func rgbToFloat(c color.Color) (float64, float64, float64) {
	r, g, b, _ := c.RGBA()
	return float64(r) / 65535.0, float64(g) / 65535.0, float64(b) / 65535.0
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

// initializeClusters initializes the superpixel clusters
func (h *ImageProcessingHandler) initializeClusters(pixels [][]Pixel, gradients [][][]float64, numberOfSuperpixels int, width, height int) []Cluster {
	// Compute grid interval
	S := int(math.Sqrt(float64(width*height) / float64(numberOfSuperpixels)))

	// Initialize clusters on a regular grid
	clusters := []Cluster{}
	for y := S / 2; y < height; y += S {
		for x := S / 2; x < width; x += S {
			// Find local minimum gradient in 3x3 neighborhood
			minGradient := math.Inf(1)
			minX, minY := x, y

			for ny := -1; ny <= 1; ny++ {
				for nx := -1; nx <= 1; nx++ {
					newX, newY := x+nx, y+ny

					if newX >= 0 && newX < width && newY >= 0 && newY < height {
						gx := gradients[newY][newX][0]
						gy := gradients[newY][newX][1]
						g := gx*gx + gy*gy

						if g < minGradient {
							minGradient = g
							minX, minY = newX, newY
						}
					}
				}
			}

			// Create cluster at local minimum
			pixel := pixels[minY][minX]
			clusters = append(clusters, Cluster{
				CenterX: float64(minX),
				CenterY: float64(minY),
				L:       pixel.L,
				A:       pixel.A,
				B:       pixel.B,
				Theta:   pixel.Theta,
			})
		}
	}

	return clusters
}

// createOutputImage creates the final output image with superpixels
func (h *ImageProcessingHandler) createOutputImage(img image.Image, clusters []Cluster, labels [][]int) image.Image {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Create output image
	output := image.NewRGBA(bounds)

	// Fill output with cluster average colors
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			clusterIdx := labels[y][x]
			if clusterIdx >= 0 && clusterIdx < len(clusters) {
				c := clusters[clusterIdx]
				r, g, b := labToRgb(c.L, c.A, c.B)
				output.Set(x+bounds.Min.X, y+bounds.Min.Y, color.RGBA{
					R: uint8(r * 255),
					G: uint8(g * 255),
					B: uint8(b * 255),
					A: 255,
				})
			} else {
				output.Set(x+bounds.Min.X, y+bounds.Min.Y, img.At(x+bounds.Min.X, y+bounds.Min.Y))
			}
		}
	}

	return output
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
