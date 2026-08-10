const express = require('express');
const { initDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const userRoutes = require('./src/routes/userRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const productRoutes = require('./src/routes/productRoutes');     // <-- 1. Importar rutas de productos[cite: 5]
const categoryRoutes = require('./src/routes/categoryRoutes');   // <-- 2. Importar rutas de categorías[cite: 5]

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicializar base de datos
initDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/products', productRoutes);       // <-- 3. Registrar endpoint de productos[cite: 5]
app.use('/api/store', categoryRoutes);         // <-- 4. Registrar endpoint de categorías (maneja /api/store/:storeId y /api/store/category)[cite: 5]

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: '¡El backend modular multi-tenant está funcionando correctamente!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});