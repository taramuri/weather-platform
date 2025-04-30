const Pollutant = require('../models/pollutant');

const pollutantService = {
  async getPollutantInfo(id) {
    try {
      const pollutant = await Pollutant.findOne({ id });
      
      if (!pollutant) {
        return {
          name: id,
          fullName: 'Невідомий показник',
          description: 'Інформація не доступна'
        };
      }
      
      return pollutant;
    } catch (error) {
      console.error('Error fetching pollutant info:', error);
      return {
        name: id,
        fullName: 'Невідомий показник',
        description: 'Інформація не доступна'
      };
    }
  },
  
  async getAllPollutants() {
    try {
      return await Pollutant.find().sort({ name: 1 });
    } catch (error) {
      console.error('Error fetching all pollutants:', error);
      return [];
    }
  }
};

module.exports = pollutantService;