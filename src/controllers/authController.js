const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, is_active) VALUES ($1, $2, false) RETURNING id, email, is_active',
            [email, hashedPassword]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Registro exitoso. Tu cuenta está pendiente de activación por el administrador.', 
            userId: newUser.rows[0].id 
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
        }

        const user = userCheck.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.' });
        }

        const storeCheck = await pool.query('SELECT * FROM stores WHERE user_id = $1', [user.id]);
        
        // Obtener el ID de la tienda si existe para guardarlo en la app móvil
        const storeId = storeCheck.rows.length > 0 ? storeCheck.rows[0].id : null;

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'tu_secreto_temporal', 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            userId: user.id,
            storeId: storeId, // <-- Añadido para que el frontend guarde el ID de la tienda
            hasStore: storeCheck.rows.length > 0,
            token: token
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error en el servidor', details: err.message });
    }
};

module.exports = { register, login };