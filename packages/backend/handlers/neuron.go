package handlers

import (
	"encoding/json"
	"math"
	"net/http"
)

const (
	// Simulation constants
	DefaultSimTime     = 0.03   // 30ms
	DefaultTimeStep    = 0.5e-7 // 50ns (from MATLAB)
	DefaultCapacitance = 200e-9 // 200nF (from MATLAB)
)

// Model types
const (
	DiodeGI401A = "GI401A"
	DiodeGI403A = "GI403A"
	DiodeBD4    = "BD4"
	DiodeBD5    = "BD5"
)

// NeuronSimulationHandler handles neuron simulation requests
type NeuronSimulationHandler struct{}

// NewNeuronSimulationHandler creates a new NeuronSimulationHandler
func NewNeuronSimulationHandler() *NeuronSimulationHandler {
	return &NeuronSimulationHandler{}
}

// SimulationRequest represents a request for neuron simulation
type SimulationRequest struct {
	// Neuron parameters
	Capacitance     float64 `json:"capacitance"`     // Capacitance in F
	TuningVoltage   float64 `json:"tuningVoltage"`   // E_VM - tuning voltage in V
	ModVoltage      float64 `json:"modVoltage"`      // E_TD - modulatory voltage in V
	InvertMemristor bool    `json:"invertMemristor"` // Memristor connection type

	// Tunnel diode model
	DiodeModel string `json:"diodeModel"` // Tunnel diode model name

	// Input signal parameters
	SignalType   string          `json:"signalType"`   // Constant, Step, Pulse, Sine, PinkNoise, Custom
	SignalParams json.RawMessage `json:"signalParams"` // Signal-specific parameters

	// Simulation settings
	SimTime  float64 `json:"simTime"`  // Simulation time in seconds
	TimeStep float64 `json:"timeStep"` // Time step in seconds
}

// TimePoint represents a single time point in the simulation results
type TimePoint struct {
	T float64 `json:"t"` // Time in seconds
	V float64 `json:"v"` // Voltage in volts
	X float64 `json:"x"` // Internal state variable of memristor
	I float64 `json:"i"` // Input current
}

// SimulationResponse represents the response to a simulation request
type SimulationResponse struct {
	Data       []TimePoint            `json:"data"`       // Simulation data points
	Parameters map[string]interface{} `json:"parameters"` // Echo back parameters used
}

// ExcitabilityResponse represents data for excitability test
type ExcitabilityResponse struct {
	Class       int       `json:"class"`       // Excitability class (1, 2, or 3)
	Frequencies []float64 `json:"frequencies"` // Frequencies at different current levels
	Currents    []float64 `json:"currents"`    // Current values used
}

// ParameterMapResponse represents a parameter map for different operating regions
type ParameterMapResponse struct {
	XValues []float64   `json:"xValues"` // X-axis values
	YValues []float64   `json:"yValues"` // Y-axis values
	Classes [][]int     `json:"classes"` // Class for each x,y point
	Ranges  [][]float64 `json:"ranges"`  // Operating range for each x,y point (optional)
}

// TimeSeriesSimulation handles time series simulation requests
func (h *NeuronSimulationHandler) TimeSeriesSimulation(w http.ResponseWriter, r *http.Request) {
	var req SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Apply defaults if necessary
	if req.SimTime <= 0 {
		req.SimTime = DefaultSimTime
	}
	if req.TimeStep <= 0 {
		req.TimeStep = DefaultTimeStep
	}
	if req.Capacitance <= 0 {
		req.Capacitance = DefaultCapacitance
	}
	if req.DiodeModel == "" {
		req.DiodeModel = DiodeGI401A
	}

	// Run the simulation
	result, err := h.runSimulation(req)
	if err != nil {
		http.Error(w, "Simulation error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the results
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// ExcitabilityTest handles excitability class test requests
func (h *NeuronSimulationHandler) ExcitabilityTest(w http.ResponseWriter, r *http.Request) {
	var req SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Run series of simulations with different current levels
	result, err := h.testExcitability(req)
	if err != nil {
		http.Error(w, "Excitability test error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the results
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// ParameterMap handles parameter map generation requests
func (h *NeuronSimulationHandler) ParameterMap(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SimulationRequest
		MapType string  `json:"mapType"` // ETDvsC or ETDvsEVM
		XStart  float64 `json:"xStart"`  // Starting X value
		XEnd    float64 `json:"xEnd"`    // Ending X value
		XPoints int     `json:"xPoints"` // Number of X points
		YStart  float64 `json:"yStart"`  // Starting Y value
		YEnd    float64 `json:"yEnd"`    // Ending Y value
		YPoints int     `json:"yPoints"` // Number of Y points
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Generate the parameter map
	result, err := h.generateParameterMap(req.SimulationRequest, req.MapType,
		req.XStart, req.XEnd, req.XPoints, req.YStart, req.YEnd, req.YPoints)
	if err != nil {
		http.Error(w, "Parameter map generation error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the results
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// CustomSignalUpload handles custom input signal uploads
func (h *NeuronSimulationHandler) CustomSignalUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("signalFile")
	if err != nil {
		http.Error(w, "Failed to get signal file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Process the signal file based on its format (WAV/CSV)
	// ...

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "Signal processed successfully",
	})
}

// Simulation implementation functions
func (h *NeuronSimulationHandler) runSimulation(req SimulationRequest) (*SimulationResponse, error) {
	// Create simulation parameters
	params := map[string]interface{}{
		"capacitance":     req.Capacitance,
		"tuningVoltage":   req.TuningVoltage,
		"modVoltage":      req.ModVoltage,
		"diodeModel":      req.DiodeModel,
		"invertMemristor": req.InvertMemristor,
		"signalType":      req.SignalType,
		"simTime":         req.SimTime,
		"timeStep":        req.TimeStep,
	}

	// Parse signal parameters based on signal type
	var inputSignal func(t float64) float64
	switch req.SignalType {
	case "Constant":
		var signalParams struct {
			Amplitude float64 `json:"amplitude"`
		}
		if err := json.Unmarshal(req.SignalParams, &signalParams); err != nil {
			return nil, err
		}
		params["signalAmplitude"] = signalParams.Amplitude
		inputSignal = func(t float64) float64 {
			return signalParams.Amplitude
		}

	case "Step":
		var signalParams struct {
			BeforeStep float64 `json:"beforeStep"`
			AfterStep  float64 `json:"afterStep"`
			StepTime   float64 `json:"stepTime"`
		}
		if err := json.Unmarshal(req.SignalParams, &signalParams); err != nil {
			return nil, err
		}
		params["beforeStep"] = signalParams.BeforeStep
		params["afterStep"] = signalParams.AfterStep
		params["stepTime"] = signalParams.StepTime
		inputSignal = func(t float64) float64 {
			if t < signalParams.StepTime {
				return signalParams.BeforeStep
			}
			return signalParams.AfterStep
		}

	case "Pulse":
		var signalParams struct {
			Baseline    float64 `json:"baseline"`
			Amplitude   float64 `json:"amplitude"`
			PulseStart  float64 `json:"pulseStart"`
			PulseWidth  float64 `json:"pulseWidth"`
			PulseNumber int     `json:"pulseNumber"`
			PulsePeriod float64 `json:"pulsePeriod"`
		}
		if err := json.Unmarshal(req.SignalParams, &signalParams); err != nil {
			return nil, err
		}
		for k, v := range map[string]interface{}{
			"baseline":    signalParams.Baseline,
			"amplitude":   signalParams.Amplitude,
			"pulseStart":  signalParams.PulseStart,
			"pulseWidth":  signalParams.PulseWidth,
			"pulseNumber": signalParams.PulseNumber,
			"pulsePeriod": signalParams.PulsePeriod,
		} {
			params[k] = v
		}
		inputSignal = func(t float64) float64 {
			if t < signalParams.PulseStart {
				return signalParams.Baseline
			}
			t = t - signalParams.PulseStart
			pulseIdx := int(t / signalParams.PulsePeriod)
			if pulseIdx >= signalParams.PulseNumber {
				return signalParams.Baseline
			}
			tInPeriod := t - float64(pulseIdx)*signalParams.PulsePeriod
			if tInPeriod < signalParams.PulseWidth {
				return signalParams.Baseline + signalParams.Amplitude
			}
			return signalParams.Baseline
		}

	case "Sine":
		var signalParams struct {
			Offset    float64 `json:"offset"`
			Amplitude float64 `json:"amplitude"`
			Frequency float64 `json:"frequency"`
			Phase     float64 `json:"phase"`
		}
		if err := json.Unmarshal(req.SignalParams, &signalParams); err != nil {
			return nil, err
		}
		for k, v := range map[string]interface{}{
			"offset":    signalParams.Offset,
			"amplitude": signalParams.Amplitude,
			"frequency": signalParams.Frequency,
			"phase":     signalParams.Phase,
		} {
			params[k] = v
		}
		inputSignal = func(t float64) float64 {
			return signalParams.Offset + signalParams.Amplitude*
				math.Sin(2*math.Pi*signalParams.Frequency*t+signalParams.Phase)
		}

	case "PinkNoise":
		var signalParams struct {
			Baseline  float64 `json:"baseline"`
			Amplitude float64 `json:"amplitude"`
			Frequency float64 `json:"frequency"`
		}
		if err := json.Unmarshal(req.SignalParams, &signalParams); err != nil {
			return nil, err
		}
		for k, v := range map[string]interface{}{
			"baseline":  signalParams.Baseline,
			"amplitude": signalParams.Amplitude,
			"frequency": signalParams.Frequency,
		} {
			params[k] = v
		}

		// Simple approximation of pink noise using a few sine waves with different frequencies
		inputSignal = func(t float64) float64 {
			noise := 0.0
			for i := 1; i <= 5; i++ {
				// Decrease amplitude as frequency increases
				amp := signalParams.Amplitude / math.Sqrt(float64(i))
				// Use prime numbers for frequencies to avoid periodicity
				freq := signalParams.Frequency * float64(2*i+1)
				// Random-like phase based on the frequency
				phase := math.Pi * float64(i) / 5.0
				noise += amp * math.Sin(2*math.Pi*freq*t+phase)
			}
			return signalParams.Baseline + noise
		}

	default:
		// Default to zero input if unknown signal type
		inputSignal = func(t float64) float64 {
			return 0.0
		}
	}

	// Prepare for the simulation
	totalSteps := int(req.SimTime / req.TimeStep)
	// Limit data points for large simulations (downsample)
	maxPoints := 10000
	decimationFactor := 1
	if totalSteps > maxPoints {
		decimationFactor = totalSteps / maxPoints
		if decimationFactor < 1 {
			decimationFactor = 1
		}
	}
	dataLen := totalSteps / decimationFactor

	// Initialize result arrays
	data := make([]TimePoint, dataLen)

	// Initial conditions
	v := 0.0 // initial voltage
	x := 0.5 // initial memristor state variable
	t := 0.0

	// Memristor parameters
	xMin := 0.0 // Minimum memristor state
	xMax := 1.0 // Maximum memristor state

	dataIndex := 0
	// Run Runge-Kutta 4th order integration
	for step := 0; step < totalSteps; step++ {
		// Save results at decimated intervals
		if step%decimationFactor == 0 {
			i := inputSignal(t)
			data[dataIndex] = TimePoint{
				T: t,
				V: validateValue(v),
				X: validateValue(x),
				I: validateValue(i),
			}
			dataIndex++
		}

		// Fourth-order Runge-Kutta method for solving the ODE
		k1v, k1x := h.derivatives(v, x, t, req, inputSignal)
		k2v, k2x := h.derivatives(v+0.5*req.TimeStep*k1v, x+0.5*req.TimeStep*k1x, t+0.5*req.TimeStep, req, inputSignal)
		k3v, k3x := h.derivatives(v+0.5*req.TimeStep*k2v, x+0.5*req.TimeStep*k2x, t+0.5*req.TimeStep, req, inputSignal)
		k4v, k4x := h.derivatives(v+req.TimeStep*k3v, x+req.TimeStep*k3x, t+req.TimeStep, req, inputSignal)

		// Update v and x
		v += req.TimeStep * (k1v + 2*k2v + 2*k3v + k4v) / 6
		x += req.TimeStep * (k1x + 2*k2x + 2*k3x + k4x) / 6

		// Check for unstable simulation
		if math.IsNaN(v) || math.IsInf(v, 0) {
			v = 0.0 // Reset to a safe value
		}

		// Constrain memristor state to valid range
		if x < xMin || math.IsNaN(x) || math.IsInf(x, -1) {
			x = xMin
		} else if x > xMax || math.IsInf(x, 1) {
			x = xMax
		}

		// Advance time
		t += req.TimeStep
	}

	return &SimulationResponse{
		Data:       data,
		Parameters: params,
	}, nil
}

// derivatives calculates the derivatives of voltage and memristor state
func (h *NeuronSimulationHandler) derivatives(v, x, t float64, req SimulationRequest,
	inputSignal func(float64) float64) (float64, float64) {

	// Calculate voltages
	vd := v + 0.0 // U1 = 0
	vm := v + 0.1 // U2 = 0.1

	// Calculate tunnel diode current based on model
	var id float64
	switch req.DiodeModel {
	case DiodeGI401A:
		id = gi401Model(vd)
	case DiodeGI403A:
		id = gi403Model(vd)
	case DiodeBD4:
		id = bd4Model(vd)
	case DiodeBD5:
		id = bd5Model(vd)
	default:
		id = gi401Model(vd) // Default to GI401A
	}

	// Calculate memristor current and state derivative
	im, ix := andTSModel(vm, x)

	// Input current
	iin := inputSignal(t)
	if iin == 0 {
		iin = 66e-6 // Default from MATLAB
	}

	// Derivatives
	dvdt := (iin - im - id) / req.Capacitance
	dxdt := ix

	return dvdt, dxdt
}

func andTSModel(v1, v2 float64) (float64, float64) {
	const (
		Ron     = 1434
		Roff    = 1e6
		Von1    = 0.28
		Voff1   = 0.14
		Von2    = -0.12
		Voff2   = -0.006
		TAU     = 0.0000001
		T       = 0.5
		boltz   = 1.380649e-23
		echarge = 1.602176634e-19
	)

	// Calculate Ix
	term1 := 1 / (1 + math.Exp(-1/(T*boltz/echarge)*(v1-Von1)*(v1-Von2)))
	term2 := 1 - (1 / (1 + math.Exp(-1/(T*boltz/echarge)*(v1-Voff2)*(v1-Voff1))))
	ix := (1 / TAU) * (term1*(1-v2) - term2*v2)

	// Calculate Imem
	g := func(v float64) float64 {
		return v/Ron + (1-v)/Roff
	}
	imem := v1 * g(v2)

	return imem, ix
}

func gi401Model(e float64) float64 {
	const (
		Is = 1.1e-7
		Vt = 1.0 / 17.0
		Vp = 0.037
		Ip = 6.4e-5
		Iv = 6e-6
		D  = 20
		E  = 0.09
	)

	idiode := func(e float64) float64 {
		return Is * (math.Exp(e/Vt) - math.Exp(-e/Vt))
	}

	itunnel := func(e float64) float64 {
		return Ip / Vp * e * math.Exp(-(e-Vp)/Vp)
	}

	iex := func(e float64) float64 {
		return Iv * (math.Atan(D*(e-E)) + math.Atan(D*(e+E)))
	}

	return idiode(e) + itunnel(e) + iex(e)
}

func gi403Model(e float64) float64 {
	const (
		Is = 1.1e-7
		Vt = 1.0 / 17.0
		Vp = 0.039
		Ip = 6.2e-5
		Iv = 6e-6
		D  = 20
		E  = 0.09
	)

	idiode := func(e float64) float64 {
		return Is * (math.Exp(e/Vt) - math.Exp(-e/Vt))
	}

	itunnel := func(e float64) float64 {
		return Ip / Vp * e * math.Exp(-(e-Vp)/Vp)
	}

	iex := func(e float64) float64 {
		return Iv * (math.Atan(D*(e-E)) + math.Atan(D*(e+E)))
	}

	return idiode(e) + itunnel(e) + iex(e)
}

func bd4Model(e float64) float64 {
	const (
		Is = 1.1e-7
		Vt = 1.0 / 17.0
		Vp = 0.035
		Ip = 6.0e-5
		Iv = 6e-6
		D  = 20
		E  = 0.09
	)

	idiode := func(e float64) float64 {
		return Is * (math.Exp(e/Vt) - math.Exp(-e/Vt))
	}

	itunnel := func(e float64) float64 {
		return Ip / Vp * e * math.Exp(-(e-Vp)/Vp)
	}

	iex := func(e float64) float64 {
		return Iv * (math.Atan(D*(e-E)) + math.Atan(D*(e+E)))
	}

	return idiode(e) + itunnel(e) + iex(e)
}

func bd5Model(e float64) float64 {
	const (
		Is = 1.1e-7
		Vt = 1.0 / 17.0
		Vp = 0.033
		Ip = 5.8e-5
		Iv = 6e-6
		D  = 20
		E  = 0.09
	)

	idiode := func(e float64) float64 {
		return Is * (math.Exp(e/Vt) - math.Exp(-e/Vt))
	}

	itunnel := func(e float64) float64 {
		return Ip / Vp * e * math.Exp(-(e-Vp)/Vp)
	}

	iex := func(e float64) float64 {
		return Iv * (math.Atan(D*(e-E)) + math.Atan(D*(e+E)))
	}

	return idiode(e) + itunnel(e) + iex(e)
}

// Current-voltage characteristics for different tunnel diode models
func gi401ACurrentVoltageCharacteristic() [][]float64 {
	return [][]float64{
		{0.00, 0.000000},
		{0.02, 0.000800},
		{0.04, 0.002000},
		{0.06, 0.004000},
		{0.08, 0.008000},
		{0.10, 0.010000},
		{0.12, 0.009000},
		{0.14, 0.007000},
		{0.16, 0.005000},
		{0.18, 0.003000},
		{0.20, 0.002000},
		{0.22, 0.002000},
		{0.24, 0.002500},
		{0.26, 0.004000},
		{0.28, 0.008000},
		{0.30, 0.015000},
		{0.32, 0.025000},
		{0.34, 0.040000},
		{0.36, 0.060000},
		{0.38, 0.085000},
		{0.40, 0.120000},
	}
}

func gi403ACurrentVoltageCharacteristic() [][]float64 {
	return [][]float64{
		{0.00, 0.000000},
		{0.02, 0.000600},
		{0.04, 0.001500},
		{0.06, 0.003000},
		{0.08, 0.006000},
		{0.10, 0.012000},
		{0.12, 0.011000},
		{0.14, 0.009500},
		{0.16, 0.008000},
		{0.18, 0.006500},
		{0.20, 0.005000},
		{0.22, 0.004000},
		{0.24, 0.003500},
		{0.26, 0.003500},
		{0.28, 0.004500},
		{0.30, 0.008000},
		{0.32, 0.015000},
		{0.34, 0.025000},
		{0.36, 0.045000},
		{0.38, 0.070000},
		{0.40, 0.100000},
	}
}

func bd4CurrentVoltageCharacteristic() [][]float64 {
	return [][]float64{
		{0.00, 0.000000},
		{0.02, 0.000400},
		{0.04, 0.001200},
		{0.06, 0.002500},
		{0.08, 0.005000},
		{0.10, 0.008000},
		{0.12, 0.010000},
		{0.14, 0.008500},
		{0.16, 0.006000},
		{0.18, 0.004000},
		{0.20, 0.003000},
		{0.22, 0.002500},
		{0.24, 0.002800},
		{0.26, 0.003500},
		{0.28, 0.006000},
		{0.30, 0.010000},
		{0.32, 0.017000},
		{0.34, 0.030000},
		{0.36, 0.050000},
		{0.38, 0.075000},
		{0.40, 0.100000},
	}
}

func bd5CurrentVoltageCharacteristic() [][]float64 {
	return [][]float64{
		{0.00, 0.000000},
		{0.02, 0.000900},
		{0.04, 0.002200},
		{0.06, 0.004500},
		{0.08, 0.009000},
		{0.10, 0.014000},
		{0.12, 0.012000},
		{0.14, 0.009000},
		{0.16, 0.006000},
		{0.18, 0.003500},
		{0.20, 0.002000},
		{0.22, 0.001200},
		{0.24, 0.001000},
		{0.26, 0.001500},
		{0.28, 0.003000},
		{0.30, 0.007000},
		{0.32, 0.015000},
		{0.34, 0.030000},
		{0.36, 0.055000},
		{0.38, 0.090000},
		{0.40, 0.130000},
	}
}

func (h *NeuronSimulationHandler) testExcitability(req SimulationRequest) (*ExcitabilityResponse, error) {
	// В реальной реализации здесь запускались бы множественные симуляции
	// с разными уровнями тока и анализировались бы результаты

	// Определяем класс возбудимости на основе нескольких параметров
	class := 1

	// Нормализованные параметры для более простой классификации
	normCapacitance := req.Capacitance / 22e-9 // Нормализуем относительно базового значения 22 нФ

	// Основные пограничные значения для классификации
	// Класс 1: высокая емкость + среднее модуляционное напряжение
	// Класс 2: низкая емкость ИЛИ высокое модуляционное напряжение
	// Класс 3: очень низкое модуляционное напряжение

	if req.ModVoltage < 0.02 {
		class = 3 // Класс 3 в основном определяется низким модуляционным напряжением
	} else if req.ModVoltage > 0.07 || normCapacitance < 0.5 {
		class = 2 // Класс 2 - высокое модуляционное напряжение или низкая емкость
	} else if req.ModVoltage >= 0.02 && req.ModVoltage <= 0.05 && normCapacitance >= 1.0 {
		class = 1 // Класс 1 - среднее модуляционное напряжение и высокая емкость
	}

	// Учитываем также влияние напряжения настройки
	if req.TuningVoltage > 0.1 {
		// Высокое положительное напряжение настройки смещает к классу 2
		if class == 1 {
			class = 2
		}
	} else if req.TuningVoltage < -0.1 {
		// Высокое отрицательное напряжение настройки может привести к классу 3
		if class == 1 || (class == 2 && req.ModVoltage < 0.05) {
			class = 3
		}
	}

	currents := make([]float64, 10)
	frequencies := make([]float64, 10)

	// Генерируем ответы в зависимости от класса
	for i := 0; i < 10; i++ {
		currents[i] = 20e-6 + float64(i)*5e-6

		if class == 1 {
			// Класс 1: Плавно возрастающая частота со смещением в зависимости от емкости
			frequencies[i] = float64(i) * 100 * (1.0 / normCapacitance)
		} else if class == 2 {
			// Класс 2: Порог и затем постоянная частота
			threshold := 2 * normCapacitance
			if threshold < 1 {
				threshold = 1
			}

			if i > int(threshold) {
				// Частота выше для более высокого модуляционного напряжения
				frequencies[i] = 500 * (req.ModVoltage / 0.07)
			}
		} else if class == 3 {
			// Класс 3: Одиночный импульс
			if i == 5 {
				frequencies[i] = 10
			}
		}
	}

	return &ExcitabilityResponse{
		Class:       class,
		Frequencies: frequencies,
		Currents:    currents,
	}, nil
}

func (h *NeuronSimulationHandler) generateParameterMap(
	req SimulationRequest,
	mapType string,
	xStart, xEnd float64,
	xPoints int,
	yStart, yEnd float64,
	yPoints int) (*ParameterMapResponse, error) {

	// В реальной реализации здесь запускались бы симуляции для каждой точки
	// параметрического пространства и классифицировалось бы поведение

	// Подготовка массивов значений по осям
	xValues := make([]float64, xPoints)
	for i := 0; i < xPoints; i++ {
		xValues[i] = xStart + float64(i)*(xEnd-xStart)/float64(xPoints-1)
	}

	yValues := make([]float64, yPoints)
	for i := 0; i < yPoints; i++ {
		yValues[i] = yStart + float64(i)*(yEnd-yStart)/float64(yPoints-1)
	}

	// Массивы для результатов классификации и диапазонов
	classes := make([][]int, yPoints)
	ranges := make([][]float64, yPoints)

	// Базовое значение для нормализации
	baseCapacitance := 22e-9 // 22 нФ

	// Для каждой точки параметрического пространства
	for i := 0; i < yPoints; i++ {
		classes[i] = make([]int, xPoints)
		ranges[i] = make([]float64, xPoints)

		for j := 0; j < xPoints; j++ {
			// Вычисляем класс в зависимости от типа карты и координат
			if mapType == "ETDvsC" {
				// Карта E_TD (ось X) vs Capacitance (ось Y)
				modVoltage := xValues[j]                         // E_TD по оси X
				capacitance := yValues[i]                        // Емкость по оси Y
				normCapacitance := capacitance / baseCapacitance // Нормализованная емкость

				// Определяем класс на основе значений
				if modVoltage < 0.02 {
					classes[i][j] = 3 // Класс 3: очень низкое E_TD
				} else if modVoltage > 0.07 || normCapacitance < 0.5 {
					classes[i][j] = 2 // Класс 2: высокое E_TD или низкая емкость
				} else if modVoltage >= 0.02 && modVoltage <= 0.05 && normCapacitance >= 1.0 {
					classes[i][j] = 1 // Класс 1: среднее E_TD и высокая емкость
				} else {
					// Промежуточная область между классами 1 и 2
					if modVoltage*normCapacitance > 0.04 {
						classes[i][j] = 1
					} else {
						classes[i][j] = 2
					}
				}

				// Диапазон токов (например, ток, при котором начинается генерация)
				ranges[i][j] = 10e-6 + (modVoltage * normCapacitance * 100e-6)
			} else {
				// Карта E_TD (ось X) vs E_VM (ось Y)
				modVoltage := xValues[j]    // E_TD по оси X
				tuningVoltage := yValues[i] // E_VM по оси Y

				// Сначала определяем класс на основе E_TD (как выше)
				if modVoltage < 0.02 {
					classes[i][j] = 3 // Очень низкое модуляционное напряжение -> Класс 3
				} else if modVoltage > 0.07 {
					classes[i][j] = 2 // Высокое модуляционное напряжение -> Класс 2
				} else {
					classes[i][j] = 1 // Среднее модуляционное напряжение -> Класс 1
				}

				// Затем модифицируем на основе E_VM
				if tuningVoltage > 0.06 {
					// Высокое положительное E_VM смещает к классу 2
					if classes[i][j] == 1 {
						classes[i][j] = 2
					}
				} else if tuningVoltage < -0.06 {
					// Высокое отрицательное E_VM может привести к классу 3
					if classes[i][j] != 3 && modVoltage < 0.06 {
						classes[i][j] = 3
					}
				}

				// Переходная зона между классами
				if abs(tuningVoltage) < 0.02 && modVoltage > 0.03 && modVoltage < 0.06 {
					if modVoltage*(1+tuningVoltage) > 0.045 {
						classes[i][j] = 2
					} else {
						classes[i][j] = 1
					}
				}

				// Диапазон токов
				ranges[i][j] = 10e-6 + ((modVoltage + abs(tuningVoltage)*0.5) * 100e-6)
			}
		}
	}

	return &ParameterMapResponse{
		XValues: xValues,
		YValues: yValues,
		Classes: classes,
		Ranges:  ranges,
	}, nil
}

// Вспомогательная функция для вычисления абсолютного значения
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// Helper function to ensure values can be encoded in JSON
func validateValue(val float64) float64 {
	if math.IsNaN(val) || math.IsInf(val, 0) {
		return 0.0
	}
	// Limit extremely large values
	if val > 1e10 {
		return 1e10
	}
	if val < -1e10 {
		return -1e10
	}
	return val
}
