const { pool } = require('../config/db');

const setupStore = async (req, res) => {
    const { userId, storeName, category, address, phone } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO stores (user_id, name, category, address, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, storeName, category, address, phone]
        );
        res.status(201).json({ success: true, storeId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getStoreBalance = async (req, res) => {
    const { userId } = req.params;
    try {
        const storeRes = await pool.query('SELECT id, name, category FROM stores WHERE user_id = $1', [userId]);
        if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Tienda no encontrada.' });
        const store = storeRes.rows[0];

        // Totales
        const balanceRes = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
             FROM transactions WHERE store_id = $1`, [store.id]
        );

        // Ventas recientes con nombres de clientes de la tabla 'clients'
        const salesRes = await pool.query(
            `SELECT s.id, c.name as "clientName", c.address, c.phone, s.total_price as amount,
                    TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI:SS') as date,
                    (SELECT string_agg(p.name || ' (x' || si.quantity || ')', ', ')
                     FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = s.id) as "productName"
             FROM sales s
             LEFT JOIN clients c ON s.client_id = c.id
             WHERE s.store_id = $1
             ORDER BY s.created_at DESC LIMIT 15`, [store.id]
        );

        const { total_income, total_expenses } = balanceRes.rows[0];
        res.json({
            success: true,
            storeName: store.name,
            category: store.category,
            balance: parseFloat(total_income) - parseFloat(total_expenses),
            totalIncome: total_income,
            totalExpenses: total_expenses,
            sales: salesRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { setupStore, getStoreBalance };
