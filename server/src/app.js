const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const weatherRoutes = require('./routes/weather');
const weatherMapRoutes = require('./routes/weatherMapRoutes');
const moistureRoutes = require('./routes/moistureRoutes');
const vegetationRoutes = require('./routes/vegetationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/data', express.static(path.join(__dirname, 'public/data')));

app.get('/', (req, res) => {
  res.send('Weather API Server is running');
});

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/moisture', moistureRoutes);
app.use('/api/weathermap', weatherMapRoutes);
app.use('/api/vegetation', vegetationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});