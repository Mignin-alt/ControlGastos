import express, { Request, Response, Router } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

const register: RequestHandler = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const userExists = await pool.query(
            'SELECT * FROM usuario WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            res.status(400).json({ message: 'El email ya está registrado' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO usuario (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, nombre',
            [nombre, email, passwordHash]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

router.post('/register', register);

const login: RequestHandler = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuario WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ message: 'Credenciales inválidas' });
            return;
        }

        const usuario = result.rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password_hash);
        
        if (!validPassword) {
            res.status(401).json({ message: 'Credenciales inválidas' });
            return;
        }

        const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET : (() => { throw new Error('JWT_SECRET no está definido'); })();

        const token = jwt.sign(
            { id: usuario.id },
            secret,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

router.post('/login', login);

export default router; 