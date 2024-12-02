import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

interface CustomRequest extends Request {
    usuario?: {
        id: string;
        email: string;
        nombre: string;
    }
}

interface JwtPayload {
    id: string;
}

export const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            res.status(401).json({ message: 'Token no proporcionado' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta') as JwtPayload;
        
        const result = await pool.query(
            'SELECT id, email, nombre FROM usuario WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ message: 'Usuario no válido' });
            return;
        }

        req.usuario = result.rows[0];
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        res.status(401).json({ message: 'Token no válido' });
    }
};