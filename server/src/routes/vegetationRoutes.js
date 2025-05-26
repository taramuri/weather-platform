// routes/vegetationRoutes.js
const express = require('express');
const router = express.Router();
const vegetationService = require('../services/vegetationService');

// GET /api/vegetation/:city - Get vegetation data for city
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({
        error: 'Назва міста є обов\'язковою',
        code: 'CITY_REQUIRED'
      });
    }
    
    const vegetationData = await vegetationService.getVegetationData({ city });
    
    res.json({
      success: true,
      data: vegetationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vegetation routes error:', error);
    
    const statusCode = error.type === 'PARAMS_MISSING' ? 400 : 
                      error.type === 'VEGETATION_DATA_ERROR' ? 503 : 500;
    
    res.status(statusCode).json({
      error: error.message,
      code: error.type || 'VEGETATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/vegetation/:city/recommendations - Get crop recommendations based on vegetation
router.get('/:city/recommendations', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city) {
      return res.status(400).json({
        error: 'Назва міста є обов\'язковою',
        code: 'CITY_REQUIRED'
      });
    }
    
    // First get vegetation data
    const vegetationData = await vegetationService.getVegetationData({ city });
    
    // Then get recommendations
    const recommendations = await vegetationService.getCropRecommendations(city, vegetationData);
    
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vegetation recommendations error:', error);
    
    const statusCode = error.type === 'PARAMS_MISSING' ? 400 : 500;
    
    res.status(statusCode).json({
      error: error.message,
      code: error.type || 'RECOMMENDATIONS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/vegetation/coordinates/:lat/:lon - Get vegetation data by coordinates
router.get('/coordinates/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Недійсні координати',
        code: 'INVALID_COORDINATES'
      });
    }
    
    const vegetationData = await vegetationService.getVegetationData({ lat: latitude, lon: longitude });
    
    res.json({
      success: true,
      data: vegetationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vegetation coordinates error:', error);
    
    res.status(500).json({
      error: error.message,
      code: error.type || 'VEGETATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;