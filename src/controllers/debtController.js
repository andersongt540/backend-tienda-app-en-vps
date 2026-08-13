const { pool } = require('../config/db');

exports.getDebtsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, client_name as "clientName", amount, description, type, is_paid as "isPaid", created_at as "createdAt" FROM debts WHERE store_id = $1 ORDER BY created_at DESC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener deudas" });
    }
};

exports.registerDebt = async (req, res) => {
    const { storeId, clientName, amount, description, type } = req.body;
    try {
        await pool.query(
            'INSERT INTO debts (store_id, client_name, amount, description, type) VALUES ($1, $2, $3, $4, $5)',
            [storeId, clientName, amount, description, type]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar deuda" });
    }
};

exports.deleteDebt = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM debts WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar" });
    }
};

exports.markAsPaid = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE debts SET is_paid = true WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar" });
    }
};