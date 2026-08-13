const { pool } = require('../config/db');

exports.getDebtsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, client_name as "clientName", amount, description, type, 
                    is_paid as "isPaid", created_at as "createdAt" 
             FROM debts WHERE store_id = $1 ORDER BY created_at DESC`,
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener deudas" });
    }
};

exports.registerDebt = async (req, res) => {
    const { storeId, store_id, clientName, client_name, amount, description, type } = req.body;

    // Compatibilidad con camelCase (App) y snake_case (JSON directo)
    const finalStoreId = storeId || store_id;
    const finalClientName = clientName || client_name;

    try {
        await pool.query(
            'INSERT INTO debts (store_id, client_name, amount, description, type) VALUES ($1, $2, $3, $4, $5)',
            [finalStoreId, finalClientName, amount, description, type]
        );
        res.status(201).json({ success: true, message: "Deuda registrada" });
    } catch (err) {
        console.error("ERROR AL REGISTRAR DEUDA:", err);
        res.status(500).json({ error: "Error al registrar deuda", details: err.message });
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