const axios = require('axios');
const translate = require('translate-google');

const CityTranslation = require('../models/cityTranslation');

require('dotenv').config();

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

class WeatherServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'WeatherServiceError';
    this.type = type;
  }
}

const weatherConditionMap = {
  0: 'Ясно',
  1: 'Переважно ясно',
  2: 'Частково хмарно',
  3: 'Хмарно',
  45: 'Туман',
  48: 'Іней',
  51: 'Слабка мряка',
  53: 'Помірна мряка',
  55: 'Сильна мряка',
  56: 'Слабка морозна мряка',
  57: 'Сильна морозна мряка',
  61: 'Слабкий дощ',
  63: 'Помірний дощ',
  65: 'Сильний дощ',
  66: 'Слабкий крижаний дощ',
  67: 'Сильний крижаний дощ',
  71: 'Слабкий сніг',
  73: 'Помірний сніг',
  75: 'Сильний сніг',
  77: 'Снігова крупа',
  80: 'Слабкі зливи',
  81: 'Помірні зливи',
  82: 'Сильні зливи',
  85: 'Слабкий сніг',
  86: 'Сильний сніг',
  95: 'Гроза',
  96: 'Гроза зі слабким градом',
  99: 'Гроза з сильним градом',
};

const weatherService = {
  async translateCityName(cityName) {
    try {
      if (!/[а-яА-ЯіІїЇєЄґҐ]/.test(cityName)) {
        return cityName;
      }
      
      const normalizedCityName = cityName.trim().toLowerCase();
      
      const existingTranslation = await CityTranslation.findOne({ 
        originalName: normalizedCityName 
      });
      
      if (existingTranslation) {
        return existingTranslation.translatedName;
      }
      
      const translationResult = await translate(cityName, { from: 'uk', to: 'en' });
      
      const translatedText = typeof translationResult === 'object' 
        ? translationResult.text 
        : translationResult;
      
      await CityTranslation.create({
        originalName: normalizedCityName,
        translatedName: translatedText
      });
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw new WeatherServiceError('Не вдалося перекласти назву міста', 'TRANSLATION_ERROR');
    }
  },

  async getCoordinates(city) {
    try {
      const translatedCity = await this.translateCityName(city);
      
      const response = await axios.get(GEO_URL, {
        params: {
          name: translatedCity,
          count: 1,
          language: 'uk'
        }
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        throw new WeatherServiceError(`Місто "${city}" не знайдено. Перевірте правильність назви.`, 'CITY_NOT_FOUND');
      }
      
      const location = response.data.results[0];
      
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        country: location.country
      };
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }
      console.error('Geocoding error:', error);
      throw new WeatherServiceError('Не вдалося знайти координати міста', 'GEOCODING_ERROR');
    }
  },

  async getCurrentWeather(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      const location = await this.getCoordinates(city);
      
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          timezone: 'auto'
        }
      });
      
      const { current } = response.data;
      
      return {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        description: weatherConditionMap[current.weather_code] || 'Невідомо',
        windSpeed: current.wind_speed_10m,
        city: location.name,
        country: location.country
      };
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }

      console.error('Current weather error:', error);
      throw new WeatherServiceError('Помилка отримання погоди', 'WEATHER_ERROR');
    }
  },
  
  async getForecast(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      const location = await this.getCoordinates(city);
      
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,wind_speed_10m_max',
          timezone: 'auto',
          forecast_days: 7
        }
      });
      
      const { daily } = response.data;
      
      const forecastData = daily.time.map((date, index) => ({
        date: new Date(date),
        temperature: daily.temperature_2m_mean[index],
        minTemperature: daily.temperature_2m_min[index],
        maxTemperature: daily.temperature_2m_max[index],
        humidity: daily.relative_humidity_2m_mean[index],
        description: weatherConditionMap[daily.weather_code[index]] || 'Невідомо',
        windSpeed: daily.wind_speed_10m_max[index],
        condition: daily.weather_code[index]
      }));
      
      return forecastData;
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }

      console.error('Forecast error:', error);
      throw new WeatherServiceError('Помилка отримання прогнозу погоди', 'FORECAST_ERROR');
    }
  },
  
  async getHourlyForecast(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
  
      const location = await this.getCoordinates(city);
      
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          timezone: 'auto',
          forecast_days: 7
        }
      });
      
      const { hourly } = response.data;
      const hourlyData = [];
      
      for (let i = 0; i < hourly.time.length; i++) {
        const hourTime = new Date(hourly.time[i]);
        
        // Вибираємо лише кожні 3 години
        if (hourTime.getHours() % 3 === 0) {
          hourlyData.push({
            time: hourTime,
            date: new Date(hourTime.toDateString()),
            temperature: hourly.temperature_2m[i],
            description: weatherConditionMap[hourly.weather_code[i]] || 'Невідомо',
            windSpeed: hourly.wind_speed_10m[i],
            humidity: hourly.relative_humidity_2m[i],
            icon: this.getWeatherIcon(hourly.weather_code[i])
          });
        }
      }
  
      hourlyData.sort((a, b) => a.time - b.time);
      
      return hourlyData;
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }
  
      console.error('Hourly forecast error:', error);
      throw new WeatherServiceError('Помилка отримання погодинного прогнозу', 'HOURLY_FORECAST_ERROR');
    }
  },

  async getLocationByCoordinates(latitude, longitude) {
    try {
      const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
      const response = await axios.get(NOMINATIM_URL, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          'accept-language': 'uk',
          zoom: 18, 
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'WeatherApp/1.0'
        }
      });
      
      if (!response.data || !response.data.address) {
        throw new WeatherServiceError('Місто не знайдено за вказаними координатами', 'LOCATION_NOT_FOUND');
      }
      
      const location = response.data.address;
      
      let cityName = location.city || location.town || location.village || 
                    location.hamlet || location.suburb || location.county || 
                    location.state;
      
      
      if (cityName) {
        cityName = cityName.replace(/місто|село|громада|міська|селищна|сільська|район|область/gi, '').trim();
        
        const parts = cityName.split(' ');
        if (parts.length > 1 && parts[0].length > 2) {
          cityName = parts[0];
        }
      } else {
        cityName = "Київ"; 
      }
      
      return cityName;
    } catch (error) {
      console.error('Помилка визначення міста за координатами:', error);
      return "Київ"; 
    }
  },
  
  getWeatherIcon(code) {
    // Тут можна додати логіку для вибору іконок на основі коду погоди
    // Це заглушка, яку можна розширити
    if (code === 0 || code === 1) return 'sunny';
    if (code >= 2 && code <= 3) return 'partly_cloudy';
    if (code >= 45 && code <= 48) return 'foggy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    
    return 'cloudy';
  }
};

module.exports = weatherService;