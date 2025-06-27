const express = require('express');
const router = express.Router();
const weatherMapController = require('../controllers/weatherMapController');

router.get('/windy/:city', weatherMapController.getWindyWidgetData);
router.get('/windy-embed/:city', weatherMapController.getWindyWidgetHtml);
router.get('/coordinates/:city', weatherMapController.getCityCoordinates);
router.get('/cities', weatherMapController.getAllCities);

module.exports = router;