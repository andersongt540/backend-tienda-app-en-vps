const { pool } = require('../config/db');

exports.getStoreStats = async (req, res) => {
    const { storeId } = req.params;
    try {
        // 1. Ventas totales del mes actual
        const salesRes = await pool.query(
            `SELECT COALESCE(SUM(total_price), 0) as total_sales
             FROM sales
             WHERE store_id = $1 AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
            [storeId]
        );

        // 2. Utilidad Bruta (Ventas - Costo de productos vendidos)
        const utilityRes = await pool.query(
            `SELECT COALESCE(SUM((s.total_price) - (p.cost_price * s.quantity)), 0) as gross_utility
             FROM sales s
             JOIN products p ON s.product_id = p.id
             WHERE s.store_id = $1 AND date_trunc('month', s.created_at) = date_trunc('month', CURRENT_DATE)`,
            [storeId]
        );

        res.json({
            totalSalesMonth: parseFloat(salesRes.rows[0].total_sales),
            grossUtility: parseFloat(utilityRes.rows[0].gross_utility)
        });
    } catch (err) {
        console.error("ERROR EN GET STATS:", err);
        res.status(500).json({ error: "Error al obtener estadísticas", details: err.message });
    }
};
