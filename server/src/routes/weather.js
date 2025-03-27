const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current/:city', weatherController.getCurrentWeather);
router.get('/forecast/:city', weatherController.getForecast);
router.get('/hourly/:city', async (req, res) => {
    try {
      const hourlyForecast = await weatherService.getHourlyForecast(req.params.city);
      res.json(hourlyForecast);
    } catch (error) {
      res.status(400).json({ error: error.message, type: error.type });
    }
  });

module.exports = router;