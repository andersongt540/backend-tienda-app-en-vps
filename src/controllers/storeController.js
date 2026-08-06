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

const getStoreBalance = async (req, res) => {
    const { userId } = req.params;
    try {
        const storeResult = await pool.query('SELECT * FROM stores WHERE user_id = $1', [userId]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tienda no encontrada.' });
        }
        const store = storeResult.rows[0];

        const balanceResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' OR type = 'sale' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
             FROM transactions WHERE store_id = $1`,
            [store.id]
        );

        const { total_income, total_expenses } = balanceResult.rows[0];
        const netBalance = parseFloat(total_income) - parseFloat(total_expenses);

        res.status(200).json({
            success: true,
            storeName: store.name,
            category: store.category,
            balance: netBalance,
            totalIncome: total_income,
            totalExpenses: total_expenses
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el balance', details: err.message });
    }
};

module.exports = { setupStore, getStoreBalance };