const axios = require('axios');
const { URLSearchParams } = require('url');
const weatherService = require('./weatherService');

const NASA_POWER_API_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const SENTINEL_HUB_API_URL = 'https://services.sentinel-hub.com/api/v1/process';
const SENTINEL_CLIENT_ID = process.env.SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;

class VegetationService {
  constructor() {
    this.vegetationCache = {};
    this.cacheTimeout = 3600000;
    
    this.sentinelHubToken = null;
    
    if (!SENTINEL_CLIENT_ID || !SENTINEL_CLIENT_SECRET) {
      console.warn('УВАГА: Змінні середовища SENTINEL_CLIENT_ID та/або SENTINEL_CLIENT_SECRET не встановлені. Аутентифікація Sentinel Hub буде недоступна.');
    }
    
    this.initCityDataCache();
  }

  async initCityDataCache() {
    try {
      const cities = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Запоріжжя', 'Вінниця', 'Рівне'];
      
      for (const city of cities) {
        try {
          const coordinates = await weatherService.getCoordinates(city);
          
          if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
            console.warn(`Не вдалося отримати координати для міста ${city}`);
            continue;
          }
          
          const cacheKey = `city_${city}`;
          
          const currentMonth = new Date().getMonth();
          const isNorthernHemisphere = coordinates.latitude > 0;
          
          let baseNdvi;
          
          if (isNorthernHemisphere) {
            if (currentMonth >= 3 && currentMonth <= 8) {
              baseNdvi = 0.6 + (Math.random() * 0.1);
            } else {
              baseNdvi = 0.3 + (Math.random() * 0.1);
            }
          } else {
            if (currentMonth >= 9 || currentMonth <= 2) {
              baseNdvi = 0.6 + (Math.random() * 0.1);
            } else {
              baseNdvi = 0.3 + (Math.random() * 0.1);
            }
          }
          
          baseNdvi = Math.max(0.1, Math.min(0.9, baseNdvi));
          
          const eviValue = baseNdvi * 0.9;
          const saviValue = baseNdvi * 0.85;
          
          this.vegetationCache[`ndvi_${coordinates.latitude.toFixed(4)}_${coordinates.longitude.toFixed(4)}`] = {
            data: {
              city: city,
              coordinates: { lat: coordinates.latitude, lon: coordinates.longitude },
              current_ndvi: parseFloat(baseNdvi.toFixed(2)),
              evi: parseFloat(eviValue.toFixed(2)),
              savi: parseFloat(saviValue.toFixed(2)),
              health_index: this.calculateHealthIndex(baseNdvi),
              vegetation_status: this.getVegetationStatus(baseNdvi),
              last_updated: new Date().toISOString(),
              is_cache: true,
              data_source: 'Кешовані дані'
            },
            timestamp: Date.now()
          };
          
          this.vegetationCache[`comparison_${coordinates.latitude.toFixed(4)}_${coordinates.longitude.toFixed(4)}`] = {
            data: this.generateDemoComparisonData(
              { lat: coordinates.latitude, lon: coordinates.longitude }, 
              city
            ),
            timestamp: Date.now()
          };
          
          this.vegetationCache[cacheKey] = this.vegetationCache[`ndvi_${coordinates.latitude.toFixed(4)}_${coordinates.longitude.toFixed(4)}`];
        } catch (error) {
          console.error(`Помилка при ініціалізації кешу для міста ${city}:`, error.message);
        }
      }
      
      console.log(`Ініціалізовано кеш для ${Object.keys(this.vegetationCache).filter(key => key.startsWith('city_')).length} міст`);
    } catch (error) {
      console.error('Помилка при ініціалізації кешу міст:', error.message);
    }
  }

  async getNDVIData(params) {
    try {
      const { city, lat, lon } = params;
      
      if (!city && (!lat || !lon)) {
        return {
          success: false,
          error: 'Необхідно вказати місто або координати (lat, lon)'
        };
      }
      
      let coordinates;
      try {
        if (city) {
          const locationData = await weatherService.getCoordinates(city);
          coordinates = { 
            lat: locationData.latitude, 
            lon: locationData.longitude,
            city: locationData.name || city
          };
        } else {
          coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
          try {
            const cityName = await weatherService.getLocationByCoordinates(lat, lon);
            coordinates.city = cityName;
          } catch (cityError) {
            console.log('Не вдалося визначити місто за координатами:', cityError.message);
          }
        }
      } catch (coordError) {
        console.error('Помилка отримання координат:', coordError.message);
        coordinates = { lat: 50.4501, lon: 30.5234, city: 'Київ' }; 
      }
      
      if (!coordinates || !coordinates.lat || !coordinates.lon) {
        console.error('Отримано невалідні координати. Використовуємо координати Києва');
        coordinates = { lat: 50.4501, lon: 30.5234, city: 'Київ' };
      }
      
      const cacheKey = `ndvi_${coordinates.lat.toFixed(4)}_${coordinates.lon.toFixed(4)}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData
        };
      }
      
      let apiSucceeded = false;
      let ndviData = null;
      
      if (SENTINEL_CLIENT_ID && SENTINEL_CLIENT_SECRET) {
        try {
          console.log(`Запит даних з Sentinel Hub API для координат [${coordinates.lat}, ${coordinates.lon}]`);
          ndviData = await this.fetchSentinelHubData(coordinates.lat, coordinates.lon);
          if (coordinates.city) ndviData.city = coordinates.city;
          apiSucceeded = true;
        } catch (sentinelError) {
          console.log('Помилка отримання даних з Sentinel Hub:', sentinelError.message);
        }
      } else {
        console.log('Sentinel Hub API недоступний (відсутні облікові дані)');
      }
      
      if (!apiSucceeded) {
        try {
          console.log(`Запит даних з NASA POWER API для координат [${coordinates.lat}, ${coordinates.lon}]`);
          const nasaData = await this.fetchNASAPowerData(coordinates.lat, coordinates.lon);
          ndviData = this.processNASAData(nasaData, coordinates);
          if (coordinates.city) ndviData.city = coordinates.city;
          apiSucceeded = true;
        } catch (nasaError) {
          console.log('Помилка отримання даних з NASA API:', nasaError.message);
        }
      }
      
      if (!apiSucceeded && coordinates.city) {
        try {
          console.log(`Запит погодних даних для міста ${coordinates.city}`);
          const weatherData = await weatherService.getCurrentWeather(coordinates.city);
          ndviData = this.generateNDVIFromWeather(weatherData, coordinates);
          apiSucceeded = true;
        } catch (weatherError) {
          console.log('Помилка отримання погодних даних:', weatherError.message);
        }
      }
      
      if (!apiSucceeded) {
        if (coordinates.city && this.vegetationCache[`city_${coordinates.city}`]) {
          console.log(`Використання кешованих даних NDVI для city_${coordinates.city}`);
          return {
            success: true,
            data: this.vegetationCache[`city_${coordinates.city}`].data
          };
        }
        
        if (this.vegetationCache['city_Київ']) {
          console.log('Використання кешованих даних NDVI для city_Київ');
          const kyivData = {...this.vegetationCache['city_Київ'].data};
          
          if (coordinates.city) kyivData.city = coordinates.city;
          kyivData.coordinates = { lat: coordinates.lat, lon: coordinates.lon };
          
          return {
            success: true,
            data: kyivData
          };
        }
        
        console.log('Створення демо-даних для NDVI');
        ndviData = this.generateDemoData(coordinates);
      }
      
      if (ndviData) {
        this.saveToCache(cacheKey, ndviData);
        if (coordinates.city) {
          this.saveToCache(`city_${coordinates.city}`, ndviData);
        }
      }
      
      return {
        success: true,
        data: ndviData
      };
    } catch (error) {
      console.error('Помилка отримання даних NDVI:', error);
      
      return {
        success: true,
        data: {
          city: params.city || "Невідоме місто",
          coordinates: { lat: 50.4501, lon: 30.5234 },
          current_ndvi: 0.55,
          evi: 0.50,
          savi: 0.47,
          health_index: 'moderate',
          vegetation_status: 'Середня вегетація',
          last_updated: new Date().toISOString(),
          is_demo: true,
          is_fallback: true,
          data_source: 'Аварійні демо-дані'
        }
      };
    }
  }

  async getVegetationIndicesComparison(params) {
    try {
      const { city, lat, lon } = params;
      
      if (!city && (!lat || !lon)) {
        return {
          success: false,
          error: 'Необхідно вказати місто або координати (lat, lon)'
        };
      }
      
      let coordinates;
      try {
        if (city) {
          const locationData = await weatherService.getCoordinates(city);
          coordinates = { 
            lat: locationData.latitude, 
            lon: locationData.longitude,
            city: locationData.name || city
          };
        } else {
          coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
          try {
            const cityName = await weatherService.getLocationByCoordinates(lat, lon);
            coordinates.city = cityName;
          } catch (cityError) {
            console.log('Не вдалося визначити місто за координатами:', cityError.message);
          }
        }
      } catch (coordError) {
        console.error('Помилка отримання координат:', coordError.message);
        coordinates = { lat: 50.4501, lon: 30.5234, city: 'Київ' };
      }
      
      const cacheKey = `comparison_${coordinates.lat.toFixed(4)}_${coordinates.lon.toFixed(4)}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData
        };
      }
      
      let apiSucceeded = false;
      let comparisonData = null;
      let errorMessages = [];

      if (!apiSucceeded) {
      try {
        console.log(`Запит історичних даних з NASA POWER API для координат [${coordinates.lat}, ${coordinates.lon}]`);
        const nasaData = await this.fetchHistoricalNASAData(coordinates.lat, coordinates.lon);
        comparisonData = this.processHistoricalNASAData(nasaData, coordinates);
        if (coordinates.city) comparisonData.city = coordinates.city;
        apiSucceeded = true;
      } catch (nasaError) {
        errorMessages.push(`NASA POWER API помилка: ${nasaError.message}`);
        console.log('Помилка отримання історичних даних з NASA API:', nasaError.message);
      }
    }
      
      if (!apiSucceeded) {
        try {
          console.log(`Запит історичних даних з NASA POWER API для координат [${coordinates.lat}, ${coordinates.lon}]`);
          const nasaData = await this.fetchHistoricalNASAData(coordinates.lat, coordinates.lon);
          comparisonData = this.processHistoricalNASAData(nasaData, coordinates);
          if (coordinates.city) comparisonData.city = coordinates.city;
          apiSucceeded = true;
        } catch (nasaError) {
          console.log('Помилка отримання історичних даних з NASA API:', nasaError.message);
        }
      }
      
      if (!apiSucceeded && coordinates.city) {
        try {
          console.log(`Запит даних прогнозу для міста ${coordinates.city}`);
          const forecastData = await weatherService.getMonthlyForecast(coordinates.city);
          comparisonData = this.generateComparisonFromForecast(forecastData, coordinates);
          apiSucceeded = true;
        } catch (weatherError) {
          console.log('Помилка отримання даних прогнозу:', weatherError.message);
        }
      }
      
      if (!apiSucceeded) {
        const cityKey = `comparison_${coordinates.city || 'unknown'}`;
        if (coordinates.city && this.vegetationCache[cityKey]) {
          console.log(`Використання кешованих даних порівняння для ${coordinates.city}`);
          return {
            success: true,
            data: this.vegetationCache[cityKey].data
          };
        }
        
        if (this.vegetationCache['comparison_Київ']) {
          console.log('Використання кешованих даних порівняння для city_Київ');
          let data = {...this.vegetationCache['comparison_Київ'].data};
          if (coordinates.city) data.city = coordinates.city;
          data.coordinates = { lat: coordinates.lat, lon: coordinates.lon };
          
          return {
            success: true,
            data: data
          };
        }
        
        console.log('Створення нових демо-даних для порівняння');
        comparisonData = this.generateDemoComparisonData(coordinates, coordinates.city);
      }
      
      if (comparisonData) {
        this.saveToCache(cacheKey, comparisonData);
        if (coordinates.city) {
          this.saveToCache(`comparison_${coordinates.city}`, comparisonData);
        }
      }
      
      return {
        success: true,
        data: comparisonData
      };
    } catch (error) {
      console.error('Помилка отримання даних порівняння індексів:', error);
      
      const demoData = this.generateDemoComparisonData(
        { lat: params.lat || 50.4501, lon: params.lon || 30.5234 }, 
        params.city || "Київ"
      );
      
      return {
        success: true,
        data: demoData
      };
    }
  }

  generateNDVIFromWeather(weatherData, coordinates) {
    try {
      const temperature = weatherData.temperature || 15;
      const humidity = (weatherData.humidity || 50) / 100;
      const windSpeed = weatherData.windSpeed || 5;
      
      const soilMoisture = Math.min(0.8, Math.max(0.1, humidity * 0.7));
      
      const date = new Date();
      const month = date.getMonth();
      const isNorthernHemisphere = coordinates.lat > 0;
      
      let radiationFactor;
      if (isNorthernHemisphere) {
        if (month >= 4 && month <= 8) {
          radiationFactor = 0.8 + Math.random() * 0.2;
        } else if (month >= 9 || month <= 1) {
          radiationFactor = 0.2 + Math.random() * 0.3;
        } else {
          radiationFactor = 0.5 + Math.random() * 0.2;
        }
      } else {
        if (month >= 10 || month <= 2) {
          radiationFactor = 0.8 + Math.random() * 0.2;
        } else if (month >= 4 && month <= 8) {
          radiationFactor = 0.2 + Math.random() * 0.3;
        } else {
          radiationFactor = 0.5 + Math.random() * 0.2;
        }
      }
      
      const tempFactor = this.getTemperatureOptimality(temperature);
      
      let ndviValue = (tempFactor * 0.4) + (soilMoisture * 0.4) + (radiationFactor * 0.2);
      
      ndviValue = 0.1 + ndviValue * 0.8;
      
      ndviValue = Math.max(0.1, Math.min(0.9, ndviValue));
      
      const eviValue = ndviValue * 0.9 - 0.05;
      const saviValue = ndviValue * 0.85;
      
      return {
        city: coordinates.city || weatherData.city || "Невідоме місто",
        coordinates: { lat: coordinates.lat, lon: coordinates.lon },
        current_ndvi: parseFloat(ndviValue.toFixed(2)),
        evi: parseFloat(eviValue.toFixed(2)),
        savi: parseFloat(saviValue.toFixed(2)),
        health_index: this.calculateHealthIndex(ndviValue),
        vegetation_status: this.getVegetationStatus(ndviValue),
        weather_data: {
          avg_temperature: parseFloat(temperature.toFixed(1)),
          precipitation_sum: parseFloat((Math.random() * 20).toFixed(1)),
          soil_moisture: parseFloat(soilMoisture.toFixed(3))
        },
        last_updated: new Date().toISOString(),
        data_source: 'Згенеровано на основі погодних даних'
      };
    } catch (error) {
      console.error('Помилка при генерації NDVI з погодних даних:', error);
      return this.generateDemoData(coordinates);
    }
  }

  generateComparisonFromForecast(forecastData, coordinates) {
    try {
      const historicalData = [];
      
      for (const dayData of forecastData) {
        if (dayData.isPlaceholder) continue;
        
        const date = new Date(dayData.date);
        const temperature = dayData.temperature || 15;
        
        const precipProbability = dayData.precipProbability || 0;
        const estimatedSoilMoisture = Math.min(0.8, Math.max(0.1, (dayData.humidity || 50) / 100 * 0.7 + (precipProbability / 100) * 0.3));
        
        const tempFactor = this.getTemperatureOptimality(temperature);
        
        let radiationFactor = 0.5;
        if (dayData.uvIndex) {
          const uvValue = parseInt(dayData.uvIndex.split(' ')[0]) || 5;
          radiationFactor = Math.min(1, uvValue / 11);
        }
        
        let ndviValue = (tempFactor * 0.4) + (estimatedSoilMoisture * 0.4) + (radiationFactor * 0.2);
        
        ndviValue = 0.1 + ndviValue * 0.8;
        
        ndviValue = Math.max(0.1, Math.min(0.9, ndviValue));
        
        const eviValue = ndviValue * 0.9 - 0.05;
        const saviValue = ndviValue * 0.85;
        
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const existingIndex = historicalData.findIndex(item => 
          item.date.startsWith(monthKey)
        );
        
        if (existingIndex === -1) {
          historicalData.push({
            date: `${monthKey}-01`,
            ndvi: parseFloat(ndviValue.toFixed(2)),
            evi: parseFloat(eviValue.toFixed(2)),
            savi: parseFloat(saviValue.toFixed(2))
          });
        }
      }
      
      historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const lastIndex = historicalData.length - 1;
      const currentIndices = lastIndex >= 0 ? {
        ndvi: historicalData[lastIndex].ndvi,
        evi: historicalData[lastIndex].evi,
        savi: historicalData[lastIndex].savi
      } : {
        ndvi: 0.5,
        evi: 0.45,
        savi: 0.4
      };
      
      return {
        city: coordinates.city || "Невідоме місто",
        coordinates: { lat: coordinates.lat, lon: coordinates.lon },
        indices_comparison: {
          current: currentIndices,
          historical_data: historicalData
        },
        last_updated: new Date().toISOString(),
        data_source: 'Згенеровано на основі прогнозу погоди'
      };
    } catch (error) {
      console.error('Помилка при генерації порівняння з прогнозу:', error);
      return this.generateDemoComparisonData(coordinates, coordinates.city);
    }
  }

  generateDemoData(coordinates) {
    const currentMonth = new Date().getMonth();
    const isNorthernHemisphere = coordinates.lat > 0;
    
    let baseNdvi;
    
    if (isNorthernHemisphere) {
      if (currentMonth >= 3 && currentMonth <= 8) {
        baseNdvi = 0.6 + (Math.random() * 0.1);
      } else {
        baseNdvi = 0.3 + (Math.random() * 0.1);
      }
    } else {
      if (currentMonth >= 9 || currentMonth <= 2) {
        baseNdvi = 0.6 + (Math.random() * 0.1);
      } else {
        baseNdvi = 0.3 + (Math.random() * 0.1);
      }
    }
    
    baseNdvi = Math.max(0.1, Math.min(0.9, baseNdvi));
    
    const eviValue = baseNdvi * 0.9;
    const saviValue = baseNdvi * 0.85;
    
    return {
      city: coordinates.city || "Невідоме місто",
      coordinates: { lat: coordinates.lat, lon: coordinates.lon },
      current_ndvi: parseFloat(baseNdvi.toFixed(2)),
      evi: parseFloat(eviValue.toFixed(2)),
      savi: parseFloat(saviValue.toFixed(2)),
      health_index: this.calculateHealthIndex(baseNdvi),
      vegetation_status: this.getVegetationStatus(baseNdvi),
      weather_data: {
        avg_temperature: 15 + Math.floor(Math.random() * 10),
        precipitation_sum: Math.floor(Math.random() * 50),
        soil_moisture: parseFloat((0.2 + Math.random() * 0.4).toFixed(3))
      },
      last_updated: new Date().toISOString(),
      is_demo: true,
      data_source: 'Демо-дані'
    };
  }
  
  generateDemoComparisonData(coordinates, cityName) {
    const historicalData = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const isNorthernHemisphere = coordinates.lat > 0;
      const month = date.getMonth();
      
      let ndviValue;
      
      if (isNorthernHemisphere) {
        if (month >= 3 && month <= 8) {
          ndviValue = 0.6 + Math.random() * 0.2;
        } else {
          ndviValue = 0.2 + Math.random() * 0.3;
        }
      } else {
        if (month >= 9 || month <= 2) {
          ndviValue = 0.6 + Math.random() * 0.2;
        } else {
          ndviValue = 0.2 + Math.random() * 0.3;
        }
      }
      
      ndviValue = Math.max(0.1, Math.min(0.9, ndviValue));
      
      const eviValue = ndviValue * 0.9;
      const saviValue = ndviValue * 0.85;
      
      historicalData.push({
        date: `${monthKey}-01`,
        ndvi: parseFloat(ndviValue.toFixed(2)),
        evi: parseFloat(eviValue.toFixed(2)),
        savi: parseFloat(saviValue.toFixed(2))
      });
    }
    
    const currentIndices = {
      ndvi: historicalData[historicalData.length - 1].ndvi,
      evi: historicalData[historicalData.length - 1].evi,
      savi: historicalData[historicalData.length - 1].savi
    };
    
    return {
      city: cityName || "Невідоме місто",
      coordinates: { lat: coordinates.lat, lon: coordinates.lon },
      indices_comparison: {
        current: currentIndices,
        historical_data: historicalData
      },
      last_updated: new Date().toISOString(),
      is_demo: true,
      data_source: 'Демо-дані'
    };
  }  

  async fetchSentinelHubToken(clientId, clientSecret) {
    try {
      const tokenUrl = 'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';
      
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      
      const response = await axios.post(tokenUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.status === 200 && response.data && response.data.access_token) {
        const accessToken = response.data.access_token;
        
        this.sentinelHubToken = {
          value: accessToken,
          expiresIn: response.data.expires_in,
          timestamp: Date.now()
        };
        
        console.log(`Токен Sentinel Hub успішно отриманий. Дійсний на ${response.data.expires_in} секунд.`);
        return accessToken;
      } else {
        throw new Error('Неправильний формат відповіді при отриманні токену');
      }
    } catch (error) {
      console.error('Помилка отримання токену Sentinel Hub API:', error);
      throw new Error(`Не вдалося отримати токен: ${error.message}`);
    }
  }
  
  async getSentinelHubToken() {
    try {
      const tokenExpirationBuffer = 60;
      
      if (
        this.sentinelHubToken && 
        this.sentinelHubToken.value && 
        this.sentinelHubToken.timestamp && 
        this.sentinelHubToken.expiresIn && 
        (Date.now() - this.sentinelHubToken.timestamp) / 1000 < (this.sentinelHubToken.expiresIn - tokenExpirationBuffer)
      ) {
        return this.sentinelHubToken.value;
      }
      
      const clientId = SENTINEL_CLIENT_ID;
      const clientSecret = SENTINEL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Sentinel Hub Client ID та Client Secret не налаштовані');
      }
      
      return await this.fetchSentinelHubToken(clientId, clientSecret);
    } catch (error) {
      console.error('Помилка отримання токена Sentinel Hub:', error);
      throw error;
    }
  }
  
  async fetchSentinelHubData(lat, lon) {
    try {
      const accessToken = await this.getSentinelHubToken();
      
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      console.log(`Запит до Sentinel Hub API для періоду: ${startDateStr} - ${endDate}`);
      
      const response = await axios.post(SENTINEL_HUB_API_URL, {
        input: {
          bounds: {
            properties: {
              crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
            },
            bbox: [lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05]
          },
          data: [{
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: startDateStr + "T00:00:00Z",
                to: endDate + "T23:59:59Z"
              },
              mosaickingOrder: "leastCC"
            }
          }]
        },
        evalscript: `
          //VERSION=3
          function setup() {
            return {
              input: ["B04", "B08", "B11", "dataMask"],
              output: { 
                bands: 4,
                sampleType: "FLOAT32"
              }
            };
          }

          function evaluatePixel(sample) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            let evi = 2.5 * ((sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1));
            let savi = ((sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.5)) * 1.5;
            
            return [ndvi, evi, savi, sample.dataMask];
          }
        `,
        output: {
          width: 512,
          height: 512
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const ndviData = this.processRealSentinelData(response.data, lat, lon);
      return ndviData;
    } catch (error) {
      console.error('Помилка отримання даних з Sentinel Hub API:', error);
      throw error;
    }
  }
  
  async fetchSentinelHistoricalData(lat, lon) {
    try {
      const accessToken = await this.getSentinelHubToken();
      
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 12);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      console.log(`Запит історичних даних до Sentinel Hub API для періоду: ${startDateStr} - ${endDate}`);
      
      const monthlyRequests = [];

      const months = [];
    let currentMonth = new Date(startDate);

    while (currentMonth <= today) {
      months.push(new Date(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
      
    for (const month of months) {
      const monthStart = new Date(month);
      monthStart.setDate(1);
      
      const monthEnd = new Date(month);
      monthEnd.setMonth(month.getMonth() + 1);
      monthEnd.setDate(0);
      
      // Перевіряємо, щоб кінцева дата не була в майбутньому
      const actualEndDate = (monthEnd > today) ? today : monthEnd;
      
      // Перевіряємо, що часовий діапазон адекватний
      if (monthStart >= actualEndDate) continue;
        
        const request = axios.post(SENTINEL_HUB_API_URL, {
          input: {
            bounds: {
              properties: {
                crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
              },
              bbox: [lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05]
            },
            data: [{
              type: "sentinel-2-l2a",
              dataFilter: {
                timeRange: {
                  from: monthStart.toISOString().split('T')[0] + "T00:00:00Z",
                  to: monthEnd.toISOString().split('T')[0] + "T23:59:59Z"
                },
                mosaickingOrder: "leastCC"
              }
            }]
          },
          evalscript: `
            //VERSION=3
            function setup() {
              return {
                input: ["B04", "B08", "B11", "dataMask"],
                output: { 
                  bands: 4,
                  sampleType: "FLOAT32"
                }
              };
            }

            function evaluatePixel(sample) {
              let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
              let evi = 2.5 * ((sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B02 + 1));
              let savi = ((sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.5)) * 1.5;
              
              return [ndvi, evi, savi, sample.dataMask];
            }
          `,
          output: {
            width: 512,
            height: 512
          }
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        monthlyRequests.push({
          request,
          date: monthStart.toISOString().split('T')[0]
        });
      }
      
      const results = await Promise.all(monthlyRequests.map(item => item.request.catch(error => {
        console.log(`Помилка запиту за ${item.date}: ${error.message}`);
        return null;
      })));
      
      const historicalData = [];
      
      for (let i = 0; i < results.length; i++) {
        if (results[i] && results[i].data) {
          const monthlyData = this.processRealSentinelData(results[i].data, lat, lon);
          
          historicalData.push({
            date: monthlyRequests[i].date,
            ndvi: monthlyData.current_ndvi,
            evi: monthlyData.evi,
            savi: monthlyData.savi
          });
        }
      }
      
      const lastIndex = historicalData.length - 1;
      const currentIndices = lastIndex >= 0 ? {
        ndvi: historicalData[lastIndex].ndvi,
        evi: historicalData[lastIndex].evi,
        savi: historicalData[lastIndex].savi
      } : null;
      
      if (!currentIndices) {
        throw new Error('Не вдалося отримати дані для жодного місяця');
      }
      
      return {
        city: "Невідоме місто",
        coordinates: { lat, lon },
        indices_comparison: {
          current: currentIndices,
          historical_data: historicalData
        },
        last_updated: new Date().toISOString(),
        data_source: 'Sentinel Hub API (реальні дані)'
      };
    } catch (error) {
      console.error('Помилка отримання історичних даних з Sentinel Hub API:', error);
      throw error;
    }
  }

  processRealSentinelData(data, lat, lon) {
    try {
      let ndviSum = 0;
      let eviSum = 0;
      let saviSum = 0;
      let validPixels = 0;
      
      if (data && data.data) {
        const pixels = data.data;
        const width = data.width || 512;
        const height = data.height || 512;
        
        for (let i = 0; i < pixels.length; i += 4) {
          const ndvi = pixels[i];
          const evi = pixels[i + 1];
          const savi = pixels[i + 2];
          const mask = pixels[i + 3];
          
          if (mask > 0) {
            ndviSum += ndvi;
            eviSum += evi;
            saviSum += savi;
            validPixels++;
          }
        }
      }
      
      const avgNdvi = validPixels > 0 ? ndviSum / validPixels : 0.5;
      const avgEvi = validPixels > 0 ? eviSum / validPixels : 0.45;
      const avgSavi = validPixels > 0 ? saviSum / validPixels : 0.4;
      
      return {
        city: "Невідоме місто",
        coordinates: { lat, lon },
        current_ndvi: parseFloat(avgNdvi.toFixed(2)),
        evi: parseFloat(avgEvi.toFixed(2)),
        savi: parseFloat(saviValue.toFixed(2)),
        health_index: this.calculateHealthIndex(avgNdvi),
        vegetation_status: this.getVegetationStatus(avgNdvi),
        last_updated: new Date().toISOString(),
        data_source: 'Sentinel Hub API (реальні дані)'
      };
    } catch (error) {
      console.error('Помилка обробки даних з Sentinel Hub API:', error);
      throw error;
    }
  }

async fetchNASAPowerData(lat, lon) {
  try {
    console.log(`Запит даних NASA POWER API для координат [${lat}, ${lon}]`);
    
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const params = {
      parameters: 'T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M',
      community: 'AG',
      longitude: lon,
      latitude: lat,
      start: startDateStr,
      end: endDate,
      format: 'JSON'
    };
    
    const url = new URL(NASA_POWER_API_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const response = await axios.get(url.toString());
    
    if (!response.data || !response.data.properties || !response.data.properties.parameter) {
      throw new Error('Некоректний формат відповіді від NASA POWER API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Помилка отримання даних з NASA POWER API:', error);
    throw error;
  }
}

// Виправлення для NASA POWER API
async fetchHistoricalNASAData(lat, lon) {
  try {
    console.log(`Запит історичних даних NASA POWER для координат [${lat}, ${lon}]`);
    
    // Поточна дата
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    // NASA API може мати обмеження на історичні дані
    // Використовуємо 1 рік, але перевіряємо, чи це не майбутнє
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Перевірка на майбутню дату
    if (new Date(endDate) > today) {
      endDate = today.toISOString().split('T')[0];
    }
    
    // Переконуємося, що часовий діапазон має сенс (startDate < endDate)
    if (new Date(startDateStr) >= new Date(endDate)) {
      throw new Error('Некоректний часовий діапазон для запиту NASA POWER API');
    }
    
    const params = {
      parameters: 'T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M',
      community: 'AG', 
      longitude: lon,
      latitude: lat,
      start: startDateStr,
      end: endDate,
      format: 'JSON',
      temporal: 'MONTHLY'
    };
    
    const url = new URL(NASA_POWER_API_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    console.log("NASA POWER URL:", url.toString()); // Додайте логування для дебагу
    
    const response = await axios.get(url.toString());
    
    if (!response.data || !response.data.properties || !response.data.properties.parameter) {
      throw new Error('Некоректний формат відповіді від NASA POWER API для історичних даних');
    }
    
    return response.data;
  } catch (error) {
    console.error('Помилка отримання історичних даних з NASA POWER API:', error);
    // Додаємо більше інформації про помилку для дебагу
    if (error.response) {
      console.error('Статус помилки:', error.response.status);
      console.error('Дані помилки:', error.response.data);
    }
    throw error;
  }
}

processNASAData(nasaData, coordinates) {
  try {
    const parameters = nasaData.properties.parameter;
    
    const temperatures = Object.values(parameters.T2M || {});
    const precipitations = Object.values(parameters.PRECTOTCORR || {});
    const solarRadiation = Object.values(parameters.ALLSKY_SFC_SW_DWN || {});
    const humidity = Object.values(parameters.RH2M || {});
    
    const avgTemperature = this.calculateAverage(temperatures);
    const totalPrecipitation = this.calculateSum(precipitations);
    const avgSolarRadiation = this.calculateAverage(solarRadiation);
    const avgHumidity = this.calculateAverage(humidity);
    
    const estimatedSoilMoisture = this.estimateSoilMoisture(totalPrecipitation, avgHumidity);
    
    const ndviValue = this.estimateNDVIFromMeteorological(
      avgTemperature, 
      estimatedSoilMoisture, 
      avgSolarRadiation
    );
    
    const eviValue = ndviValue * 0.9 - 0.05; 
    const saviValue = ndviValue * 0.85; 
    
    return {
      city: coordinates.city || "Невідоме місто",
      coordinates: { lat: coordinates.lat, lon: coordinates.lon },
      current_ndvi: parseFloat(ndviValue.toFixed(2)),
      evi: parseFloat(eviValue.toFixed(2)),
      savi: parseFloat(saviValue.toFixed(2)),
      health_index: this.calculateHealthIndex(ndviValue),
      vegetation_status: this.getVegetationStatus(ndviValue),
      weather_data: {
        avg_temperature: parseFloat(avgTemperature.toFixed(1)),
        precipitation_sum: parseFloat(totalPrecipitation.toFixed(1)),
        soil_moisture: parseFloat(estimatedSoilMoisture.toFixed(3))
      },
      last_updated: new Date().toISOString(),
      data_source: 'NASA POWER API'
    };
  } catch (error) {
    console.error('Помилка обробки даних NASA POWER API:', error);
    throw error;
  }
}

processHistoricalNASAData(nasaData, coordinates) {
  try {
    const parameters = nasaData.properties.parameter;
    const dates = Object.keys(parameters.T2M || {}).sort();
    
    const historicalData = [];
    
    for (const date of dates) {
      const temperature = parameters.T2M[date] || 0;
      const precipitation = parameters.PRECTOTCORR[date] || 0;
      const solarRadiation = parameters.ALLSKY_SFC_SW_DWN[date] || 0;
      const humidity = parameters.RH2M[date] || 0;
      
      const soilMoisture = this.estimateSoilMoisture(precipitation, humidity);
      
      const ndviValue = this.estimateNDVIFromMeteorological(
        temperature, 
        soilMoisture, 
        solarRadiation
      );
      
      const eviValue = ndviValue * 0.9 - 0.05;
      const saviValue = ndviValue * 0.85;
      
      const [year, month] = date.split('-');
      const formattedDate = `${year}-${month}-01`;
      
      historicalData.push({
        date: formattedDate,
        ndvi: parseFloat(ndviValue.toFixed(2)),
        evi: parseFloat(eviValue.toFixed(2)),
        savi: parseFloat(saviValue.toFixed(2))
      });
    }
    
    historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const lastIndex = historicalData.length - 1;
    const currentIndices = lastIndex >= 0 ? {
      ndvi: historicalData[lastIndex].ndvi,
      evi: historicalData[lastIndex].evi,
      savi: historicalData[lastIndex].savi
    } : {
      ndvi: 0.5,
      evi: 0.45,
      savi: 0.4
    };
    
    return {
      city: coordinates.city || "Невідоме місто",
      coordinates: { lat: coordinates.lat, lon: coordinates.lon },
      indices_comparison: {
        current: currentIndices,
        historical_data: historicalData
      },
      last_updated: new Date().toISOString(),
      data_source: 'NASA POWER API'
    };
  } catch (error) {
    console.error('Помилка обробки історичних даних NASA POWER API:', error);
    throw error;
  }
}

estimateNDVIFromMeteorological(temperature, soilMoisture, solarRadiation) {
  try {
    const tempFactor = this.getTemperatureOptimality(temperature);
    
    const radiationFactor = Math.min(1, solarRadiation / 30);
    
    let ndviValue = (tempFactor * 0.4) + (soilMoisture * 0.4) + (radiationFactor * 0.2);
    
    ndviValue = 0.1 + ndviValue * 0.8;
    
    return Math.max(0.1, Math.min(0.9, ndviValue));
  } catch (error) {
    console.error('Помилка оцінки NDVI з метеоданих:', error);
    return 0.5;
  }
}

getTemperatureOptimality(temperature) {
  try {
    if (temperature < 5) {
      return 0.1 + (temperature / 5) * 0.2; // від 0.1 до 0.3
    } else if (temperature >= 5 && temperature < 15) {
      return 0.3 + ((temperature - 5) / 10) * 0.4; // від 0.3 до 0.7
    } else if (temperature >= 15 && temperature <= 25) {
      return 0.7 + ((temperature - 15) / 10) * 0.3; // від 0.7 до 1.0
    } else if (temperature > 25 && temperature <= 35) {
      return 1.0 - ((temperature - 25) / 10) * 0.7; // від 1.0 до 0.3
    } else {
      return 0.3 - Math.min(0.2, ((temperature - 35) / 10) * 0.2); // нижче 0.3
    }
  } catch (error) {
    console.error('Помилка розрахунку оптимальності температури:', error);
    return 0.5;
  }
}

estimateSoilMoisture(precipitation, humidity) {
  try {
    const normalizedPrecipitation = Math.min(1, precipitation / 100);
    
    const normalizedHumidity = humidity / 100;
    
    const soilMoisture = (normalizedPrecipitation * 0.7) + (normalizedHumidity * 0.3);
    
    return Math.max(0.1, Math.min(0.9, soilMoisture));
  } catch (error) {
    console.error('Помилка оцінки вологості ґрунту:', error);
    return 0.5; 
  }
}

calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  
  const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
  if (validValues.length === 0) return 0;
  
  const sum = validValues.reduce((total, value) => total + value, 0);
  return sum / validValues.length;
}

calculateSum(values) {
  if (!values || values.length === 0) return 0;
  
  const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
  if (validValues.length === 0) return 0;
  
  return validValues.reduce((total, value) => total + value, 0);
}

calculateHealthIndex(ndvi) {
  if (ndvi >= 0.7) return 'excellent';
  if (ndvi >= 0.5) return 'good';
  if (ndvi >= 0.3) return 'moderate';
  if (ndvi >= 0.1) return 'poor';
  return 'critical';
}

getVegetationStatus(ndvi) {
  if (ndvi >= 0.7) return 'Активна вегетація';
  if (ndvi >= 0.5) return 'Помірна вегетація';
  if (ndvi >= 0.3) return 'Низька вегетація';
  if (ndvi >= 0.1) return 'Мінімальна вегетація';
  return 'Відсутність вегетації';
}

initCityDataCache() {
  const cities = ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Рівне'];
  
  cities.forEach(city => {
    let lat, lon;
    switch(city) {
      case 'Київ': lat = 50.4501; lon = 30.5234; break;
      case 'Харків': lat = 49.9935; lon = 36.2304; break;
      case 'Одеса': lat = 46.4825; lon = 30.7233; break;
      case 'Дніпро': lat = 48.4647; lon = 35.0462; break;
      case 'Львів': lat = 49.8397; lon = 24.0297; break;
      case 'Рівне': lat = 50.6199; lon = 26.2516; break;
      default: lat = 50.4501; lon = 30.5234; break;
    }
    
    const ndviData = this.generateDemoData({ city, lat, lon });
    this.saveToCache(`city_${city}`, ndviData);
    
    const comparisonData = this.generateDemoComparisonData({ lat, lon }, city);
    this.saveToCache(`comparison_${city}`, comparisonData);
  });
}

getFromCache(key) {
  const cacheItem = this.vegetationCache[key];
  
  if (cacheItem && (Date.now() - cacheItem.timestamp) < this.cacheTimeout) {
    console.log(`Використання кешованих даних для ${key}`);
    return cacheItem.data;
  }
  
  return null;
}

saveToCache(key, data) {
  this.vegetationCache[key] = {
    data,
    timestamp: Date.now()
  };
  console.log(`Дані кешовано для ${key}`);
}
}
module.exports = VegetationService;