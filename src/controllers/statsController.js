const { pool } = require('../config/db');

exports.getStoreStats = async (req, res) => {
    const { storeId } = req.params;
    try {
        // 1. Ventas totales del mes
        const salesRes = await pool.query(
            `SELECT COALESCE(SUM(total_price), 0) as total_sales
             FROM sales
             WHERE store_id = $1 AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
            [storeId]
        );

        // 2. Utilidad Bruta del mes (Venta - Costo)
        const utilityRes = await pool.query(
            `SELECT COALESCE(SUM(si.total_price - (p.cost_price * si.quantity)), 0) as gross_utility
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE s.store_id = $1 AND date_trunc('month', s.created_at) = date_trunc('month', CURRENT_DATE)`,
            [storeId]
        );

        // 3. Clientes frecuentes
        const topClients = await pool.query(
            `SELECT c.name, COUNT(s.id) as purchases
             FROM sales s
             JOIN clients c ON s.client_id = c.id
             WHERE s.store_id = $1
             GROUP BY c.name ORDER BY purchases DESC LIMIT 5`,
            [storeId]
        );

        res.json({
            totalSalesMonth: parseFloat(salesRes.rows[0].total_sales),
            grossUtility: parseFloat(utilityRes.rows[0].gross_utility),
            topClients: topClients.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
