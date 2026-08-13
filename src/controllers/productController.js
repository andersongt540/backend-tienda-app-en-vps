const { pool } = require('../config/db');

// Obtener productos de la tienda
exports.getProductsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, store_id as "storeId", barcode, name, price, cost_price as "costPrice", provider, stock, category FROM products WHERE store_id = $1 ORDER BY id DESC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los productos', details: err.message });
    }
};

// Registrar un producto
exports.registerProduct = async (req, res) => {
    const { storeId, barcode, name, price, costPrice, provider, stock, category } = req.body;
    try {
        await pool.query(
            `INSERT INTO products (store_id, barcode, name, price, cost_price, provider, stock, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [storeId, barcode || null, name, price, costPrice || 0, provider || null, stock || 0, category || 'General']
        );
        res.status(201).json({ success: true, message: 'Producto registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar el producto', details: err.message });
    }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { barcode, name, price, costPrice, provider, stock, category } = req.body;
    try {
        const result = await pool.query(
            `UPDATE products
             SET barcode = $1, name = $2, price = $3, cost_price = $4, provider = $5, stock = $6, category = $7
             WHERE id = $8`,
            [barcode || null, name, price, costPrice || 0, provider || null, stock || 0, category || 'General', id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto actualizado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el producto', details: err.message });
    }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto eliminado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el producto', details: err.message });
    }
};
