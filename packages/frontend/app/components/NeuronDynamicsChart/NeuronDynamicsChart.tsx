'use client'

import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js'
import { Dictionary } from '@/app/types'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface NeuronDynamicsChartProps {
    data: {
        time: number[]
        voltage: number[]
    }
    modelType: 'hh' | 'fhn' | 'hr'
    dict: Dictionary
}

export function NeuronDynamicsChart({ data, modelType, dict }: NeuronDynamicsChartProps) {
    const chartData = {
        labels: data.time.map(t => t.toFixed(1)),
        datasets: [
            {
                label: dict.sandbox.chart.voltage,
                data: data.voltage,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
            },
        ],
    }

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: dict.sandbox.chart.models[modelType],
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: dict.sandbox.chart.time,
                },
            },
            y: {
                title: {
                    display: true,
                    text: dict.sandbox.chart.voltage,
                },
            },
        },
    }

    return (
        <div className="w-full h-[400px] p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Line options={options} data={chartData} />
        </div>
    )
} 