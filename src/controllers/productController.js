const { pool } = require('../config/db');

// Obtener productos de la tienda
exports.getProductsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, store_id as "storeId", name, price, cost_price as "costPrice", provider, stock, category FROM products WHERE store_id = $1 ORDER BY id DESC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los productos', details: err.message });
    }
};

// Registrar un producto
exports.registerProduct = async (req, res) => {
    const { storeId, name, price, costPrice, provider, stock, category } = req.body;
    try {
        await pool.query(
            `INSERT INTO products (store_id, name, price, cost_price, provider, stock, category) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [storeId, name, price, costPrice || 0, provider || null, stock || 0, category || 'General']
        );
        res.status(201).json({ success: true, message: 'Producto registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar el producto', details: err.message });
    }
};