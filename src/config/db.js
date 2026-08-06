const { Pool } = require('pg');

// Si existe DATABASE_URL (en la nube), la usa. Si no, usa la configuración local.
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Requerido para bases de datos en la nube como Render
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
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stores (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                address TEXT,
                phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS activation_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                used_by INT REFERENCES users(id),
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, 
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS debts (
                id SERIAL PRIMARY KEY,
                store_id INT REFERENCES stores(id) ON DELETE CASCADE,
                client_name VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                type VARCHAR(50) DEFAULT 'receivable', 
                is_paid BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tablas multi-tenant de la base de datos verificadas/creadas correctamente.");
    } catch (err) {
        console.error("Error al inicializar las tablas:", err);
    }
}

module.exports = { pool, initDB };