class GastosService {
    private apiUrl = 'http://localhost:3000/api/gastos';

    async obtenerGastos(): Promise<Gasto[]> {
        const response = await fetch(this.apiUrl);
        return response.json();
    }

    async agregarGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gasto),
        });
        return response.json();
    }

    async exportarACSV(): Promise<void> {
        const gastos = await this.obtenerGastos();
        const csv = this.convertirACSV(gastos);
        this.descargarCSV(csv);
    }

    private convertirACSV(gastos: Gasto[]): string {
        const headers = ['Concepto', 'Cantidad', 'Categoría', 'Fecha', 'Recurrente'];
        const rows = gastos.map(gasto => [
            gasto.concepto,
            gasto.cantidad.toString(),
            gasto.categoria,
            new Date(gasto.fecha).toLocaleDateString(),
            gasto.esRecurrente ? 'Sí' : 'No'
        ]);
        
        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }

    private descargarCSV(csv: string): void {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gastos.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
} 