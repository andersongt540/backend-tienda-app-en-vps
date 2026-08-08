const express = require('express');
const { initDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const userRoutes = require('./src/routes/userRoutes'); // <-- 1. Importar las rutas de usuarios

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicializar base de datos
initDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/users', userRoutes); // <-- 2. Registrar el endpoint base para los usuarios

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: '¡El backend modular multi-tenant está funcionando correctamente!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});