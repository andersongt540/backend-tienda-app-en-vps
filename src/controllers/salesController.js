const { pool } = require('../config/db');

// Función interna para obtener o crear un cliente automáticamente
const getOrCreateClient = async (client, storeId, name, phone, address) => {
    // Buscar si ya existe por nombre (insensible a mayúsculas/minúsculas)
    const existing = await client.query(
        'SELECT id FROM clients WHERE store_id = $1 AND LOWER(name) = LOWER($2)',
        [storeId, name]
    );

    if (existing.rows.length > 0) {
        // Actualizar teléfono y dirección por si cambiaron
        const clientId = existing.rows[0].id;
        await client.query(
            'UPDATE clients SET phone = COALESCE($1, phone), address = COALESCE($2, address) WHERE id = $3',
            [phone, address, clientId]
        );
        return clientId;
    } else {
        // Crear nuevo cliente
        const newClient = await client.query(
            'INSERT INTO clients (store_id, name, phone, address) VALUES ($1, $2, $3, $4) RETURNING id',
            [storeId, name, phone, address]
        );
        return newClient.rows[0].id;
    }
};

exports.registerSale = async (req, res) => {
    const { storeId, clientName, address, phone, items } = req.body;
    const dbClient = await pool.connect();

    try {
        await dbClient.query('BEGIN');

        // 1. Manejar Cliente
        const clientId = await getOrCreateClient(dbClient, storeId, clientName, phone, address);

        let totalSalePrice = 0;
        const processedItems = [];

        // 2. Validar Stock y calcular totales
        for (const item of items) {
            const { productId, quantity } = item;
            const prodRes = await dbClient.query(
                'SELECT name, price, stock FROM products WHERE id = $1 AND store_id = $2',
                [productId, storeId]
            );

            if (prodRes.rows.length === 0) throw new Error(`Producto ${productId} no encontrado`);
            const product = prodRes.rows[0];
            if (product.stock < quantity) throw new Error(`Stock insuficiente para ${product.name}`);

            const itemTotal = parseFloat(product.price) * quantity;
            totalSalePrice += itemTotal;
            processedItems.push({ ...item, unitPrice: product.price, totalPrice: itemTotal, name: product.name });
        }

        // 3. Crear Cabecera de Venta
        const saleRes = await dbClient.query(
            'INSERT INTO sales (store_id, client_id, total_price) VALUES ($1, $2, $3) RETURNING id',
            [storeId, clientId, totalSalePrice]
        );
        const saleId = saleRes.rows[0].id;

        // 4. Crear Detalles y Actualizar Stock
        for (const item of processedItems) {
            await dbClient.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
                [saleId, item.productId, item.quantity, item.unitPrice, item.totalPrice]
            );

            await dbClient.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.productId]
            );
        }

        // 5. Registrar Transacción
        const desc = `Venta a ${clientName}: ` + processedItems.map(i => `${i.name} x${i.quantity}`).join(', ');
        await dbClient.query(
            'INSERT INTO transactions (store_id, type, amount, description) VALUES ($1, $2, $3, $4)',
            [storeId, 'income', totalSalePrice, desc]
        );

        await dbClient.query('COMMIT');
        res.status(201).json({ success: true, saleId });

    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error("ERROR VENTA:", err.message);
        res.status(400).json({ error: err.message });
    } finally {
        dbClient.release();
    }
};

exports.deleteSale = async (req, res) => {
    const { id } = req.params;
    const dbClient = await pool.connect();
    try {
        await dbClient.query('BEGIN');

        // 1. Obtener items para devolver stock
        const items = await dbClient.query('SELECT product_id, quantity FROM sale_items WHERE sale_id = $1', [id]);
        for (const item of items.rows) {
            if (item.product_id) {
                await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
            }
        }

        // 2. Borrar venta (cascada borrará sale_items)
        await dbClient.query('DELETE FROM sales WHERE id = $1', [id]);

        await dbClient.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await dbClient.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        dbClient.release();
    }
};

exports.getUniqueClients = async (req, res) => {
    const { storeId } = req.params;
    try {
        const result = await pool.query(
            'SELECT name as "clientName", phone, address FROM clients WHERE store_id = $1 ORDER BY name ASC',
            [storeId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
