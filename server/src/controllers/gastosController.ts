import { Request, Response } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import { pool } from '../config/database';

interface CustomRequest extends Request {
    usuario?: {
        id: string;
        email: string;
        nombre: string;
    }
}

export const obtenerGastos: RequestHandler = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }

        const result = await pool.query(
            'SELECT * FROM gasto WHERE usuario_id = $1 ORDER BY fecha DESC',
            [req.usuario.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).json({ message: 'Error al obtener gastos' });
    }
};

export const crearGasto: RequestHandler = async (req: CustomRequest, res: Response) => {
    try {
        const { concepto, cantidad, categoria, esRecurrente, fecha } = req.body;

        if (!req.usuario) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO gasto (concepto, cantidad, categoria, es_recurrente, usuario_id, fecha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [concepto, cantidad, categoria, esRecurrente, req.usuario.id, fecha]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear gasto:', error);
        res.status(500).json({ message: 'Error al crear gasto' });
    }
};

export const actualizarGasto = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ message: "Usuario no autenticado" });
        }

        const { id } = req.params;
        const { concepto, cantidad, categoria, esRecurrente, fecha } = req.body;

        const result = await pool.query(
            `UPDATE gasto 
             SET concepto = $1, cantidad = $2, categoria = $3, es_recurrente = $4, fecha = $5
             WHERE id = $6 AND usuario_id = $7
             RETURNING *`,
            [concepto, cantidad, categoria, esRecurrente, fecha, id, req.usuario.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Gasto no encontrado o no autorizado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({ 
            message: "Error al actualizar gasto",
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const eliminarGasto = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ message: "Usuario no autenticado" });
        }

        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM gasto WHERE id = $1 AND usuario_id = $2',
            [id, req.usuario.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Gasto no encontrado o no autorizado" });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).json({ 
            message: "Error al eliminar gasto",
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const obtenerEstadisticas = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ message: "Usuario no autenticado" });
        }

        const { año, mes } = req.query;

        if (!año || !mes) {
            return res.status(400).json({ message: "Año y mes son requeridos" });
        }

        const gastosPorCategoria = await pool.query(
            `SELECT categoria, SUM(cantidad) AS total
             FROM gasto
             WHERE EXTRACT(YEAR FROM fecha) = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND usuario_id = $3
             GROUP BY categoria
             ORDER BY total DESC`,
            [año, mes, req.usuario.id]
        );

        res.json(gastosPorCategoria.rows);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            message: "Error al obtener estadísticas",
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const obtenerGastosAgrupados = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ message: "Usuario no autenticado" });
        }

        const result = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM fecha) AS año,
                EXTRACT(MONTH FROM fecha) AS mes,
                SUM(cantidad) AS total,
                bool_or(es_recurrente) AS tiene_recurrentes
            FROM gasto
            WHERE usuario_id = $1
            GROUP BY año, mes
            ORDER BY año DESC, mes DESC
        `, [req.usuario.id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener gastos agrupados:', error);
        res.status(500).json({ message: "Error al obtener gastos agrupados" });
    }
};

export const obtenerGasto = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ message: "Usuario no autenticado" });
        }

        const { id } = req.params;
        const result = await pool.query(
            'SELECT *, TO_CHAR(fecha, \'YYYY-MM-DD\') as fecha FROM gasto WHERE id = $1 AND usuario_id = $2',
            [id, req.usuario.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Gasto no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener gasto:', error);
        res.status(500).json({ 
            message: "Error al obtener gasto",
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};