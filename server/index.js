const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Medical Booking Backend is running and connected to MySQL.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Medical Booking API Server is running on http://localhost:${PORT}`);
  console.log(`📊 Connected to MySQL database 'medical_booking'`);
});
