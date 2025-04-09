const weatherService = require('../services/weatherService');

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
  }
};

module.exports = weatherController;