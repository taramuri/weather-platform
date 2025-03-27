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
      // Якщо немає кирилиці, не перекладаємо
      if (!/[а-яА-ЯіІїЇєЄґҐ]/.test(cityName)) {
        return cityName;
      }
      
      // Нормалізуємо назву міста для пошуку в БД
      const normalizedCityName = cityName.trim().toLowerCase();
      
      // Перевіряємо, чи є переклад у базі даних
      const existingTranslation = await CityTranslation.findOne({ 
        originalName: normalizedCityName 
      });
      
      if (existingTranslation) {
        return existingTranslation.translatedName;
      }
      
      // Якщо перекладу немає в БД, використовуємо API перекладу
      const translationResult = await translate(cityName, { from: 'uk', to: 'en' });
      
      // Витягуємо лише текст перекладу (у випадку, якщо результат - об'єкт)
      const translatedText = typeof translationResult === 'object' 
        ? translationResult.text 
        : translationResult;
      
      // Зберігаємо новий переклад у базі даних для майбутніх запитів
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
      // Перевіряємо, чи передано назву міста
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      // Перекладаємо назву міста перед відправкою запиту
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
      // Детальна обробка різних типів помилок
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
        // Запит було надіслано, але відповіді не отримано
        throw new WeatherServiceError('Немає відповіді від сервера. Перевірте підключення до інтернету.', 'NO_RESPONSE');
      } else {
        // Щось сталося при налаштуванні запиту
        throw new WeatherServiceError('Помилка налаштування запиту', 'REQUEST_SETUP_ERROR');
      }
    }
  },
  
  async getForecast(city) {
    try {
      // Перевіряємо, чи передано назву міста
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }

      // Перекладаємо назву міста перед відправкою запиту
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
      
      // Обробляємо прогноз
      const forecastData = forecast.forecastday.map(day => ({
        date: new Date(day.date),
        temperature: day.day.avgtemp_c,
        minTemperature: day.day.mintemp_c,  // Додано мінімальну температуру
        maxTemperature: day.day.maxtemp_c,  // Додано максимальну температуру
        humidity: day.day.avghumidity,
        description: day.day.condition.text,
        windSpeed: day.day.maxwind_kph,
        condition: day.day.condition.code // Додаємо код умови для зручної класифікації
      }));
      
      return forecastData;
    } catch (error) {
      // Повторюємо логіку обробки помилок як у getCurrentWeather
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
      // Перевіряємо, чи передано назву міста
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
  
      // Перекладаємо назву міста перед відправкою запиту
      const translatedCity = await this.translateCityName(city);
      
      const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
        params: {
          key: API_KEY,
          q: translatedCity,
          days: 2, // Отримуємо прогноз на 2 дні для більшої кількості годин
          lang: 'uk'
        }
      });
      
      const hourlyData = [];
      
      // Проходимо по кожному дню
      response.data.forecast.forecastday.forEach(day => {
        // Додаємо години з кожного дня
        day.hour.forEach(hourForecast => {
          hourlyData.push({
            time: new Date(hourForecast.time),
            temperature: hourForecast.temp_c,
            description: hourForecast.condition.text,
            windSpeed: hourForecast.wind_kph,
            humidity: hourForecast.humidity,
            icon: hourForecast.condition.icon
          });
        });
      });
  
      // Фільтруємо лише години, кратні 3 (0, 3, 6, 9, 12, 15, 18, 21)
      const filteredHourlyData = hourlyData.filter(hour => 
        hour.time.getHours() % 3 === 0 && hour.time >= new Date()
      ).slice(0, 8); // Обмежуємо 8 найближчими тригодинними інтервалами
      
      return filteredHourlyData;
    } catch (error) {
      // Повторюємо логіку обробки помилок як у інших методах
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
  }
};

module.exports = weatherService;