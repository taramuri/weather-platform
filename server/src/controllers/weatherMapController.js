const weatherMapService = require('../services/weatherMapService');

exports.getWindyWidgetData = async (req, res) => {
  try {
    const city = req.params.city || 'Київ';
    const mapType = req.query.type || 'radar';
    
    const widgetData = await weatherMapService.getWindyWidgetData(city, mapType);
    
    res.json({
      success: true,
      data: widgetData
    });
  } catch (error) {
    console.error('Помилка отримання даних для Windy віджета:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Помилка отримання даних для віджета погоди',
      type: error.type || 'WIDGET_ERROR'
    };
    
    res.status(error.type === 'CITY_NOT_FOUND' ? 404 : 500).json(errorResponse);
  }
};

exports.getCityCoordinates = async (req, res) => {
  try {
    const city = req.params.city;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'Назва міста не вказана',
        type: 'CITY_NOT_PROVIDED'
      });
    }
        
    const coordinates = await weatherMapService.getCityCoordinates(city);
    
    res.json({
      success: true,
      data: coordinates
    });
  } catch (error) {
    console.error('Помилка отримання координат міста:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Помилка отримання координат міста',
      type: error.type || 'COORDINATES_ERROR'
    };
    
    res.status(error.type === 'CITY_NOT_FOUND' ? 404 : 500).json(errorResponse);
  }
};

exports.getWindyWidgetHtml = async (req, res) => {
  try {
    const city = req.params.city || 'Київ';
    const mapType = req.query.type || 'radar';
        
    const widgetData = await weatherMapService.getWindyWidgetData(city, mapType);
    
    res.setHeader('Content-Type', 'text/html');
    
    res.send(widgetData.widgetHtml);
  } catch (error) {
    console.error('Помилка отримання HTML для Windy віджета:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Помилка - Радар погоди</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .error-container {
            text-align: center;
            padding: 30px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          }
          h1 {
            color: #e74c3c;
            margin-top: 0;
          }
          p {
            color: #555;
            margin-bottom: 20px;
          }
          button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background-color: #2980b9;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Помилка завантаження радару</h1>
          <p>${error.message || 'Не вдалося завантажити радар погоди'}</p>
          <button onclick="window.location.reload()">Спробувати знову</button>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    
    res.status(500).send(errorHtml);
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await weatherMapService.getAllCities();
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Помилка отримання списку міст:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Помилка отримання списку міст',
      type: error.type || 'GET_CITIES_ERROR'
    };
    
    res.status(500).json(errorResponse);
  }
};