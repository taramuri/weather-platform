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
          daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
          timezone: 'auto'
        }
      });
      
      const { current, daily } = response.data;
            
      const todayData = {
        maxTemperature: daily.temperature_2m_max[0],
        minTemperature: daily.temperature_2m_min[0]
      };
      
      // Створюємо об'єкти Date для сходу і заходу сонця
      if (daily.sunrise && daily.sunrise[0]) {
        todayData.sunrise = new Date(daily.sunrise[0]);
      }
      
      if (daily.sunset && daily.sunset[0]) {
        todayData.sunset = new Date(daily.sunset[0]);
      }
      
      const weatherData = {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        description: weatherConditionMap[current.weather_code] || 'Невідомо',
        windSpeed: current.wind_speed_10m,
        city: location.name,
        country: location.country,
        maxTemperature: todayData.maxTemperature,
        minTemperature: todayData.minTemperature
      };
      
      if (todayData.sunrise) weatherData.sunrise = todayData.sunrise;
      if (todayData.sunset) weatherData.sunset = todayData.sunset;
           
      return weatherData;
    } catch (error) {
      if (error.name === 'WeatherServiceError') {
        throw error;
      }
  
      console.error('Current weather error:', error);
      throw new WeatherServiceError('Помилка отримання погоди', 'WEATHER_ERROR');
    }
  },

  async getAirQuality(city) {
    try {
      if (!city) {
        throw new WeatherServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
  
      const location = await this.getCoordinates(city);
      
      const response = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
          timezone: 'auto'
        }
      });
      
      const { current } = response.data;
      
      const europeanAQI = current.european_aqi;
      
      let quality, description, color;
      
      if (europeanAQI <= 20) {
        quality = 'Відмінно';
        description = 'Якість повітря вважається відмінною. Забруднення повітря не становить ризику для здоров\'я.';
        color = '#50F0E6'; // Блакитний
      } else if (europeanAQI <= 40) {
        quality = 'Добре';
        description = 'Якість повітря вважається задовільною. Забруднення повітря становить незначний ризик або жодного ризику взагалі.';
        color = '#50CCAA'; // Зелений
      } else if (europeanAQI <= 60) {
        quality = 'Помірно';
        description = 'Якість повітря прийнятна, але деякі забруднювачі можуть становити незначну загрозу для дуже невеликої кількості людей, які особливо чутливі до забруднення повітря.';
        color = '#F0E641'; // Жовтий
      } else if (europeanAQI <= 80) {
        quality = 'Посередньо';
        description = 'Члени чутливих груп можуть відчувати проблеми зі здоров\'ям. Широкий загал ще не буде відчувати впливу.';
        color = '#FF5050'; // Оранжевий
      } else if (europeanAQI <= 100) {
        quality = 'Погано';
        description = 'Кожен може почати відчувати проблеми зі здоров\'ям. Члени чутливих груп можуть відчувати більш серйозні проблеми зі здоров\'ям.';
        color = '#960032'; // Червоний
      } else {
        quality = 'Дуже погано';
        description = 'Тривожний рівень для всього населення. Серйозний ризик для здоров\'я, рекомендується вжити запобіжних заходів.';
        color = '#7D2181'; // Фіолетовий
      }
      
      return {
        index: europeanAQI,
        quality,
        description,
        color,
        details: {
          pm10: current.pm10,
          pm2_5: current.pm2_5,
          carbon_monoxide: current.carbon_monoxide,
          nitrogen_dioxide: current.nitrogen_dioxide,
          sulphur_dioxide: current.sulphur_dioxide,
          ozone: current.ozone
        }
      };
    } catch (error) {
      console.error('Air quality error:', error.response || error);
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
      
      // Оновлений запит з додатковими параметрами
      const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability,precipitation,cloudcover,uv_index',
          timezone: 'auto',
          forecast_days: 7
        }
      });
      
      const { hourly } = response.data;
      const hourlyData = [];
      
      for (let i = 0; i < hourly.time.length; i++) {
        const hourTime = new Date(hourly.time[i]);
        
        const windDirection = this.getWindDirectionText(hourly.wind_direction_10m[i]);
        
        const uvIndexValue = hourly.uv_index ? Math.round(hourly.uv_index[i]) : 1;
        const uvIndexFormatted = `${uvIndexValue} з 11`;
        
        hourlyData.push({
          time: hourTime,
          date: new Date(hourTime.toDateString()),
          temperature: hourly.temperature_2m[i],
          description: weatherConditionMap[hourly.weather_code[i]] || 'Невідомо',
          windSpeed: hourly.wind_speed_10m[i],
          windDirection: windDirection,
          humidity: hourly.relative_humidity_2m[i],
          icon: this.getWeatherIcon(hourly.weather_code[i]),
          precipProbability: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
          rainAmount: hourly.precipitation ? hourly.precipitation[i] : 0,
          cloudiness: hourly.cloudcover ? hourly.cloudcover[i] : 95,
          uvIndex: uvIndexFormatted
        });
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
  
  getWindDirectionText(degrees) {
    if (degrees === null || degrees === undefined) return 'Невідомо';
    
    // Таблиця напрямків вітру (8 основних напрямків)
    const directions = [
      { min: 337.5, max: 22.5, text: 'Пн' },    // 0/360 градусів - північ
      { min: 22.5, max: 67.5, text: 'Пн-Сх' },  // 45 градусів - північний схід
      { min: 67.5, max: 112.5, text: 'Сх' },    // 90 градусів - схід
      { min: 112.5, max: 157.5, text: 'Пд-Сх' },// 135 градусів - південний схід
      { min: 157.5, max: 202.5, text: 'Пд' },   // 180 градусів - південь
      { min: 202.5, max: 247.5, text: 'Пд-Зх' },// 225 градусів - південний захід
      { min: 247.5, max: 292.5, text: 'Зх' },   // 270 градусів - захід
      { min: 292.5, max: 337.5, text: 'Пн-Зх' } // 315 градусів - північний захід
    ];
    
    const normalizedDegrees = degrees % 360;
    
    for (const direction of directions) {
      if (direction.min > direction.max) {
        if (normalizedDegrees >= direction.min || normalizedDegrees <= direction.max) {
          return direction.text;
        }
      } 
      else if (normalizedDegrees >= direction.min && normalizedDegrees < direction.max) {
        return direction.text;
      }
    }
    
    return 'Невідомо';
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
    //  додати логіку для вибору іконок на основі коду погоди
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