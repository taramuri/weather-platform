const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const weatherController = require('../controllers/weatherController');
const moistureController = require('../controllers/moistureController');

router.get('/current/:city', weatherController.getCurrentWeather);
router.get('/forecast/:city', weatherController.getForecast);
router.get('/hourly/:city', weatherController.getHourlyForecast);
router.get('/location', weatherController.getLocationByCoordinates);
router.get('/air-quality/:city', weatherController.getAirQuality);
router.get('/extended-forecast/:city', weatherController.getExtendedForecast);
router.get('/monthly-forecast/:city', weatherController.getMonthlyForecast);
router.get('/cities', cityController.getAllCities);
router.get('/validate-city/:city', cityController.validateCity);
router.get('/moisture', moistureController.getMoistureData);
router.get('/crop-recommendations', moistureController.getCropRecommendations);

module.exports = router;