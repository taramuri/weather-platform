const weatherService = require('../services/weatherService');
const weatherMapService = require('../services/weatherMapService');

const weatherController = {
  async getCurrentWeather(req, res) {
    try {
      const { city } = req.params;
      const weather = await weatherService.getCurrentWeather(city);
      res.json(weather);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getForecast(req, res) {
    try {
      const { city } = req.params;
      const forecast = await weatherService.getForecast(city);
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getHourlyForecast(req, res) {
    try {
      const city = decodeURIComponent(req.params.city);  
      const hourlyForecast = await weatherService.getHourlyForecast(city);
      
      if (!hourlyForecast || hourlyForecast.length === 0) {
        return res.status(404).json({ error: 'Погодинний прогноз не знайдено' });
      }
  
      res.json(hourlyForecast);
    } catch (error) {
      console.error('Помилка в getHourlyForecast:', error);
      
      res.status(500).json({ 
        error: 'Внутрішня помилка сервера', 
        details: error.message 
      });
    }
  },
  async getLocationByCoordinates(req, res) {
    try {
      const { lat, lon } = req.query;
      const city = await weatherService.getLocationByCoordinates(lat, lon);
      res.json({ city });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
    async getAirQuality(req, res) {
      try {
        const { city } = req.params;       
        const airQualityData = await weatherService.getAirQuality(city);        
        res.json(airQualityData);
        
      } catch (error) {
        console.error('Air quality controller error:', error);
        
        const statusCode = error.name === 'WeatherServiceError' ? 400 : 500;
        const message = error.message || 'Помилка отримання даних про якість повітря';
        
        res.status(statusCode).json({ error: message });
    }
  },
  async getExtendedForecast(req, res) {
    try {
      const { city } = req.params;
      
      if (!city) {
        return res.status(400).json({ error: 'Назва міста не вказана' });
      }
      
      const forecastData = await weatherService.getExtendedForecast(city);
      res.json(forecastData);
    } catch (error) {
      console.error('Extended forecast error:', error);
      
      if (error.name === 'WeatherServiceError') {
        return res.status(400).json({ error: error.message, type: error.type });
      }
      
      res.status(500).json({ error: 'Помилка отримання розширеного прогнозу погоди' });
    }
  },
  async getMonthlyForecast(req, res) {
    try {
      const city = req.params.city;
      const monthlyForecast = await weatherService.getMonthlyForecast(city);
      res.json(monthlyForecast);
    } catch (error) {
      console.error('Monthly forecast route error:', error);
      
      const statusCode = error.type === 'CITY_NOT_PROVIDED' ? 400 : 500;
      const errorMessage = error.message || 'Помилка отримання місячного прогнозу погоди';
      
      res.status(statusCode).json({ error: errorMessage });
    }
  }
};

module.exports = weatherController;