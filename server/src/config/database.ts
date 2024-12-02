import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

export const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuario (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nombre VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS gasto (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                concepto VARCHAR NOT NULL,
                cantidad DECIMAL(10,2) NOT NULL,
                fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                categoria VARCHAR NOT NULL,
                es_recurrente BOOLEAN DEFAULT FALSE,
                usuario_id UUID REFERENCES usuario(id),
                presupuesto_mensual DECIMAL(10,2)
            );

            CREATE INDEX IF NOT EXISTS idx_gasto_usuario ON gasto(usuario_id);
            CREATE INDEX IF NOT EXISTS idx_gasto_fecha ON gasto(fecha);
        `);
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
};