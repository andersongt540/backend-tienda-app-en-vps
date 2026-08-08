const { pool } = require('../config/db');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, is_active, created_at FROM users ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los usuarios', details: err.message });
    }
};

// Actualizar el estado (is_active) de un usuario
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el estado', details: err.message });
    }
};