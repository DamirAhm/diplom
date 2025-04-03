import { create } from 'zustand'
import { simulateNeuron } from '@/app/utils/neuronSimulation'

interface NeuronParameters {
    gNa: number
    gK: number
    gL: number
    ENa: number
    EK: number
    EL: number
    Cm: number
}

interface SimulationData {
    time: number[]
    voltage: number[]
}

interface NeuronDynamicsState {
    modelType: 'hh' | 'fhn' | 'hr'
    testType: 'excitability' | 'rheobase' | 'threshold'
    parameters: NeuronParameters
    simulationData: SimulationData | null
    setModelType: (type: 'hh' | 'fhn' | 'hr') => void
    setTestType: (type: 'excitability' | 'rheobase' | 'threshold') => void
    setParameter: (param: keyof NeuronParameters, value: number) => void
    setSimulationData: (data: SimulationData | null) => void
    runSimulation: () => void
}

export const useNeuronDynamicsStore = create<NeuronDynamicsState>((set, get) => {
    const runSimulation = () => {
        const state = get()
        const result = simulateNeuron(
            state.modelType,
            state.testType,
            state.parameters
        )
        set({ simulationData: result })
    }

    return {
        modelType: 'hh',
        testType: 'excitability',
        parameters: {
            gNa: 120,
            gK: 36,
            gL: 0.3,
            ENa: 50,
            EK: -77,
            EL: -54.4,
            Cm: 1,
        },
        simulationData: null,
        setModelType: (type) => {
            set({ modelType: type })
            runSimulation()
        },
        setTestType: (type) => {
            set({ testType: type })
            runSimulation()
        },
        setParameter: (param, value) => {
            set((state) => ({
                parameters: {
                    ...state.parameters,
                    [param]: value,
                },
            }))
            runSimulation()
        },
        setSimulationData: (data) => set({ simulationData: data }),
        runSimulation,
    }
}) 