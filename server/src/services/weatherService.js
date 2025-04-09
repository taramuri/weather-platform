const axios = require('axios');
const translate = require('translate-google');

const CityTranslation = require('../models/cityTranslation');

require('dotenv').config();

const API_KEY = process.env.WEATHERAPI_KEY || '3b76d28c262e4fb4ad8184330251503';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

class WeatherServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'WeatherServiceError';
    this.type = type;
  }
}

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

  async getCurrentWeather(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      const translatedCity = await this.translateCityName(city);
      
      const response = await axios.get(`${WEATHER_API_BASE_URL}/current.json`, {
        params: {
          key: API_KEY,
          q: translatedCity,
          lang: 'uk'
        }
      });
      
      const { current, location } = response.data;
      return {
        temperature: current.temp_c,
        humidity: current.humidity,
        description: current.condition.text,
        windSpeed: current.wind_kph,
        city: location.name,
        country: location.country
      };
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }

      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new WeatherServiceError('Невірний запит. Перевірте назву міста.', 'INVALID_REQUEST');
          case 401:
            throw new WeatherServiceError('Помилка авторизації. Перевірте API ключ.', 'AUTHORIZATION_ERROR');
          case 403:
            throw new WeatherServiceError('Доступ заборонено. Перевірте права доступу.', 'ACCESS_DENIED');
          case 404:
            throw new WeatherServiceError(`Місто "${city}" не знайдено. Перевірте правильність назви.`, 'CITY_NOT_FOUND');
          case 429:
            throw new WeatherServiceError('Перевищено ліміт запитів. Спробуйте пізніше.', 'RATE_LIMIT_EXCEEDED');
          case 500:
            throw new WeatherServiceError('Внутрішня помилка сервера. Спробуйте пізніше.', 'SERVER_ERROR');
          default:
            throw new WeatherServiceError('Невідома помилка при отриманні погоди', 'UNKNOWN_ERROR');
        }
      } else if (error.request) {
        throw new WeatherServiceError('Немає відповіді від сервера. Перевірте підключення до інтернету.', 'NO_RESPONSE');
      } else {
        throw new WeatherServiceError('Помилка налаштування запиту', 'REQUEST_SETUP_ERROR');
      }
    }
  },
  
  async getForecast(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      const translatedCity = await this.translateCityName(city);
      
      const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
        params: {
          key: API_KEY,
          q: translatedCity,
          days: 7,
          lang: 'uk'
        }
      });
      
      const { forecast } = response.data;
      
      const forecastData = forecast.forecastday.map(day => ({
        date: new Date(day.date),
        temperature: day.day.avgtemp_c,
        minTemperature: day.day.mintemp_c,  
        maxTemperature: day.day.maxtemp_c,  
        humidity: day.day.avghumidity,
        description: day.day.condition.text,
        windSpeed: day.day.maxwind_kph,
        condition: day.day.condition.code 
      }));
      
      return forecastData;
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }

      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new WeatherServiceError('Невірний запит прогнозу. Перевірте назву міста.', 'INVALID_REQUEST');
          case 404:
            throw new WeatherServiceError(`Місто "${city}" не знайдено. Перевірте правильність назви.`, 'CITY_NOT_FOUND');
          case 429:
            throw new WeatherServiceError('Перевищено ліміт запитів. Спробуйте пізніше.', 'RATE_LIMIT_EXCEEDED');
          case 500:
            throw new WeatherServiceError('Внутрішня помилка сервера. Спробуйте пізніше.', 'SERVER_ERROR');
          default:
            throw new WeatherServiceError('Невідома помилка при отриманні прогнозу', 'UNKNOWN_ERROR');
        }
      } else if (error.request) {
        throw new WeatherServiceError('Немає відповіді від сервера. Перевірте підключення до інтернету.', 'NO_RESPONSE');
      } else {
        throw new WeatherServiceError('Помилка налаштування запиту прогнозу', 'REQUEST_SETUP_ERROR');
      }
    }
  },
  
  async getHourlyForecast(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
  
      const translatedCity = await this.translateCityName(city);
      
      const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
        params: {
          key: API_KEY,
          q: translatedCity,
          days: 7, 
          lang: 'uk'
        }
      });
      
      const hourlyData = [];
      
      response.data.forecast.forecastday.forEach(day => {
        const forecastDate = new Date(day.date);
        
        day.hour.filter(hourForecast => {
          const hourTime = new Date(hourForecast.time);
          return hourTime.getHours() % 3 === 0;
        }).forEach(hourForecast => {
          hourlyData.push({
            time: new Date(hourForecast.time),
            date: forecastDate,
            temperature: hourForecast.temp_c,
            description: hourForecast.condition.text,
            windSpeed: hourForecast.wind_kph,
            humidity: hourForecast.humidity,
            icon: hourForecast.condition.icon
          });
        });
      });
  
      hourlyData.sort((a, b) => a.time - b.time);
      
      return hourlyData;
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }
  
      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new WeatherServiceError('Невірний запит погодинного прогнозу', 'INVALID_REQUEST');
          case 404:
            throw new WeatherServiceError(`Місто не знайдено`, 'CITY_NOT_FOUND');
          case 429:
            throw new WeatherServiceError('Перевищено ліміт запитів', 'RATE_LIMIT_EXCEEDED');
          case 500:
            throw new WeatherServiceError('Внутрішня помилка сервера', 'SERVER_ERROR');
          default:
            throw new WeatherServiceError('Невідома помилка при отриманні погодинного прогнозу', 'UNKNOWN_ERROR');
        }
      } else if (error.request) {
        throw new WeatherServiceError('Немає відповіді від сервера', 'NO_RESPONSE');
      } else {
        throw new WeatherServiceError('Помилка налаштування запиту', 'REQUEST_SETUP_ERROR');
      }
    }
  },

async getLocationByCoordinates(latitude, longitude) {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/search.json`, {
      params: {
        key: API_KEY,
        q: `${latitude},${longitude}`
      }
    });

    return response.data[0].name;
  } catch (error) {
    console.error('Помилка визначення міста за координатами:', error);
    throw new WeatherServiceError('Не вдалося визначити місто', 'GEOLOCATION_ERROR');
  }
}
};

module.exports = weatherService;