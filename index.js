const express = require('express');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicializar base de datos
initDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: '¡El backend modular multi-tenant está funcionando correctamente!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});