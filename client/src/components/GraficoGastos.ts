import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto';

interface Gasto {
    categoria: string;
    cantidad: number;
}

class GraficoGastos {
    private chart: Chart;

    constructor(canvasId: string) {
        const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
        
        const config: ChartConfiguration = {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Gastos por Categoría'
                    }
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    actualizarDatos(gastos: Gasto[]): void {
        const gastosPorCategoria = gastos.reduce((acc, gasto) => {
            acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.cantidad;
            return acc;
        }, {} as Record<string, number>);

        const data: ChartData = {
            labels: Object.keys(gastosPorCategoria),
            datasets: [{
                data: Object.values(gastosPorCategoria),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        };

        this.chart.data = data;
        this.chart.update();
    }
}

export default GraficoGastos; 