const mongoose = require('mongoose');

const cityTranslationSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  
  translatedName: {
    type: String,
    required: true,
    trim: true
  },
  
  latitude: {
    type: Number,
    default: null
  },
  
  longitude: {
    type: Number,
    default: null
  },
  
  country: {
    type: String,
    default: 'Ukraine'
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

cityTranslationSchema.index({ originalName: 1 });

cityTranslationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.displayName && this.originalName) {
    this.displayName = this.originalName.charAt(0).toUpperCase() + this.originalName.slice(1);
  }
  
  next();
});

const CityTranslation = mongoose.model('CityTranslation', cityTranslationSchema);

module.exports = CityTranslation;