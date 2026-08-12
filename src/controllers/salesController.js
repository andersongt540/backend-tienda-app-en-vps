// src/controllers/salesController.js
const { pool } = require('../config/db');

exports.registerSale = async (req, res) => {
    const { storeId, clientName, address, phone, productId, quantity } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const productRes = await client.query('SELECT name, price, stock FROM products WHERE id = $1', [productId]);
        if (productRes.rows.length === 0) throw new Error("Producto no encontrado");
        
        const product = productRes.rows[0];
        const totalPrice = product.price * quantity;

        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);
        const saleRes = await client.query(
            `INSERT INTO sales (store_id, client_name, address, phone, product_id, quantity, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [storeId, clientName, address, phone, productId, quantity, totalPrice]
        );
        await client.query(
            `INSERT INTO transactions (store_id, type, amount, description)
             VALUES ($1, 'income', $2, $3)`,
            [storeId, totalPrice, `Venta a ${clientName}`]
        );
        await client.query('COMMIT');
        res.status(201).json({ success: true, sale: saleRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: err.message });
    } finally { client.release(); }
};

exports.deleteSale = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sales WHERE id = $1', [id]);
        res.json({ success: true, message: "Venta eliminada." });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar" });
    }
};