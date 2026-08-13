const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER || 'andersongt540',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_DATABASE || 'tienda_app_bd',
        password: process.env.DB_PASSWORD || 'Eikary24$',
        port: process.env.DB_PORT || 5432,
      };

const pool = new Pool(poolConfig);

async function initDB() {
    try {
        // Ejecutamos las creaciones en orden de dependencia
        await pool.query(`
            -- 1. Usuarios
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 2. Tiendas (Tenants)
            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                address TEXT,
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 3. Clientes (Por tienda)
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 4. Categorías
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 5. Productos
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                category_id INT REFERENCES categories(id) ON DELETE SET NULL,
                barcode VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                cost_price DECIMAL(10, 2) DEFAULT 0.00,
                provider VARCHAR(255),
                stock INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 6. Ventas (Cabecera)
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                client_id INT REFERENCES clients(id) ON DELETE SET NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 7. Detalles de la Venta (Productos vendidos)
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
                product_id INT REFERENCES products(id) ON DELETE SET NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL
            );

            -- 8. Deudas (Cuentas por Cobrar/Pagar)
            CREATE TABLE IF NOT EXISTS debts (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                client_id INT REFERENCES clients(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                type VARCHAR(50) NOT NULL, -- 'receivable' (por cobrar) o 'payable' (por pagar)
                is_paid BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 9. Transacciones (Log contable general)
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'income', 'expense'
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Nueva estructura de base de datos organizada y creada correctamente.");
    } catch (err) {
        console.error("Error al inicializar las tablas:", err);
    }
}

module.exports = { pool, initDB };
