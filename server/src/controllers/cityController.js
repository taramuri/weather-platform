  const CityTranslation = require('../models/cityTranslation');

  exports.getAllCities = async (req, res) => {
    try {
      const searchQuery = req.query.q || '';
      
      let query = {};
      
      if (searchQuery.trim()) {
        const searchRegex = new RegExp(searchQuery.trim(), 'i');
        query = {
          $or: [
            { originalName: searchRegex },
            { translatedName: searchRegex },
            { displayName: searchRegex }
          ]
        };
      }
      
      const cities = await CityTranslation.find(query)
        .sort({ displayName: 1 }) 
        .limit(20); 

      const formattedCities = cities.map(city => ({
        _id: city._id,
        originalName: city.originalName,
        translatedName: city.translatedName,
        displayName: city.displayName || 
                    (city.originalName.charAt(0).toUpperCase() + city.originalName.slice(1)), 
        latitude: city.latitude,
        longitude: city.longitude,
        country: city.country || 'Ukraine'
      }));
      
      res.json({
        success: true,
        data: formattedCities
      });
    } catch (error) {
      console.error('Помилка отримання списку міст:', error);
      
      const errorResponse = {
        success: false,
        error: error.message || 'Помилка отримання списку міст',
        type: 'GET_CITIES_ERROR'
      };
      
      res.status(500).json(errorResponse);
    }
  };

  exports.validateCity = async (req, res) => {
    try {
      const { city } = req.params;
      
      if (!city) {
        return res.status(400).json({
          success: false,
          error: 'Назва міста не вказана',
          type: 'CITY_NOT_PROVIDED'
        });
      }
      
      const normalizedCity = city.trim().toLowerCase();
      const existingCity = await CityTranslation.findOne({
        $or: [
          { originalName: normalizedCity },
          { originalName: { $regex: new RegExp(`^${normalizedCity}$`, 'i') } }
        ]
      });
      
      if (existingCity) {
        return res.json({
          success: true,
          data: {
            exists: true,
            city: {
              _id: existingCity._id,
              originalName: existingCity.originalName,
              translatedName: existingCity.translatedName,
              displayName: existingCity.displayName || 
                          (existingCity.originalName.charAt(0).toUpperCase() + existingCity.originalName.slice(1)),
              latitude: existingCity.latitude,
              longitude: existingCity.longitude,
              country: existingCity.country || 'Ukraine'
            }
          }
        });
      }
      
      const weatherService = require('../services/weatherService');
      
      try {
        const coordinates = await weatherService.getCoordinates(city);
        
        return res.json({
          success: true,
          data: {
            exists: true,
            city: {
              originalName: normalizedCity,
              translatedName: coordinates.name || city,
              displayName: coordinates.name || (city.charAt(0).toUpperCase() + city.slice(1)),
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              country: coordinates.country || 'Ukraine'
            }
          }
        });
      } catch (geoError) {
        if (geoError.type === 'CITY_NOT_FOUND') {
          return res.json({
            success: true,
            data: {
              exists: false,
              error: geoError.message
            }
          });
        }
        
        throw geoError;
      }
    } catch (error) {
      console.error('Помилка валідації міста:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Помилка валідації міста',
        type: error.type || 'VALIDATION_ERROR'
      });
    }
  };