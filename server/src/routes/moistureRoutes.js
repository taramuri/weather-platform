const express = require('express');
const router = express.Router();
const moistureController = require('../controllers/moistureController');

router.get('/moisture', moistureController.getMoistureData);
router.get('/crop-recommendations', moistureController.getCropRecommendations);

module.exports = router;