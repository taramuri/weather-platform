const mongoose = require('mongoose');

const cityTranslationSchema = new mongoose.Schema({
  originalName: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  translatedName: { 
    type: String, 
    required: true,
    trim: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '90d' } 
  }
});

module.exports = mongoose.model('CityTranslation', cityTranslationSchema);