const { pool } = require('../config/db');

// Ayudante para manejar clientes en deudas
const getOrCreateClient = async (client, storeId, name, phone) => {
    const existing = await client.query(
        'SELECT id FROM clients WHERE store_id = $1 AND LOWER(name) = LOWER($2)',
        [storeId, name]
    );

    if (existing.rows.length > 0) {
        const clientId = existing.rows[0].id;
        if (phone) await client.query('UPDATE clients SET phone = $1 WHERE id = $2', [phone, clientId]);
        return clientId;
    } else {
        const newClient = await client.query(
            'INSERT INTO clients (store_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
            [storeId, name, phone]
        );
        return newClient.rows[0].id;
    }
};

exports.getDebtsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            `SELECT d.id, c.name as "clientName", c.phone, d.amount, d.description, d.type,
                    d.is_paid as "isPaid", d.created_at as "createdAt"
             FROM debts d
             JOIN clients c ON d.client_id = c.id
             WHERE d.store_id = $1 ORDER BY d.created_at DESC`,
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("ERROR AL OBTENER DEUDAS:", err);
        res.status(500).json({ error: "Error al obtener deudas" });
    }
};

exports.registerDebt = async (req, res) => {
    const { storeId, store_id, clientName, client_name, amount, description, phone, type } = req.body;
    const dbClient = await pool.connect();

    // Priorizar el ID que no sea nulo
    const finalStoreId = storeId || store_id;
    const finalClientName = clientName || client_name;

    if (!finalStoreId) {
        return res.status(400).json({ error: "storeId es obligatorio" });
    }

    try {
        await dbClient.query('BEGIN');

        const clientId = await getOrCreateClient(dbClient, finalStoreId, finalClientName, phone);

        await dbClient.query(
            'INSERT INTO debts (store_id, client_id, amount, description, type) VALUES ($1, $2, $3, $4, $5)',
            [finalStoreId, clientId, amount, description, type]
        );

        await dbClient.query('COMMIT');
        res.status(201).json({ success: true });
    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error("ERROR AL REGISTRAR DEUDA:", err);
        res.status(500).json({ error: err.message });
    } finally {
        dbClient.release();
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
