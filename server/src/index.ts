import express from 'express';
import path from 'path';
import { pool } from './config/database';
import { Request, Response } from 'express';

const app = express();

app.use(express.json());

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
}) as any);

app.post('/api/gastos', async (req, res) => {
    const { concepto, cantidad, categoria, esRecurrente } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO gasto (concepto, cantidad, categoria, es_recurrente) VALUES ($1, $2, $3, $4) RETURNING *',
            [concepto, cantidad, categoria, esRecurrente]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear gasto:', error);
        res.status(500).json({ error: 'Error al crear gasto' });
    }
});

app.put('/api/gastos/:id', async (req, res) => {
    const { id } = req.params;
    const { concepto, cantidad, categoria, esRecurrente, fecha } = req.body;
    try {
        const result = await pool.query(
            'UPDATE gasto SET concepto = $1, cantidad = $2, categoria = $3, es_recurrente = $4, fecha = $5 WHERE id = $6 RETURNING *',
            [concepto, cantidad, categoria, esRecurrente, fecha, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({ error: 'Error al actualizar gasto' });
    }
});

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

app.use(express.static(path.join(__dirname, '../../client')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Directorio de archivos estáticos: ${path.join(__dirname, '../../client')}`);
});