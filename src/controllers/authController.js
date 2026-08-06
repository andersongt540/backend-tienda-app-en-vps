const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <--- 1. Asegúrate de importar jsonwebtoken
const { pool } = require('../config/db');

// Registro directo (La cuenta nace inactiva por defecto para evitar intrusos)
const register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Se inserta con is_active = false por defecto
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

// Inicio de sesión (Valida credenciales y estado activo)
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

        const user = userCheck.rows.length > 0 ? userCheck.rows[0] : null; // Manteniendo la lógica segura
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

        // Validar si el administrador activó la cuenta / pagó la mensualidad
        if (!user.is_active) {
            return res.status(403).json({ error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.' });
        }

        // Verificar si ya tiene tienda creada para decidir si va a Setup o a Balance
        const storeCheck = await pool.query('SELECT * FROM stores WHERE user_id = $1', [user.id]);
        
        // <--- 2. Generar el Token JWT usando una variable secreta (por ejemplo process.env.JWT_SECRET)
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'tu_secreto_temporal', 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            userId: user.id,
            hasStore: storeCheck.rows.length > 0,
            token: token // <--- 3. ¡Incluimos el token en la respuesta!
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

module.exports = { register, login };