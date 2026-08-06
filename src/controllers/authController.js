const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');

// Registro inicial
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
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        res.status(201).json({ success: true, message: 'Registro inicial exitoso.', userId: newUser.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// Verificación de código de activación
const verifyCode = async (req, res) => {
    const { email, activationCode } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado.' });
        
        const userId = userCheck.rows[0].id;

        const codeCheck = await pool.query(
            'SELECT * FROM activation_codes WHERE code = $1 AND is_used = FALSE AND expires_at > NOW()',
            [activationCode]
        );

        if (codeCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Código inválido, ya utilizado o expirado.' });
        }

        await pool.query('UPDATE activation_codes SET is_used = TRUE, used_by = $1 WHERE code = $2', [userId, activationCode]);

        res.status(200).json({ success: true, message: 'Cuenta activada con éxito.', userId, hasStore: false });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// Inicio de sesión
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

        const user = userCheck.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });

        const subscriptionCheck = await pool.query(
            'SELECT * FROM activation_codes WHERE used_by = $1 AND expires_at > NOW()',
            [user.id]
        );

        if (subscriptionCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Suscripción expirada o cuenta no activada.' });
        }

        const storeCheck = await pool.query('SELECT * FROM stores WHERE user_id = $1', [user.id]);
        
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            userId: user.id,
            hasStore: storeCheck.rows.length > 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
};

// Generador de códigos administrativos
const generateCode = async (req, res) => {
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const newCode = `FLIG-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;

    try {
        await pool.query(
            'INSERT INTO activation_codes (code, expires_at) VALUES ($1, NOW() + INTERVAL \'1 month\')',
            [newCode]
        );
        res.status(201).json({ success: true, code: newCode, message: 'Código generado con éxito.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el código', details: err.message });
    }
};

module.exports = { register, verifyCode, login, generateCode };