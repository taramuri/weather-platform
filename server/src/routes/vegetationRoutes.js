const express = require('express');
const router = express.Router();
const vegetationController = require('../controllers/vegetationController');

router.get('/ndvi', vegetationController.getNDVIData);
router.get('/indices-comparison', vegetationController.getVegetationIndicesComparison);

module.exports = router;