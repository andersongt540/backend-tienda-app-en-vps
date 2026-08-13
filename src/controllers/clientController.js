const { pool } = require('../config/db');

exports.getClients = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, name, phone, email, address FROM clients WHERE store_id = $1 ORDER BY name ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    try {
        await pool.query(
            'UPDATE clients SET name = $1, phone = $2, email = $3, address = $4 WHERE id = $5',
            [name, phone, email, address, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
