const { pool } = require('../config/db');

exports.registerSale = async (req, res) => {
    const { storeId, clientName, address, phone, productId, quantity } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 1. Obtener producto y validar stock
        const productRes = await client.query(
            'SELECT name, price, stock FROM products WHERE id = $1 AND store_id = $2',
            [productId, storeId]
        );

        if (productRes.rows.length === 0) {
            throw new Error("Producto no encontrado");
        }

        const product = productRes.rows[0];
        if (product.stock < quantity) {
            throw new Error("Stock insuficiente");
        }

        const totalPrice = product.price * quantity;

        // 2. Descontar stock
        await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [quantity, productId]
        );

        // 3. Insertar registro en la nueva tabla 'sales'
        const saleRes = await client.query(
            `INSERT INTO sales (store_id, client_name, address, phone, product_id, quantity, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [storeId, clientName, address, phone, productId, quantity, totalPrice]
        );

        // 4. Registrar en 'transactions' para que aparezca en el balance
        await client.query(
            `INSERT INTO transactions (store_id, type, amount, description)
             VALUES ($1, 'income', $2, $3)`,
            [storeId, totalPrice, `Venta: ${product.name} (x${quantity}) a ${clientName}`]
        );

        await client.query('COMMIT'); // Guardar cambios
        res.status(201).json({ success: true, sale: saleRes.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK'); // Deshacer si falla
        res.status(400).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

// Nueva función para obtener ventas recientes (para tu lista en el Balance)
exports.getRecentSales = async (req, res) => {
    const { storeId } = req.query;
    try {
        const query = `
            SELECT s.*, p.name as product_name 
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.store_id = $1 
            ORDER BY s.created_at DESC LIMIT 10;
        `;
        const result = await pool.query(query, [storeId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener ventas" });
    }
};
// src/controllers/salesController.js

exports.deleteSale = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Buscar la venta para saber qué producto y cantidad devolver al stock
        const saleRes = await client.query('SELECT product_id, quantity FROM sales WHERE id = $1', [id]);
        
        if (saleRes.rows.length > 0) {
            const { product_id, quantity } = saleRes.rows[0];
            
            // 2. Devolver stock si el producto aún existe
            if (product_id) {
                await client.query(
                    'UPDATE products SET stock = stock + $1 WHERE id = $2',
                    [quantity, product_id]
                );
            }
        }

        // 3. Eliminar la venta
        // Nota: Dependiendo de tu lógica, podrías querer borrar también la 'transaction' asociada
        await client.query('DELETE FROM sales WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ success: true, message: "Venta eliminada y stock actualizado." });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "Error al eliminar la venta", details: err.message });
    } finally {
        client.release();
    }
};