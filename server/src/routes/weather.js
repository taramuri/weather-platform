const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current/:city', weatherController.getCurrentWeather);
router.get('/forecast/:city', weatherController.getForecast);
router.get('/hourly/:city', weatherController.getHourlyForecast);
router.get('/location', weatherController.getLocationByCoordinates);
module.exports = router;