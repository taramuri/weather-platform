const moistureService = require('../services/moistureService');

const cache = {
  regionalData: {}, 
  historicData: {} 
};

function isCacheValid(cacheEntry) {
  return cacheEntry && 
         cacheEntry.data && 
         cacheEntry.timestamp && 
         (Date.now() - cacheEntry.timestamp < cacheEntry.ttl);
}


async function getMoistureData(req, res) {
  try {
    const { city, lat, lon } = req.query;
    
    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: 'Необхідно вказати місто або координати (lat, lon)'
      });
    }
    
    const cacheKey = city ? `city_${city}` : `coord_${lat}_${lon}`;
    
    if (cache.regionalData[cacheKey] && isCacheValid(cache.regionalData[cacheKey])) {
      return res.json({
        success: true,
        data: cache.regionalData[cacheKey].data,
        fromCache: true
      });
    }
    
    try {
      const moistureData = await moistureService.getMoistureData({
        city,
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null
      });
      
      cache.regionalData[cacheKey] = {
        data: moistureData,
        timestamp: Date.now(),
        ttl: 2 * 60 * 60 * 1000 
      };
      
      return res.json({
        success: true,
        data: moistureData
      });
    } catch (error) {
      const baseValue = 50 + (Math.random() - 0.5) * 20;
      
      const mockData = {
        current_moisture: Math.round(baseValue),
        moisture: Math.round(baseValue),
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        risk_level: getRiskLevelFromMoisture(baseValue),
        current_moisture_10_40cm: Math.round(baseValue + (Math.random() - 0.5) * 10),
        current_moisture_40_100cm: Math.round(baseValue + (Math.random() - 0.5) * 15),
        historical_average: Math.round(45 + (Math.random() - 0.5) * 5),
        moisture_difference: Math.round(baseValue - 45),
        forecast: generateMockForecast(baseValue)
      };
      
      cache.regionalData[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: 2 * 60 * 60 * 1000 
      };
      
      return res.json({
        success: true,
        data: mockData,
        note: 'Використовуються тестові дані'
      });
    }
  } catch (error) {
    console.error('Помилка в контролері вологості:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Помилка отримання даних про вологість'
    });
  }
}

function getRiskLevelFromMoisture(moisture) {
  if (moisture < 30) return 'high-dry';
  if (moisture < 45) return 'moderate-dry';
  if (moisture < 65) return 'normal';
  if (moisture < 80) return 'moderate-wet';
  return 'high-wet';
}

function generateMockForecast(baseMoisture) {
  const forecast = [];
  const startDate = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const variation = Math.sin(i * 0.5) * 10;
    const moisture = Math.min(95, Math.max(5, Math.round(baseMoisture + variation)));
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      moisture: moisture,
      precipitation: Math.round(Math.random() * 10),
      temperature: Math.round(15 + (Math.random() - 0.5) * 10)
    });
  }
  
  return forecast;
}

async function getCropRecommendations(req, res) {
  try {
    const { city, crop } = req.query;
    
    if (!city || !crop) {
      return res.status(400).json({
        success: false,
        error: 'Необхідно вказати місто та культуру'
      });
    }
    
    const recommendations = await moistureService.getCropRecommendations(city, crop);
    
    return res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Помилка отримання рекомендацій для культури:', error);
    
    const mockRecommendations = {
      crop: crop,
      city: city,
      optimal_moisture: {
        min: crop === 'wheat' ? 35 : crop === 'corn' ? 40 : 30,
        max: crop === 'wheat' ? 70 : crop === 'corn' ? 80 : 65
      },
      watering_recommendation: 'Підтримуйте оптимальний режим поливу відповідно до стадії розвитку рослин.',
      current_status: 'Оптимальні умови для росту.'
    };
    
    return res.json({
      success: true,
      data: mockRecommendations,
      note: 'Використовуються тестові дані'
    });
  }
}

module.exports = {
  getMoistureData,
  getCropRecommendations
};