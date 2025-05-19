package handlers

import (
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
)

const (
	// Simulation constants
	DefaultSimTime     = 0.03   // 30ms
	DefaultTimeStep    = 0.5e-7 // 50ns (from MATLAB)
	DefaultCapacitance = 22e-9  // 22nF
)

// Model types
const (
	DiodeGI401A = "GI401A"
	DiodeGI403A = "GI403A"
	DiodeBD4    = "BD4"
	DiodeBD5    = "BD5"
)

// RK Method types
const (
	RK1 = "RK1"
	RK2 = "RK2"
	RK4 = "RK4"
	RK8 = "RK8"
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
	RKMethod string  `json:"rkMethod"` // Runge-Kutta method (RK1, RK2, RK4, RK8)
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

// DiodeParams holds all parameters needed for tunnel diode modeling
type DiodeParams struct {
	Is float64 // Saturation current
	Vt float64 // Thermal voltage
	Vp float64 // Peak voltage
	Ip float64 // Peak current
	Iv float64 // Valley current
	D  float64 // Parameter D
	E  float64 // Parameter E
}

// Diode model parameters from the table
var diodeModels = map[string]DiodeParams{
	DiodeGI401A: {
		Is: 1.16e-7,  // 1.16 · 10^-7
		Vt: 0.066,    // Vi value from table
		Vp: 0.090,    // Vp value from table
		Ip: 2.17e-5,  // 2.17 · 10^-5
		Iv: -3.22e-6, // -3.22 · 10^-6
		D:  26,       // D value from table
		E:  0.14,     // E value from table
	},
	DiodeGI403A: {
		Is: 1.10e-7, // 1.10 · 10^-7
		Vt: 0.059,   // Vi value from table
		Vp: 0.037,   // Vp value from table
		Ip: 6.40e-5, // 6.40 · 10^-5
		Iv: 6.00e-6, // 6.00 · 10^-6
		D:  20,      // D value from table
		E:  0.09,    // E value from table
	},
	DiodeBD4: {
		Is: 1.00e-8, // 1.00 · 10^-8
		Vt: 0.047,   // Vi value from table
		Vp: 0.040,   // Vp value from table
		Ip: 4.80e-5, // 4.80 · 10^-5
		Iv: 2.00e-6, // 2.00 · 10^-6
		D:  24,      // D value from table
		E:  0.15,    // E value from table
	},
	DiodeBD5: {
		Is: 1.00e-8, // 1.00 · 10^-8
		Vt: 0.049,   // Vi value from table
		Vp: 0.033,   // Vp value from table
		Ip: 1.48e-5, // 1.48 · 10^-5
		Iv: 1.00e-6, // 1.00 · 10^-6
		D:  13,      // D value from table
		E:  0.07,    // E value from table
	},
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
	if req.RKMethod == "" {
		req.RKMethod = RK4 // Default to RK4 for backward compatibility
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

// ExcitabilityTest handles excitability class test requests - no longer supported
func (h *NeuronSimulationHandler) ExcitabilityTest(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Excitability test functionality has been removed", http.StatusNotImplemented)
}

// ParameterMap handles parameter map generation requests - no longer supported
func (h *NeuronSimulationHandler) ParameterMap(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Parameter map functionality has been removed", http.StatusNotImplemented)
}

// CustomSignalUpload handles custom input signal uploads - no longer supported
func (h *NeuronSimulationHandler) CustomSignalUpload(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Custom signal upload functionality has been removed", http.StatusNotImplemented)
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
		"rkMethod":        req.RKMethod,
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

		// Implementing Voss-McCartney algorithm for pink noise
		pinkSource := rand.NewSource(42) // Fixed seed for reproducibility
		pinkRand := rand.New(pinkSource)
		maxKey := uint32(0x1F) // Five bits set
		var key uint32 = 0
		white := [5]float64{0, 0, 0, 0, 0}

		// Generate the next pink noise sample based on time
		inputSignal = func(t float64) float64 {
			// Calculate the sample index based on time and frequency
			sampleIndex := int(t*signalParams.Frequency) % 10000000

			// Ensure we generate the correct sample for this index
			for i := 0; i < sampleIndex; i++ {
				// Skip ahead in the sequence
				lastKey := key
				key++
				if key > maxKey {
					key = 0
				}
				diff := lastKey ^ key
				for j := 0; j < 5; j++ {
					if diff&(1<<uint(j)) != 0 {
						white[j] = pinkRand.Float64()*2 - 1
					}
				}
			}

			// Generate the actual sample for this time point
			lastKey := key
			key++
			if key > maxKey {
				key = 0
			}
			diff := lastKey ^ key
			for i := 0; i < 5; i++ {
				if diff&(1<<uint(i)) != 0 {
					white[i] = pinkRand.Float64()*2 - 1
				}
			}

			// Sum the white noise components
			sum := white[0] + white[1] + white[2] + white[3] + white[4]

			// Scale and add baseline
			return signalParams.Baseline + signalParams.Amplitude*sum*0.1
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

	// Run Runge-Kutta integration based on selected method
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

		// Apply different Runge-Kutta methods
		switch req.RKMethod {
		case RK1:
			// First-order (Euler) method
			dv, dx := h.derivatives(v, x, t, req, inputSignal)
			v += req.TimeStep * dv
			x += req.TimeStep * dx

		case RK2:
			// Second-order method
			k1v, k1x := h.derivatives(v, x, t, req, inputSignal)
			k2v, k2x := h.derivatives(v+req.TimeStep*k1v, x+req.TimeStep*k1x, t+req.TimeStep, req, inputSignal)
			v += req.TimeStep * (k1v + k2v) / 2
			x += req.TimeStep * (k1x + k2x) / 2

		case RK8:
			// Eighth-order method using Dormand–Prince method (simplified to use k1-k6 only)
			k1v, k1x := h.derivatives(v, x, t, req, inputSignal)
			k2v, k2x := h.derivatives(v+req.TimeStep/4*k1v, x+req.TimeStep/4*k1x, t+req.TimeStep/4, req, inputSignal)
			k3v, k3x := h.derivatives(v+req.TimeStep/8*(k1v+k2v), x+req.TimeStep/8*(k1x+k2x), t+req.TimeStep/4, req, inputSignal)
			k4v, k4x := h.derivatives(v+req.TimeStep/2*(-k2v+2*k3v), x+req.TimeStep/2*(-k2x+2*k3x), t+req.TimeStep/2, req, inputSignal)
			k5v, k5x := h.derivatives(v+req.TimeStep/6*(3*k1v+9*k4v), x+req.TimeStep/6*(3*k1x+9*k4x), t+3*req.TimeStep/4, req, inputSignal)
			k6v, k6x := h.derivatives(v+req.TimeStep/6*(-3*k1v+2*k2v+4*k3v+4*k4v), x+req.TimeStep/6*(-3*k1x+2*k2x+4*k3x+4*k4x), t+req.TimeStep, req, inputSignal)

			// Final update formula with 5th order accuracy
			v += req.TimeStep / 90 * (7*k1v + 32*k3v + 12*k4v + 32*k5v + 7*k6v)
			x += req.TimeStep / 90 * (7*k1x + 32*k3x + 12*k4x + 32*k5x + 7*k6x)

		default:
			// Fourth-order method (RK4) - default
			k1v, k1x := h.derivatives(v, x, t, req, inputSignal)
			k2v, k2x := h.derivatives(v+0.5*req.TimeStep*k1v, x+0.5*req.TimeStep*k1x, t+0.5*req.TimeStep, req, inputSignal)
			k3v, k3x := h.derivatives(v+0.5*req.TimeStep*k2v, x+0.5*req.TimeStep*k2x, t+0.5*req.TimeStep, req, inputSignal)
			k4v, k4x := h.derivatives(v+req.TimeStep*k3v, x+req.TimeStep*k3x, t+req.TimeStep, req, inputSignal)

			v += req.TimeStep * (k1v + 2*k2v + 2*k3v + k4v) / 6
			x += req.TimeStep * (k1x + 2*k2x + 2*k3x + k4x) / 6
		}

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
	vd := v + req.ModVoltage    // Tunnel diode voltage includes modulatory voltage
	vm := v + req.TuningVoltage // Memristor voltage includes tuning voltage

	// Calculate tunnel diode current based on model
	var id float64
	// Get the diode parameters from the map
	diodeParam, exists := diodeModels[req.DiodeModel]
	if !exists {
		// Default to GI401A if model not found
		diodeParam = diodeModels[DiodeGI401A]
	}

	// Calculate diode current using the model
	id = diodeModel(vd, diodeParam)

	// Calculate memristor current and state derivative
	im, ix := andTSModel(vm, x)

	// Input current
	iin := inputSignal(t)

	// Derivatives
	dvdt := (iin - im - id) / req.Capacitance
	dxdt := ix

	return dvdt, dxdt
}

func andTSModel(v1, v2 float64) (float64, float64) {
	const (
		Ron_p = 806
		Ron_n = 1434
		Vth_p = 0.267
		Vh_p  = 0.08
		Vth_n = -0.119
		Vh_n  = -0.006
		TAUs  = 1.2e-7
		TAUr  = 1.3e-7
		A     = 2.0
		Ds    = 0.05
		Dr    = 0.5
		Vs    = 0.0099
		Vr    = 0.0175
		Ilk   = 1e-12
	)

	// State variable dynamics function F(V1,V2) as specified in SPICE
	term1 := (1 / TAUs) * (1 / (1 + math.Exp(-1/(Vs*Vs)*(v1-Vth_p)*(v1-Vth_n)))) *
		((1-1/(math.Exp((A*v2+Ds))))*(1-v2) + v2*(1-1/(math.Exp(A*(1-v2)))))

	term2 := (1 / TAUr) * (1 - 1/(1+math.Exp(-1/(Vr*Vr)*(v1-Vh_n)*(v1-Vh_p)))) *
		((1-1/(math.Exp((A*v2))))*(1-v2) + v2*(1-1/(math.Exp(A*(1-v2)+Dr))))

	ix := term1 - term2

	// Memristor I-V Relationship as specified in SPICE
	var imem float64
	if v1 > 0 {
		imem = v1*v2/Ron_p + Ilk
	} else {
		imem = v1*v2/Ron_n - Ilk
	}

	return imem, ix
}

// diodeModel implements the general tunnel diode model with the specified parameters
func diodeModel(e float64, params DiodeParams) float64 {
	idiode := func(e float64) float64 {
		return params.Is * (math.Exp(e/params.Vt) - math.Exp(-e/params.Vt))
	}

	itunnel := func(e float64) float64 {
		return params.Ip / params.Vp * e * math.Exp(-(e-params.Vp)/params.Vp)
	}

	iex := func(e float64) float64 {
		return params.Iv * (math.Atan(params.D*(e-params.E)) + math.Atan(params.D*(e+params.E)))
	}

	return idiode(e) + itunnel(e) + iex(e)
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
