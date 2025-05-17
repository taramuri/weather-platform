const vegetationService = require('../services/vegetationService');

const cache = {
  ndviData: {},
  indicesComparison: {}
};

const CACHE_TTL = 6 * 60 * 60 * 1000;

function isCacheValid(cacheEntry) {
  return cacheEntry && 
         cacheEntry.data && 
         cacheEntry.timestamp && 
         (Date.now() - cacheEntry.timestamp < CACHE_TTL);
}

async function getNDVIData(req, res) {
  try {
    const { city, lat, lon, date } = req.query;
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'Необхідно вказати місто або координати (lat, lon)'
      });
    }
    
    const cacheKey = city ? `city_${city}` : `coord_${lat}_${lon}`;
    
    if (cache.ndviData[cacheKey] && isCacheValid(cache.ndviData[cacheKey])) {
      console.log(`Використання кешованих даних NDVI для ${cacheKey}`);
      return res.json({
        success: true,
        data: cache.ndviData[cacheKey].data,
        fromCache: true
      });
    }
    
    const ndviData = await vegetationService.getNDVIData({
      city,
      lat: lat ? parseFloat(lat) : null,
      lon: lon ? parseFloat(lon) : null,
      date
    });
    
    cache.ndviData[cacheKey] = {
      data: ndviData,
      timestamp: Date.now()
    };
    
    return res.json({
      success: true,
      data: ndviData
    });
  } catch (error) {
    console.error('Помилка отримання даних NDVI:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Помилка отримання даних вегетації'
    });
  }
}

async function getVegetationIndicesComparison(req, res) {
  try {
    const { city, lat, lon } = req.query;
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'Необхідно вказати місто або координати (lat, lon)'
      });
    }
    
    const cacheKey = city ? `city_${city}` : `coord_${lat}_${lon}`;
    
    if (cache.indicesComparison[cacheKey] && isCacheValid(cache.indicesComparison[cacheKey])) {
      console.log(`Використання кешованих даних порівняння індексів для ${cacheKey}`);
      return res.json({
        success: true,
        data: cache.indicesComparison[cacheKey].data,
        fromCache: true
      });
    }
    
    const comparisonData = await vegetationService.getVegetationIndicesComparison({
      city,
      lat: lat ? parseFloat(lat) : null,
      lon: lon ? parseFloat(lon) : null
    });
    
    cache.indicesComparison[cacheKey] = {
      data: comparisonData,
      timestamp: Date.now()
    };
    
    return res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Помилка отримання даних порівняння індексів:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Помилка отримання даних порівняння індексів вегетації'
    });
  }
}

module.exports = {
  getNDVIData,
  getVegetationIndicesComparison
};