const { pool } = require('../config/db');

const setupStore = async (req, res) => {
    const { userId, storeName, category, address, phone } = req.body;
    try {
        await pool.query(
            'INSERT INTO stores (user_id, name, category, address, phone) VALUES ($1, $2, $3, $4, $5)',
            [userId, storeName, category, address, phone]
        );
        res.status(201).json({ success: true, message: 'Tienda configurada y aislada correctamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar la tienda', details: err.message });
    }
};

// src/controllers/storeController.js

const getStoreBalance = async (req, res) => {
    const { userId } = req.params;
    try {
        const storeResult = await pool.query('SELECT * FROM stores WHERE user_id = $1', [userId]);
        if (storeResult.rows.length === 0) return res.status(404).json({ error: 'Tienda no encontrada.' });
        const store = storeResult.rows[0];

        // Totales
        const balanceResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' OR type = 'sale' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
             FROM transactions WHERE store_id = $1`, [store.id]
        );

        // Lista de ventas para la App (con el formato de fecha que espera el DTO)
        const salesResult = await pool.query(
            `SELECT s.id, p.name as "productName", s.client_name as "clientName", 
                    s.total_price as amount, TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI:SS') as date,
                    s.address, s.phone, s.quantity
             FROM sales s
             LEFT JOIN products p ON s.product_id = p.id
             WHERE s.store_id = $1
             ORDER BY s.created_at DESC`, [store.id]
        );

        const { total_income, total_expenses } = balanceResult.rows[0];
        res.status(200).json({
            success: true,
            storeName: store.name,
            category: store.category,
            balance: parseFloat(total_income) - parseFloat(total_expenses),
            totalIncome: total_income,
            totalExpenses: total_expenses,
            sales: salesResult.rows // <-- Enviamos las ventas
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { setupStore, getStoreBalance };