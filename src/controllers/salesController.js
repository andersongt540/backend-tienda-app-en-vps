const { pool } = require('../config/db');

exports.registerSale = async (req, res) => {
    const { storeId, clientName, address, phone, items } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar transacción

        let totalSalePrice = 0;
        const productsInfo = [];

        // 1. Validar todos los productos y el stock antes de realizar cualquier cambio
        for (const item of items) {
            const { productId, quantity } = item;

            const productRes = await client.query(
                'SELECT name, price, stock FROM products WHERE id = $1 AND store_id = $2',
                [productId, storeId]
            );

            if (productRes.rows.length === 0) {
                throw new Error(`Producto con ID ${productId} no encontrado`);
            }

            const product = productRes.rows[0];
            if (product.stock < quantity) {
                throw new Error(`Stock insuficiente para ${product.name}. Disponibles: ${product.stock}`);
            }

            const itemTotalPrice = parseFloat(product.price) * quantity;
            totalSalePrice += itemTotalPrice;

            productsInfo.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity,
                totalPrice: itemTotalPrice
            });
        }

        const salesRecords = [];

        // 2. Procesar cada producto (Descontar stock e insertar en la tabla 'sales')
        for (const prod of productsInfo) {
            // Descontar stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [prod.quantity, prod.id]
            );

            // Insertar registro en 'sales'
            const saleRes = await client.query(
                `INSERT INTO sales (store_id, client_name, address, phone, product_id, quantity, total_price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [storeId, clientName, address, phone, prod.id, prod.quantity, prod.totalPrice]
            );
            salesRecords.push(saleRes.rows[0]);
        }

        // 3. Registrar una sola transacción para el balance general
        const summaryDescription = `Venta a ${clientName}: ` + productsInfo.map(p => `${p.name} (x${p.quantity})`).join(', ');

        await client.query(
            `INSERT INTO transactions (store_id, type, amount, description)
             VALUES ($1, 'income', $2, $3)`,
            [storeId, totalSalePrice, summaryDescription]
        );

        await client.query('COMMIT'); // Guardar cambios definitivos
        res.status(201).json({
            success: true,
            message: "Venta registrada con éxito",
            count: salesRecords.length,
            total: totalSalePrice
        });

    } catch (err) {
        await client.query('ROLLBACK'); // Deshacer todo si algo falla
        console.error("ERROR EN REGISTER SALE:", err.message);
        res.status(400).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

exports.deleteSale = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Buscar la venta para devolver stock
        const saleRes = await client.query('SELECT product_id, quantity FROM sales WHERE id = $1', [id]);

        if (saleRes.rows.length > 0) {
            const { product_id, quantity } = saleRes.rows[0];

            if (product_id) {
                await client.query(
                    'UPDATE products SET stock = stock + $1 WHERE id = $2',
                    [quantity, product_id]
                );
            }
        }

        // 2. Eliminar la venta
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
