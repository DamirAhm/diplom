interface HHParameters {
    gNa: number
    gK: number
    gL: number
    ENa: number
    EK: number
    EL: number
    Cm: number
}

interface HHState {
    V: number
    m: number
    h: number
    n: number
}

function alphaM(V: number): number {
    const x = V + 40
    return x !== 0 ? (0.1 * x) / (1 - Math.exp(-x / 10)) : 1
}

function betaM(V: number): number {
    return 4 * Math.exp(-(V + 65) / 18)
}

function alphaN(V: number): number {
    const x = V + 55
    return x !== 0 ? (0.01 * x) / (1 - Math.exp(-x / 10)) : 0.1
}

function betaN(V: number): number {
    return 0.125 * Math.exp(-(V + 65) / 80)
}

function alphaH(V: number): number {
    return 0.07 * Math.exp(-(V + 65) / 20)
}

function betaH(V: number): number {
    return 1 / (1 + Math.exp(-(V + 35) / 10))
}

function ionicCurrents(V: number, m: number, h: number, n: number, params: HHParameters) {
    const INa = params.gNa * Math.pow(m, 3) * h * (V - params.ENa)
    const IK = params.gK * Math.pow(n, 4) * (V - params.EK)
    const IL = params.gL * (V - params.EL)
    return { INa, IK, IL }
}

function rungeKutta4(state: HHState, dt: number, Iext: number, params: HHParameters): HHState {
    function deriv(s: HHState, I: number) {
        const { INa, IK, IL } = ionicCurrents(s.V, s.m, s.h, s.n, params)
        return {
            V: (-INa - IK - IL + I) / params.Cm,
            m: alphaM(s.V) * (1 - s.m) - betaM(s.V) * s.m,
            h: alphaH(s.V) * (1 - s.h) - betaH(s.V) * s.h,
            n: alphaN(s.V) * (1 - s.n) - betaN(s.V) * s.n
        }
    }

    const k1 = deriv(state, Iext)
    const k2 = deriv({
        V: state.V + k1.V * dt / 2,
        m: state.m + k1.m * dt / 2,
        h: state.h + k1.h * dt / 2,
        n: state.n + k1.n * dt / 2
    }, Iext)
    const k3 = deriv({
        V: state.V + k2.V * dt / 2,
        m: state.m + k2.m * dt / 2,
        h: state.h + k2.h * dt / 2,
        n: state.n + k2.n * dt / 2
    }, Iext)
    const k4 = deriv({
        V: state.V + k3.V * dt,
        m: state.m + k3.m * dt,
        h: state.h + k3.h * dt,
        n: state.n + k3.n * dt
    }, Iext)

    return {
        V: state.V + (k1.V + 2 * k2.V + 2 * k3.V + k4.V) * dt / 6,
        m: state.m + (k1.m + 2 * k2.m + 2 * k3.m + k4.m) * dt / 6,
        h: state.h + (k1.h + 2 * k2.h + 2 * k3.h + k4.h) * dt / 6,
        n: state.n + (k1.n + 2 * k2.n + 2 * k3.n + k4.n) * dt / 6
    }
}

export function simulateHH(params: HHParameters, duration: number = 100, dt: number = 0.01, Iext: number = 10) {
    const steps = Math.floor(duration / dt)
    const time: number[] = new Array(steps)
    const voltage: number[] = new Array(steps)

    let state: HHState = {
        V: -65,
        m: 0.05,
        h: 0.6,
        n: 0.32
    }

    for (let i = 0; i < steps; i++) {
        time[i] = i * dt
        voltage[i] = state.V
        state = rungeKutta4(state, dt, Iext, params)
    }

    return { time, voltage }
}

function simulateFHN(duration: number = 100, dt: number = 0.01, I: number = 0.5) {
    const steps = Math.floor(duration / dt)
    const time: number[] = new Array(steps)
    const voltage: number[] = new Array(steps)

    let v = -1.5
    let w = 0
    const a = 0.7
    const b = 0.8
    const tau = 12.5

    for (let i = 0; i < steps; i++) {
        time[i] = i * dt
        voltage[i] = v * 100

        const dv = v - v * v * v / 3 - w + I
        const dw = (v + a - b * w) / tau

        v += dv * dt
        w += dw * dt
    }

    return { time, voltage }
}

function simulateHR(duration: number = 100, dt: number = 0.01, I: number = 3) {
    const steps = Math.floor(duration / dt)
    const time: number[] = new Array(steps)
    const voltage: number[] = new Array(steps)

    let x = -1.6
    let y = -10
    let z = 2

    const a = 1
    const b = 3
    const c = 1
    const d = 5
    const r = 0.001
    const s = 4
    const xR = -1.6

    for (let i = 0; i < steps; i++) {
        time[i] = i * dt
        voltage[i] = x * 20

        const dx = y - a * x * x * x + b * x * x - z + I
        const dy = c - d * x * x - y
        const dz = r * (s * (x - xR) - z)

        x += dx * dt
        y += dy * dt
        z += dz * dt
    }

    return { time, voltage }
}

export function simulateNeuron(
    modelType: 'hh' | 'fhn' | 'hr',
    testType: 'excitability' | 'rheobase' | 'threshold',
    parameters: HHParameters
) {
    switch (modelType) {
        case 'hh':
            return simulateHH(parameters)
        case 'fhn':
            return simulateFHN()
        case 'hr':
            return simulateHR()
        default:
            throw new Error('Unknown model type')
    }
} 