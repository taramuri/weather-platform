const axios = require('axios');
const weatherService = require('./weatherService');

require('dotenv').config();

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

class MoistureServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'MoistureServiceError';
    this.type = type;
  }
}

const moistureService = {
  async getMoistureData(params) {
    try {
      let coordinates;
      
      if (params.lat && params.lon) {
        coordinates = { latitude: params.lat, longitude: params.lon };
      } else if (params.city) {
        const location = await weatherService.getCoordinates(params.city);
        coordinates = { latitude: location.latitude, longitude: location.longitude };
      } else {
        throw new MoistureServiceError('Необхідно вказати місто або координати', 'PARAMS_MISSING');
      }
      
      const weatherData = await this.fetchWeatherData(coordinates.latitude, coordinates.longitude);
      const moistureData = await this.processMoistureData(coordinates.latitude, coordinates.longitude, weatherData);
      
      return moistureData;
    } catch (error) {
      console.error('Помилка отримання даних про вологість:', error);
      if (error.name === 'MoistureServiceError') {
        throw error;
      }
      throw new MoistureServiceError(`Помилка отримання даних про вологість: ${error.message}`, 'MOISTURE_DATA_ERROR');
    }
  },

  async fetchWeatherData(latitude, longitude) {
    try {
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: latitude,
          longitude: longitude,
          daily: 'precipitation_sum,precipitation_hours,precipitation_probability_max,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration',
          hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability',
          timezone: 'auto',
          forecast_days: 10,
          past_days: 30 
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Помилка запиту даних про погоду:', error.message);
      
      if (error.response) {
        console.error('Статус помилки:', error.response.status);
        throw new MoistureServiceError(`Помилка API погоди: ${error.response.status} - ${error.response.data?.reason || 'Невідома помилка'}`, 'WEATHER_API_ERROR');
      } else if (error.request) {
        throw new MoistureServiceError('Не вдалося отримати відповідь від API погоди', 'WEATHER_API_ERROR');
      } else {
        throw new MoistureServiceError('Помилка отримання даних про погоду: ' + error.message, 'WEATHER_API_ERROR');
      }
    }
  },

  async processMoistureData(latitude, longitude, weatherData) {
    try {
      const pastDaysCount = 30;
      const totalDaysCount = weatherData.daily.time.length;
      const historicalStartIndex = Math.max(0, totalDaysCount - pastDaysCount - 1);
      const currentIndex = totalDaysCount - 1;
      
      let pastPrecipitationSum = 0;
      for (let i = historicalStartIndex; i < currentIndex; i++) {
        pastPrecipitationSum += weatherData.daily.precipitation_sum[i] || 0;
      }
      
      let pastEvapotranspirationSum = 0;
      if (weatherData.daily.et0_fao_evapotranspiration) {
        for (let i = historicalStartIndex; i < currentIndex; i++) {
          pastEvapotranspirationSum += weatherData.daily.et0_fao_evapotranspiration[i] || 0;
        }
      } else {
        for (let i = historicalStartIndex; i < currentIndex; i++) {
          const avgTemp = (weatherData.daily.temperature_2m_max[i] + weatherData.daily.temperature_2m_min[i]) / 2;
          const estimatedET = 0.0023 * Math.max(0, avgTemp) * 1.5;
          pastEvapotranspirationSum += estimatedET;
        }
      }
      
      const moistureBalance = pastPrecipitationSum - pastEvapotranspirationSum;
      
      let currentTopSoilMoisture = 50; 
      
      if (moistureBalance > 50) {
        currentTopSoilMoisture = Math.min(95, 70 + moistureBalance / 10);
      } else if (moistureBalance > 20) {
        currentTopSoilMoisture = 60 + moistureBalance / 5;
      } else if (moistureBalance > -20) {
        currentTopSoilMoisture = 50 + moistureBalance / 4;
      } else if (moistureBalance > -50) {
        currentTopSoilMoisture = Math.max(20, 40 + moistureBalance / 3);
      } else {
        currentTopSoilMoisture = Math.max(5, 20 + moistureBalance / 5);
      }
      
      const historicalTopSoilMoisture = await this.estimateHistoricalMoisture(latitude, longitude, weatherData);
      
      const topSoilMoistureDiff = currentTopSoilMoisture - historicalTopSoilMoisture;
      
      let riskLevel = 'normal';
      if (topSoilMoistureDiff < -20) {
        riskLevel = 'high-dry';
      } else if (topSoilMoistureDiff < -10) {
        riskLevel = 'moderate-dry';
      } else if (topSoilMoistureDiff > 20) {
        riskLevel = 'high-wet'; 
      } else if (topSoilMoistureDiff > 10) {
        riskLevel = 'moderate-wet'; 
      }
      
      const riskZones = await this.generatePrecipitationBasedMoistureZones(
        latitude, longitude, weatherData, currentTopSoilMoisture, historicalTopSoilMoisture
      );
      
      return {
        current_moisture: parseFloat(currentTopSoilMoisture.toFixed(1)),
        historical_average: parseFloat(historicalTopSoilMoisture.toFixed(1)),
        moisture_difference: parseFloat(topSoilMoistureDiff.toFixed(1)),
        precipitation_last_30_days: parseFloat(pastPrecipitationSum.toFixed(1)),
        evapotranspiration_last_30_days: parseFloat(pastEvapotranspirationSum.toFixed(1)),
        moisture_balance: parseFloat(moistureBalance.toFixed(1)),
        risk_level: riskLevel,
        risk_zones: riskZones,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Помилка обробки даних про вологість:', error);
      throw new MoistureServiceError('Помилка обробки даних про вологість ґрунту: ' + error.message, 'DATA_PROCESSING_ERROR');
    }
  },

  async estimateHistoricalMoisture(latitude, longitude, weatherData) {
    const pastDaysCount = 30;
    const totalDaysCount = weatherData.daily.time.length;
    const historicalStartIndex = Math.max(0, totalDaysCount - pastDaysCount - 1);
    
    let pastPrecipitationSum = 0;
    let daysWithData = 0;
    
    for (let i = historicalStartIndex; i < totalDaysCount; i++) {
      if (weatherData.daily.precipitation_sum[i] !== undefined) {
        pastPrecipitationSum += weatherData.daily.precipitation_sum[i];
        daysWithData++;
      }
    }
    
    const avgDailyPrecipitation = daysWithData > 0 ? pastPrecipitationSum / daysWithData : 0;
    
    let avgTemperature = 0;
    if (weatherData.daily.temperature_2m_mean) {
      avgTemperature = weatherData.daily.temperature_2m_mean.slice(historicalStartIndex).reduce((a, b) => a + b, 0) / pastDaysCount;
    } else {
      const minTemps = weatherData.daily.temperature_2m_min.slice(historicalStartIndex);
      const maxTemps = weatherData.daily.temperature_2m_max.slice(historicalStartIndex);
      
      let sum = 0;
      for (let i = 0; i < minTemps.length && i < maxTemps.length; i++) {
        if (minTemps[i] !== undefined && maxTemps[i] !== undefined) {
          sum += (minTemps[i] + maxTemps[i]) / 2;
        }
      }
      avgTemperature = sum / minTemps.length;
    }
    
    let baseMoisture = 50;
    
    const latitudeFactor = 1 - Math.abs(latitude) / 90; 
    
    baseMoisture += latitudeFactor * 10;
    
    const precipitationFactor = avgDailyPrecipitation / 3;
    baseMoisture += (precipitationFactor - 1) * 15;
    
    const tempFactor = Math.max(0, avgTemperature - 15) / 10; 
    baseMoisture -= tempFactor * 5;
    
    return Math.min(70, Math.max(30, baseMoisture));
  },

  async generatePrecipitationBasedMoistureZones(latitude, longitude, weatherData, currentMoisture, historicalAverage) {
    try {
      const gridSize = 5;
      const gridStep = 0.02; 
      
      const grid = [];
      for (let latIdx = 0; latIdx < gridSize; latIdx++) {
        for (let lonIdx = 0; lonIdx < gridSize; lonIdx++) {
          const latOffset = (latIdx - Math.floor(gridSize/2)) * gridStep;
          const lonOffset = (lonIdx - Math.floor(gridSize/2)) * gridStep;
          
          grid.push({
            latitude: latitude + latOffset,
            longitude: longitude + lonOffset
          });
        }
      }
      
      const gridPrecipitation = grid.map(point => {
        const variationFactor = 0.8 + Math.random() * 0.4; 
        
        const pastDaysCount = 7;
        const totalDaysCount = weatherData.daily.time.length;
        const startIdx = Math.max(0, totalDaysCount - pastDaysCount);
        
        let precipitation = 0;
        for (let i = startIdx; i < totalDaysCount; i++) {
          precipitation += (weatherData.daily.precipitation_sum[i] || 0) * variationFactor;
        }
        
        return {
          ...point,
          precipitation
        };
      });
      
      const avgPrecipitation = gridPrecipitation.reduce((sum, point) => sum + point.precipitation, 0) / gridPrecipitation.length;
      
      const moistureDifference = currentMoisture - historicalAverage;
      
      const gridMoisture = gridPrecipitation.map(point => {
        const relativePrec = point.precipitation / (avgPrecipitation || 1);
        
        let moisture;
        if (moistureDifference > 10) {
          moisture = currentMoisture + (relativePrec - 1) * 20;
        } else if (moistureDifference < -10) {
          moisture = currentMoisture + (relativePrec - 1) * 10;
        } else {
            // Нормальний випадок
         moisture = currentMoisture + (relativePrec - 1) * 15;
        }
        
        moisture = Math.min(100, Math.max(0, moisture));
        
        return {
          ...point,
          moisture
        };
      });
      
      const dryZones = gridMoisture
        .filter(point => point.moisture < currentMoisture - 10)
        .map(point => ({
          lat: point.latitude,
          lon: point.longitude,
          moisture: parseFloat(point.moisture.toFixed(1)),
          radius: 500 + Math.random() * 300 // Більший радіус для більш сухих зон
        }));
        
      const normalZones = gridMoisture
        .filter(point => point.moisture >= currentMoisture - 10 && point.moisture <= currentMoisture + 10)
        .map(point => ({
          lat: point.latitude,
          lon: point.longitude,
          moisture: parseFloat(point.moisture.toFixed(1)),
          radius: 600 + Math.random() * 200
        }));
        
      const wetZones = gridMoisture
        .filter(point => point.moisture > currentMoisture + 10)
        .map(point => ({
          lat: point.latitude,
          lon: point.longitude,
          moisture: parseFloat(point.moisture.toFixed(1)),
          radius: 400 + Math.random() * 200 
        }));
      
      if (dryZones.length === 0) {
        dryZones.push({
          lat: latitude + (Math.random() - 0.5) * 0.03,
          lon: longitude + (Math.random() - 0.5) * 0.03,
          moisture: Math.max(5, currentMoisture - 15),
          radius: 500 + Math.random() * 300
        });
      }
      
      if (normalZones.length === 0) {
        normalZones.push({
          lat: latitude + (Math.random() - 0.5) * 0.03,
          lon: longitude + (Math.random() - 0.5) * 0.03,
          moisture: currentMoisture,
          radius: 600 + Math.random() * 200
        });
      }
      
      if (wetZones.length === 0) {
        wetZones.push({
          lat: latitude + (Math.random() - 0.5) * 0.03,
          lon: longitude + (Math.random() - 0.5) * 0.03,
          moisture: Math.min(95, currentMoisture + 15),
          radius: 400 + Math.random() * 200
        });
      }
      
      return {
        dry_zones: dryZones,
        normal_zones: normalZones,
        wet_zones: wetZones,
        source: 'precipitation'
      };
    } catch (error) {
      console.error('Помилка генерації зон на основі опадів:', error);
      // У випадку помилки використовуємо базовий алгоритм
      return this.generateBasicMoistureZones(latitude, longitude, currentMoisture, historicalAverage);
    }
  },
 
  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  },
 
  generateBasicMoistureZones(centerLat, centerLon, currentMoisture, historicalAverage) {
    const randomOffset = () => (Math.random() - 0.5) * 0.05; 
    const moistureDifference = currentMoisture - historicalAverage;
    
    let dryZonesCount, normalZonesCount, wetZonesCount;
    
    if (moistureDifference < -15) {
      // Якщо дуже сухо, більше сухих зон
      dryZonesCount = 4;
      normalZonesCount = 2;
      wetZonesCount = 1;
    } else if (moistureDifference < 0) {
      // Якщо помірно сухо
      dryZonesCount = 3;
      normalZonesCount = 3;
      wetZonesCount = 1;
    } else if (moistureDifference > 15) {
      dryZonesCount = 1;
      normalZonesCount = 2;
      wetZonesCount = 4;
    } else if (moistureDifference > 0) {
      // Якщо помірно волого
      dryZonesCount = 1;
      normalZonesCount = 3;
      wetZonesCount = 3;
    } else {
      // Якщо нормальна вологість
      dryZonesCount = 2;
      normalZonesCount = 4;
      wetZonesCount = 2;
    }
    
    const dryZones = Array.from({ length: dryZonesCount }, () => {
      return {
        lat: centerLat + randomOffset(),
        lon: centerLon + randomOffset(),
        moisture: Math.max(5, currentMoisture - 15 + (Math.random() - 0.5) * 10),
        radius: 500 + Math.random() * 500
      };
    });
    
    const normalZones = Array.from({ length: normalZonesCount }, () => {
      return {
        lat: centerLat + randomOffset(),
        lon: centerLon + randomOffset(),
        moisture: currentMoisture + (Math.random() - 0.5) * 10,
        radius: 700 + Math.random() * 300
      };
    });
    
    const wetZones = Array.from({ length: wetZonesCount }, () => {
      return {
        lat: centerLat + randomOffset(),
        lon: centerLon + randomOffset(),
        moisture: Math.min(95, currentMoisture + 15 + (Math.random() - 0.5) * 10),
        radius: 400 + Math.random() * 300
      };
    });
    
    return {
      dry_zones: dryZones,
      normal_zones: normalZones,
      wet_zones: wetZones,
      source: 'basic'
    };
  },
 
  async getCropRecommendations(city, crop) {
    try {
      const moistureData = await this.getMoistureData({ city });
      
      const cropMoistureRanges = {
        wheat: { min: 35, max: 70, name: 'пшениці' },
        corn: { min: 40, max: 80, name: 'кукурудзи' },
        sunflower: { min: 30, max: 65, name: 'соняшнику' },
        rapeseed: { min: 35, max: 75, name: 'ріпаку' },
        soybean: { min: 40, max: 80, name: 'сої' },
        potato: { min: 45, max: 85, name: 'картоплі' },
        default: { min: 35, max: 70, name: 'сільськогосподарських культур' }
      };
      
      const cropRange = cropMoistureRanges[crop] || cropMoistureRanges.default;
      
      const currentMoisture = moistureData.current_moisture;
      
      let status, recommendation;
      
      if (currentMoisture < cropRange.min - 10) {
        status = 'critical-dry';
        recommendation = `Критично низька вологість для ${cropRange.name}. Рекомендується негайний полив для запобігання втраті врожаю.`;
      } else if (currentMoisture < cropRange.min) {
        status = 'dry';
        recommendation = `Вологість нижче оптимальної для ${cropRange.name}. Рекомендується провести полив у найближчі 1-2 дні.`;
      } else if (currentMoisture > cropRange.max + 10) {
        status = 'critical-wet';
        recommendation = `Критично висока вологість для ${cropRange.name}. Уникайте додаткового поливу та забезпечте дренаж ділянок, якщо можливо.`;
      } else if (currentMoisture > cropRange.max) {
        status = 'wet';
        recommendation = `Вологість вище оптимальної для ${cropRange.name}. Не рекомендується полив у найближчі 5-7 днів.`;
      } else {
        status = 'optimal';
        recommendation = `Оптимальна вологість для ${cropRange.name}. Підтримуйте поточний режим поливу.`;
      }
      
      return {
        crop,
        crop_name: cropRange.name,
        current_moisture: currentMoisture,
        optimal_range: {
          min: cropRange.min,
          max: cropRange.max
        },
        status,
        recommendation,
        last_updated: moistureData.last_updated
      };
    } catch (error) {
      console.error('Помилка отримання рекомендацій для культури:', error);
      throw new MoistureServiceError('Помилка отримання рекомендацій для культури: ' + error.message, 'CROP_RECOMMENDATION_ERROR');
    }
  }
};

module.exports = moistureService;