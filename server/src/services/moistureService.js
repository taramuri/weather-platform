// moistureService.js - спрощений без Sentinel Hub
const axios = require('axios');
const weatherService = require('./weatherService');

require('dotenv').config();

// Базові URL для API
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

// Клас для помилок сервісу
class MoistureServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'MoistureServiceError';
    this.type = type;
  }
}

const moistureService = {
  /**
   * Отримання даних про вологість ґрунту
   * @param {Object} params - Параметри запиту (city або lat/lon)
   * @returns {Promise<Object>} Дані про вологість
   */
  async getMoistureData(params) {
    try {
      let coordinates;
      
      // Визначаємо координати по місту або використовуємо прямі координати
      if (params.lat && params.lon) {
        coordinates = { latitude: params.lat, longitude: params.lon };
      } else if (params.city) {
        const location = await weatherService.getCoordinates(params.city);
        coordinates = { latitude: location.latitude, longitude: location.longitude };
      } else {
        throw new MoistureServiceError('Необхідно вказати місто або координати', 'PARAMS_MISSING');
      }
      
      // Отримуємо дані про погоду
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

  /**
   * Отримання даних про погоду з Open-Meteo API
   * @param {number} latitude - Широта
   * @param {number} longitude - Довгота
   * @returns {Promise<Object>} Дані про погоду
   */
  async fetchWeatherData(latitude, longitude) {
    try {
      console.log(`Запит даних погоди для координат [${latitude}, ${longitude}]...`);
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: latitude,
          longitude: longitude,
          daily: 'precipitation_sum,precipitation_hours,precipitation_probability_max,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration',
          hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability',
          timezone: 'auto',
          forecast_days: 10,
          past_days: 30 // Отримуємо історичні дані за останні 30 днів
        }
      });
      
      console.log(`Дані погоди успішно отримано для координат [${latitude}, ${longitude}]`);
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

  /**
   * Обробка даних про погоду для визначення вологості ґрунту
   * @param {number} latitude - Широта
   * @param {number} longitude - Довгота
   * @param {Object} weatherData - Дані про погоду
   * @returns {Object} - Дані про вологість ґрунту
   */
  async processMoistureData(latitude, longitude, weatherData) {
    try {
      // Отримуємо дані про опади за останні 30 днів
      const pastDaysCount = 30;
      const totalDaysCount = weatherData.daily.time.length;
      const historicalStartIndex = Math.max(0, totalDaysCount - pastDaysCount - 1);
      const currentIndex = totalDaysCount - 1;
      
      // Обчислюємо суму опадів за останні 30 днів
      let pastPrecipitationSum = 0;
      for (let i = historicalStartIndex; i < currentIndex; i++) {
        pastPrecipitationSum += weatherData.daily.precipitation_sum[i] || 0;
      }
      
      // Обчислюємо суму евапотранспірації (випаровування) за останні 30 днів
      let pastEvapotranspirationSum = 0;
      if (weatherData.daily.et0_fao_evapotranspiration) {
        for (let i = historicalStartIndex; i < currentIndex; i++) {
          pastEvapotranspirationSum += weatherData.daily.et0_fao_evapotranspiration[i] || 0;
        }
      } else {
        // Якщо дані про евапотранспірацію відсутні, оцінюємо на основі температури
        for (let i = historicalStartIndex; i < currentIndex; i++) {
          const avgTemp = (weatherData.daily.temperature_2m_max[i] + weatherData.daily.temperature_2m_min[i]) / 2;
          const estimatedET = 0.0023 * Math.max(0, avgTemp) * 1.5;
          pastEvapotranspirationSum += estimatedET;
        }
      }
      
      // Різниця між опадами та випаровуванням
      const moistureBalance = pastPrecipitationSum - pastEvapotranspirationSum;
      
      // Визначаємо поточну вологість на основі балансу опадів та випаровування
      let currentTopSoilMoisture = 50; // Середня вологість за замовчуванням
      
      if (moistureBalance > 50) {
        // Дуже вологий ґрунт
        currentTopSoilMoisture = Math.min(95, 70 + moistureBalance / 10);
      } else if (moistureBalance > 20) {
        // Вологий ґрунт
        currentTopSoilMoisture = 60 + moistureBalance / 5;
      } else if (moistureBalance > -20) {
        // Нормальний ґрунт
        currentTopSoilMoisture = 50 + moistureBalance / 4;
      } else if (moistureBalance > -50) {
        // Сухий ґрунт
        currentTopSoilMoisture = Math.max(20, 40 + moistureBalance / 3);
      } else {
        // Дуже сухий ґрунт
        currentTopSoilMoisture = Math.max(5, 20 + moistureBalance / 5);
      }
      
      // Оцінюємо історичну середню вологість
      const historicalTopSoilMoisture = await this.estimateHistoricalMoisture(latitude, longitude, weatherData);
      
      // Обчислюємо різницю між поточною та історичною вологістю
      const topSoilMoistureDiff = currentTopSoilMoisture - historicalTopSoilMoisture;
      
      // Визначаємо рівень ризику
      let riskLevel = 'normal';
      if (topSoilMoistureDiff < -20) {
        riskLevel = 'high-dry'; // Високий ризик посухи
      } else if (topSoilMoistureDiff < -10) {
        riskLevel = 'moderate-dry'; // Помірний ризик посухи
      } else if (topSoilMoistureDiff > 20) {
        riskLevel = 'high-wet'; // Високий ризик перезволоження
      } else if (topSoilMoistureDiff > 10) {
        riskLevel = 'moderate-wet'; // Помірний ризик перезволоження
      }
      
      // Створюємо зони вологості для відображення на карті
      const riskZones = await this.generatePrecipitationBasedMoistureZones(
        latitude, longitude, weatherData, currentTopSoilMoisture, historicalTopSoilMoisture
      );
      
      // Формуємо результат
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

  /**
   * Оцінка історичної вологості ґрунту
   * @param {number} latitude - Широта
   * @param {number} longitude - Довгота
   * @param {Object} weatherData - Дані про погоду
   * @returns {number} - Оцінка історичної вологості
   */
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
    
    // Коригування на основі широти (близькість до екватора)
    const latitudeFactor = 1 - Math.abs(latitude) / 90; // 1 на екваторі, 0 на полюсах
    
    // Регіони ближче до екватора зазвичай мають більше опадів
    baseMoisture += latitudeFactor * 10;
    
    // Коригування на основі середніх опадів
    // ~3мм опадів на день вважається нормою (90мм на місяць)
    const precipitationFactor = avgDailyPrecipitation / 3;
    baseMoisture += (precipitationFactor - 1) * 15;
    
    // Коригування на основі температури
    // Висока температура = більше випаровування = менша вологість
    const tempFactor = Math.max(0, avgTemperature - 15) / 10; // 15°C вважається нормою
    baseMoisture -= tempFactor * 5;
    
    // Обмеження в діапазоні 30-70%
    return Math.min(70, Math.max(30, baseMoisture));
  },

  /**
   * Генерація зон вологості на основі даних про опади
   * @param {number} latitude - Широта
   * @param {number} longitude - Довгота
   * @param {Object} weatherData - Дані про погоду
   * @param {number} currentMoisture - Поточна вологість
   * @param {number} historicalAverage - Історична середня вологість
   * @returns {Object} - Зони вологості
   */
  async generatePrecipitationBasedMoistureZones(latitude, longitude, weatherData, currentMoisture, historicalAverage) {
    try {
      // Створюємо сітку точок навколо центральної координати
      const gridSize = 5; // 5x5 сітка
      const gridStep = 0.02; // Крок сітки (~2 км)
      
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
      
      // Отримуємо дані про опади для кожної точки сітки
      // За замовчуванням припускаємо, що опади близькі до центральної точки
      // Але додаємо варіації для більшої реалістичності
      const gridPrecipitation = grid.map(point => {
        // Додаємо випадкову варіацію до опадів (±20%)
        const variationFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2
        
        // Беремо сумарну кількість опадів за останні 7 днів з weatherData
        const pastDaysCount = 7;
        const totalDaysCount = weatherData.daily.time.length;
        const startIdx = Math.max(0, totalDaysCount - pastDaysCount);
        
        // Сума опадів з урахуванням варіації для кожної точки
        let precipitation = 0;
        for (let i = startIdx; i < totalDaysCount; i++) {
          precipitation += (weatherData.daily.precipitation_sum[i] || 0) * variationFactor;
        }
        
        return {
          ...point,
          precipitation
        };
      });
      
      // Знаходимо середній рівень опадів для всієї сітки
      const avgPrecipitation = gridPrecipitation.reduce((sum, point) => sum + point.precipitation, 0) / gridPrecipitation.length;
      
      // Визначаємо вологість для кожної точки на основі опадів
      // та відносної вологості ґрунту
      const moistureDifference = currentMoisture - historicalAverage;
      
      const gridMoisture = gridPrecipitation.map(point => {
        // Відносний рівень опадів порівняно з середнім
        const relativePrec = point.precipitation / (avgPrecipitation || 1);
        
        // Розрахунок вологості на основі відносного рівня опадів
        // та загальної вологості ґрунту
        let moisture;
        if (moistureDifference > 10) {
          // Якщо вже волого, то навіть невеликі опади значно збільшують вологість
          moisture = currentMoisture + (relativePrec - 1) * 20;
        } else if (moistureDifference < -10) {
          // Якщо сухо, то потрібно більше опадів для збільшення вологості
          moisture = currentMoisture + (relativePrec - 1) * 10;
        } else {
            // Нормальний випадок
         moisture = currentMoisture + (relativePrec - 1) * 15;
        }
        
        // Обмежуємо значення вологості в діапазоні 0-100%
        moisture = Math.min(100, Math.max(0, moisture));
        
        return {
          ...point,
          moisture
        };
      });
      
      // Групуємо точки за рівнем вологості
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
          radius: 400 + Math.random() * 200 // Менший радіус для більш вологих зон
        }));
      
      // Забезпечуємо, що у нас є хоча б одна зона кожного типу
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
 
  /**
   * Розрахувати середнє значення масиву чисел
   * @param {Array<number>} values - Масив значень
   * @returns {number} - Середнє значення
   */
  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  },
 
  /**
   * Згенерувати базові зони ризику для відображення на карті (резервний метод)
   * @param {number} centerLat - Центральна широта
   * @param {number} centerLon - Центральна довгота
   * @param {number} currentMoisture - Поточна вологість
   * @param {number} historicalAverage - Історична середня вологість
   * @returns {Object} - Зони ризику для відображення на карті
   */
  generateBasicMoistureZones(centerLat, centerLon, currentMoisture, historicalAverage) {
    // Розрахунок зон з різним рівнем вологості навколо центральної точки
    const randomOffset = () => (Math.random() - 0.5) * 0.05; // Менший розкид для реалістичності
    const moistureDifference = currentMoisture - historicalAverage;
    
    // Кількість зон кожного типу залежить від різниці між поточною та історичною вологістю
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
      // Якщо дуже волого, більше вологих зон
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
    
    // Генерація сухих зон
    const dryZones = Array.from({ length: dryZonesCount }, () => {
      return {
        lat: centerLat + randomOffset(),
        lon: centerLon + randomOffset(),
        moisture: Math.max(5, currentMoisture - 15 + (Math.random() - 0.5) * 10),
        radius: 500 + Math.random() * 500
      };
    });
    
    // Генерація нормальних зон
    const normalZones = Array.from({ length: normalZonesCount }, () => {
      return {
        lat: centerLat + randomOffset(),
        lon: centerLon + randomOffset(),
        moisture: currentMoisture + (Math.random() - 0.5) * 10,
        radius: 700 + Math.random() * 300
      };
    });
    
    // Генерація вологих зон
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
  
  /**
   * Отримати рекомендації для вказаної культури на основі даних про вологість
   * @param {string} city - Назва міста
   * @param {string} crop - Назва культури
   * @returns {Promise<Object>} - Рекомендації
   */
  async getCropRecommendations(city, crop) {
    try {
      // Отримуємо дані про вологість
      const moistureData = await this.getMoistureData({ city });
      
      // Мапа оптимальних діапазонів вологості для різних культур
      const cropMoistureRanges = {
        wheat: { min: 35, max: 70, name: 'пшениці' },
        corn: { min: 40, max: 80, name: 'кукурудзи' },
        sunflower: { min: 30, max: 65, name: 'соняшнику' },
        rapeseed: { min: 35, max: 75, name: 'ріпаку' },
        soybean: { min: 40, max: 80, name: 'сої' },
        potato: { min: 45, max: 85, name: 'картоплі' },
        default: { min: 35, max: 70, name: 'сільськогосподарських культур' }
      };
      
      // Отримуємо оптимальні значення для вказаної культури або використовуємо значення за замовчуванням
      const cropRange = cropMoistureRanges[crop] || cropMoistureRanges.default;
      
      // Поточна вологість верхнього шару ґрунту
      const currentMoisture = moistureData.current_moisture;
      
      // Визначаємо статус вологості для вказаної культури
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
      
      // Формуємо відповідь
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