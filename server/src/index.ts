import dotenv from 'dotenv';
import express, { Request, Response, RequestHandler } from 'express';
import path from 'path';
import { pool } from './config/database';
import authRoutes from './routes/authRoute';
import cors from 'cors';

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

app.get('/', (req, res) => {
    res.redirect('/inicio');
});

app.get('/inicio', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/inicio.html'));
});

app.get('/gastos', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/registro.html'));
});

app.get('/api/gastos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gasto ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).json({ error: 'Error al obtener gastos' });
    }
});

app.get('/api/gastos/agrupados', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM fecha) AS año,
                EXTRACT(MONTH FROM fecha) AS mes,
                SUM(cantidad) AS total,
                bool_or(es_recurrente) AS tiene_recurrentes
            FROM gasto
            GROUP BY año, mes
            ORDER BY año DESC, mes DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener gastos agrupados:', error);
        res.status(500).json({ error: 'Error al obtener gastos agrupados' });
    }
}) as RequestHandler;

app.get('/api/gastos/:id', (async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM gasto WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener gasto:', error);
        res.status(500).json({ error: 'Error al obtener gasto' });
    }
}) as RequestHandler);

app.post('/api/gastos', async (req, res) => {
    const { concepto, cantidad, categoria, esRecurrente, fecha, año } = req.body;
    try {
        if (esRecurrente) {
            const resultados = [];
            
            for (let mes = 0; mes < 12; mes++) {
                const fechaMes = new Date(parseInt(año), mes, 20);
                const result = await pool.query(
                    'INSERT INTO gasto (concepto, cantidad, categoria, es_recurrente, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [concepto, cantidad, categoria, esRecurrente, fechaMes]
                );
                resultados.push(result.rows[0]);
            }
            res.json(resultados[0]);
        } else {
            const result = await pool.query(
                'INSERT INTO gasto (concepto, cantidad, categoria, es_recurrente, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [concepto, cantidad, categoria, esRecurrente, fecha]
            );
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al crear gasto:', error);
        res.status(500).json({ error: 'Error al crear gasto' });
    }
}) as RequestHandler;

app.put('/api/gastos/:id', async (req, res) => {
    const { id } = req.params;
    const { concepto, cantidad, categoria, fecha } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE gasto SET concepto = $1, cantidad = $2, categoria = $3, fecha = $4 WHERE id = $5 RETURNING *',
            [concepto, cantidad, categoria, fecha, id]
        );
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Gasto no encontrado' });
            return;
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({ error: 'Error al actualizar gasto' });
    }
}) as RequestHandler;

app.delete('/api/gastos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM gasto WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).json({ error: 'Error al eliminar gasto' });
    }
});

app.delete('/api/gastos/recurrente', async (req, res) => {
    try {
        const { concepto, fecha } = req.body;
        
        // Verificar que los parámetros necesarios estén presentes
        if (!concepto || !fecha) {
            res.status(400).json({ error: 'Faltan parámetros requeridos' });
            return;
        }

        const result = await pool.query(
            'DELETE FROM gasto WHERE concepto = $1 AND es_recurrente = true AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $2::date)',
            [concepto, fecha]
        );

        console.log(`Gastos eliminados: ${result.rowCount}`);
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar grupo de gastos recurrentes:', error);
        res.status(500).json({ error: 'Error al eliminar grupo de gastos recurrentes' });
    }
});

app.delete('/api/gastos/grupo-recurrente', async (req, res) => {
    try {
        const { concepto, fecha } = req.body;
        await pool.query(
            'DELETE FROM gasto WHERE concepto = $1 AND es_recurrente = true AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $2::date)',
            [concepto, fecha]
        );
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar grupo de gastos recurrentes:', error);
        res.status(500).json({ error: 'Error al eliminar grupo de gastos recurrentes' });
    }
});

app.use(express.static(path.join(__dirname, '../../client')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Directorio de archivos estáticos: ${path.join(__dirname, '../../client')}`);
});