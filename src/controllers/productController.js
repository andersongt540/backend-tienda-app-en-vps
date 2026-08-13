const { pool } = require('../config/db');

// Obtener productos de la tienda
exports.getProductsByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            `SELECT p.id, p.store_id as "storeId", p.barcode, p.name, p.price,
                    p.cost_price as "costPrice", p.provider, p.stock, c.name as category
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.store_id = $1 ORDER BY p.id DESC`,
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
        // Buscar ID de categoría por nombre
        let categoryId = null;
        if (category) {
            const catRes = await pool.query(
                'SELECT id FROM categories WHERE store_id = $1 AND name = $2',
                [storeId, category]
            );
            if (catRes.rows.length > 0) categoryId = catRes.rows[0].id;
        }

        await pool.query(
            `INSERT INTO products (store_id, category_id, barcode, name, price, cost_price, provider, stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [storeId, categoryId, barcode || null, name, price, costPrice || 0, provider || null, stock || 0]
        );
        res.status(201).json({ success: true, message: 'Producto registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar el producto', details: err.message });
    }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { storeId, barcode, name, price, costPrice, provider, stock, category } = req.body;
    try {
        let categoryId = null;
        if (category) {
            const catRes = await pool.query(
                'SELECT id FROM categories WHERE store_id = $1 AND name = $2',
                [storeId, category]
            );
            if (catRes.rows.length > 0) categoryId = catRes.rows[0].id;
        }

        const result = await pool.query(
            `UPDATE products
             SET barcode = $1, name = $2, price = $3, cost_price = $4, provider = $5, stock = $6, category_id = $7
             WHERE id = $8`,
            [barcode || null, name, price, costPrice || 0, provider || null, stock || 0, categoryId, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar', details: err.message });
    }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar', details: err.message });
    }
};
