require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db');
const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Root healthcheck
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'OK', database: 'connected' });
  } catch (err) {
    console.error('MySQL health check failed:', err);
    return res.status(503).json({ status: 'ERROR', database: 'disconnected' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Medical Booking API server is running on port ${PORT}`);
});
