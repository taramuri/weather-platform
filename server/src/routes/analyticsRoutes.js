  // routes/analyticsRoutes.js
  const express = require('express');
  const router = express.Router();
  const analyticsService = require('../services/analyticsService');

  router.get('/trends/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const { timeRange, lat, lon } = req.query;
      
      if (!city) {
        return res.status(400).json({
          error: 'Назва міста є обов\'язковою',
          code: 'CITY_REQUIRED'
        });
      }
      
      const params = { city };
      if (timeRange) params.timeRange = timeRange;
      if (lat && lon) {
        params.lat = parseFloat(lat);
        params.lon = parseFloat(lon);
      }
      
      const trendsData = await analyticsService.getWeatherTrends(params);
      
      res.json({
        success: true,
        data: trendsData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics trends error:', error);
      
      const statusCode = error.type === 'PARAMS_MISSING' ? 400 : 
                        error.type === 'TRENDS_ERROR' ? 503 : 500;
      
      res.status(statusCode).json({
        error: error.message,
        code: error.type || 'ANALYTICS_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/analytics/yield-prediction/:city - Get crop yield prediction
  router.get('/yield-prediction/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const { crop } = req.query;
      
      if (!city) {
        return res.status(400).json({
          error: 'Назва міста є обов\'язковою',
          code: 'CITY_REQUIRED'
        });
      }
      
      const params = { city };
      if (crop) params.crop = crop;
      
      const yieldPrediction = await analyticsService.getCropYieldPrediction(params);
      
      res.json({
        success: true,
        data: yieldPrediction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Yield prediction error:', error);
      
      const statusCode = error.type === 'CITY_REQUIRED' ? 400 : 
                        error.type === 'YIELD_PREDICTION_ERROR' ? 503 : 500;
      
      res.status(statusCode).json({
        error: error.message,
        code: error.type || 'YIELD_PREDICTION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/analytics/comprehensive/:city - Get comprehensive analytics
  router.get('/comprehensive/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const { timeRange, crop } = req.query;
      
      if (!city) {
        return res.status(400).json({
          error: 'Назва міста є обов\'язковою',
          code: 'CITY_REQUIRED'
        });
      }
      
      // Get multiple analytics in parallel
      const [trendsData, yieldPrediction] = await Promise.allSettled([
        analyticsService.getWeatherTrends({ city, timeRange: timeRange || 'month' }),
        analyticsService.getCropYieldPrediction({ city, crop: crop || 'пшениця' })
      ]);
      
      const result = {
        trends: trendsData.status === 'fulfilled' ? trendsData.value : null,
        yield_prediction: yieldPrediction.status === 'fulfilled' ? yieldPrediction.value : null
      };
      
      // Check if we have any successful data
      if (!result.trends && !result.yield_prediction) {
        return res.status(503).json({
          error: 'Не вдалося отримати аналітичні дані',
          code: 'ANALYTICS_UNAVAILABLE',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Comprehensive analytics error:', error);
      
      res.status(500).json({
        error: error.message,
        code: 'COMPREHENSIVE_ANALYTICS_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  });

  module.exports = router;