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
  }
};

module.exports = weatherController;