const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current/:city', weatherController.getCurrentWeather);
router.get('/forecast/:city', weatherController.getForecast);
router.get('/hourly/:city', weatherController.getHourlyForecast);
router.get('/location', weatherController.getLocationByCoordinates);
router.get('/air-quality/:city', weatherController.getAirQuality);
router.get('/extended-forecast/:city', weatherController.getExtendedForecast);
router.get('/monthly-forecast/:city', weatherController.getMonthlyForecast);
module.exports = router;