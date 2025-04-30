const mongoose = require('mongoose');

const pollutantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  description: String,
  limit: Number,
  source: String,
  impact: String,
  unit: {
    type: String,
    default: 'мкг/м³'
  }
});

module.exports = mongoose.model('Pollutant', pollutantSchema);

