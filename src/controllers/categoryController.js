const { pool } = require('../config/db');

// Obtener categorías de la tienda
exports.getCategoriesByStore = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, store_id as "storeId", name FROM categories WHERE store_id = $1 ORDER BY id DESC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener categorías', details: err.message });
    }
};

// Crear categoría
exports.createCategory = async (req, res) => {
    const { storeId, name } = req.body;
    try {
        await pool.query(
            'INSERT INTO categories (store_id, name) VALUES ($1, $2)',
            [storeId, name]
        );
        res.status(201).json({ success: true, message: 'Categoría creada exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la categoría', details: err.message });
    }
};