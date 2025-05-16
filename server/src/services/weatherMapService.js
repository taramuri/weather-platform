const axios = require('axios');
const CityTranslation = require('../models/cityTranslation');

class WeatherMapServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'WeatherMapServiceError';
    this.type = type;
  }
}

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const weatherMapService = {
  async getCityCoordinates(city) {
    try {
      if (!city) {
        throw new WeatherMapServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
      
      const normalizedCityName = city.trim().toLowerCase();
      
      let existingCity = await CityTranslation.findOne({ 
        originalName: normalizedCityName 
      });
      
      if (!existingCity) {
        console.log('Точна відповідність не знайдена, шукаємо без урахування регістру');
        existingCity = await CityTranslation.findOne({
          originalName: { $regex: new RegExp(`^${normalizedCityName}$`, 'i') }
        });
      }
      
      if (!existingCity) {
        existingCity = await CityTranslation.findOne({
          translatedName: { $regex: new RegExp(`^${normalizedCityName}$`, 'i') }
        });
      }
      
      if (existingCity && existingCity.latitude && existingCity.longitude) {
        console.log(`Координати для міста ${city} знайдені в базі даних`);
        return {
          name: existingCity.displayName || existingCity.originalName,
          translatedName: existingCity.translatedName,
          latitude: existingCity.latitude,
          longitude: existingCity.longitude,
          country: existingCity.country || 'Ukraine'
        };
      }
      
      console.log(`Координати для міста ${city} не знайдені в базі даних, виконуємо геокодинг`);
      
      let searchName = normalizedCityName;
      if (existingCity && existingCity.translatedName) {
        searchName = existingCity.translatedName;
      } else {
        if (this.isUkrainianText(normalizedCityName)) {
          const translitName = this.transliterate(normalizedCityName);
          searchName = translitName;
          
          if (!existingCity) {
            existingCity = await CityTranslation.create({
              originalName: normalizedCityName,
              translatedName: translitName,
              displayName: normalizedCityName.charAt(0).toUpperCase() + normalizedCityName.slice(1)
            });
            console.log(`Створено новий запис для міста ${normalizedCityName} з перекладом ${translitName}`);
          }
        }
      }
      
      const response = await axios.get(GEO_URL, {
        params: {
          name: searchName,
          count: 1,
          language: 'uk'
        }
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        throw new WeatherMapServiceError(`Місто "${city}" не знайдено. Перевірте правильність назви.`, 'CITY_NOT_FOUND');
      }
      
      const location = response.data.results[0];
      
      if (existingCity) {
        existingCity.latitude = location.latitude;
        existingCity.longitude = location.longitude;
        existingCity.country = location.country;
        await existingCity.save();
        console.log(`Оновлено координати для міста ${city} в базі даних`);
      } else {
        await CityTranslation.create({
          originalName: normalizedCityName,
          translatedName: searchName,
          displayName: normalizedCityName.charAt(0).toUpperCase() + normalizedCityName.slice(1),
          latitude: location.latitude,
          longitude: location.longitude,
          country: location.country
        });
        console.log(`Створено новий запис для міста ${city} з координатами`);
      }
      
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        country: location.country
      };
    } catch (error) {
      if (error.name === 'WeatherMapServiceError') {
        throw error;
      }
      console.error('Помилка геокодування:', error);
      throw new WeatherMapServiceError('Не вдалося знайти координати міста', 'GEOCODING_ERROR');
    }
  },
  
  isUkrainianText(text) {
    return /[а-яА-ЯіІїЇєЄґҐ]/.test(text);
  },
  
  transliterate(text) {
    const ukrainianToLatin = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
      'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
      'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
      'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
      'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
      'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ь': '', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G',
      'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z',
      'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K',
      'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
      'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
      'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
      'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
    };
    
    return text.split('').map(char => ukrainianToLatin[char] || char).join('');
  },

  async getAllCities() {
    try {
      const cities = await CityTranslation.find({
        latitude: { $ne: null },
        longitude: { $ne: null }
      }).sort({ displayName: 1 }); 

      return cities.map(city => ({
        name: city.originalName,
        displayName: city.displayName || city.originalName,
        translatedName: city.translatedName,
        latitude: city.latitude,
        longitude: city.longitude,
        country: city.country || 'Ukraine'
      }));
    } catch (error) {
      console.error('Помилка отримання списку міст:', error);
      throw new WeatherMapServiceError('Не вдалося отримати список міст', 'GET_CITIES_ERROR');
    }
  },
  
  generateWindyWidgetHtml(city, mapType = 'radar') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Windy.com - Радар погоди для ${city.name}</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="https://embed.windy.com/embed2.html?lat=${city.latitude}&lon=${city.longitude}&zoom=7&level=surface&overlay=${mapType}&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0"></iframe>
      </body>
      </html>
    `;
  },
  
  async getWindyWidgetData(cityName, mapType = 'radar') {
    try {
      if (!cityName) {
        throw new WeatherMapServiceError('Назва міста не вказана', 'CITY_NOT_PROVIDED');
      }
      
      const cityData = await this.getCityCoordinates(cityName);
      
      const validMapTypes = ['radar', 'rain', 'temp', 'wind', 'clouds', 'pressure', 'rh'];
      const validatedMapType = validMapTypes.includes(mapType) ? mapType : 'radar';
      
      return {
        city: {
          name: cityData.name,
          translatedName: cityData.translatedName || cityData.name,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          country: cityData.country
        },
        mapType: validatedMapType,
        widgetUrl: `https://embed.windy.com/embed2.html?lat=${cityData.latitude}&lon=${cityData.longitude}&zoom=7&level=surface&overlay=${validatedMapType}&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`,
        widgetHtml: this.generateWindyWidgetHtml(cityData, validatedMapType)
      };
    } catch (error) {
      if (error.name === 'WeatherMapServiceError') {
        throw error;
      }
      console.error('Помилка отримання даних для Windy віджета:', error);
      throw new WeatherMapServiceError('Не вдалося отримати дані для віджета погоди', 'WIDGET_DATA_ERROR');
    }
  }
};

module.exports = weatherMapService;