interface Gasto {
    id: string;
    concepto: string;
    cantidad: number;
    fecha: Date;
    categoria: string;
    esRecurrente: boolean;
}

type Categoria = "Vivienda" | "Alimentación" | "Transporte" | "Ocio" | "Otros"; 