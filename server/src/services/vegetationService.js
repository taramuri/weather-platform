const axios = require('axios');

class VegetationService {
  constructor() {
    this.apiKey = process.env.SATELLITE_API_KEY || '';
  }

  async getNDVIData(params) {
    const { city, lat, lon, date } = params;
    
    try {
      // В реальному проекті тут був би запит до API супутникових даних
      // Симулюємо дані для демонстрації
      
      // Базові значення NDVI для демонстрації
      const baseNDVIValue = 0.3 + (Math.random() * 0.4); // Значення від 0.3 до 0.7
      
      // Генеруємо історичні дані за останні 6 місяців
      const historicalData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        
        // Додаємо сезонні варіації
        let seasonalFactor = 0;
        const month = date.getMonth();
        
        // Весна-літо: вищі значення, осінь-зима: нижчі
        if (month >= 3 && month <= 8) { // Весна-літо
          seasonalFactor = 0.1 + (month - 3) * 0.03; // Пік у липні-серпні
        } else { // Осінь-зима
          seasonalFactor = 0.1 - Math.abs(month - 9) * 0.03; // Мінімум у грудні-січні
        }
        
        const ndviValue = baseNDVIValue + seasonalFactor + (Math.random() * 0.1 - 0.05);
        
        historicalData.push({
          date: date.toISOString().split('T')[0],
          ndvi: parseFloat(Math.min(0.9, Math.max(0.1, ndviValue)).toFixed(2))
        });
      }
      
      // Формуємо відповідь
      return {
        city: city,
        coordinates: { lat, lon },
        current_ndvi: parseFloat(baseNDVIValue.toFixed(2)),
        evi: parseFloat((baseNDVIValue * 0.9 + Math.random() * 0.1).toFixed(2)),
        savi: parseFloat((baseNDVIValue * 0.85 + Math.random() * 0.15).toFixed(2)),
        health_index: calculateHealthIndex(baseNDVIValue),
        historical_data: historicalData,
        vegetation_status: getVegetationStatus(baseNDVIValue),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Помилка отримання даних NDVI:', error);
      throw new Error('Не вдалося отримати дані вегетації');
    }
  }
  
  async getVegetationIndicesComparison(params) {
    const { city, lat, lon } = params;
    
    try {
      // Базові значення для різних індексів
      const baseNDVI = 0.3 + (Math.random() * 0.4);
      const baseEVI = baseNDVI * 0.9 + Math.random() * 0.1;
      const baseSAVI = baseNDVI * 0.85 + Math.random() * 0.15;
      const baseNDMI = baseNDVI * 0.7 + Math.random() * 0.2;
      const baseNDRE = baseNDVI * 0.8 + Math.random() * 0.15;
      
      // Підготовка даних для порівняльного графіка
      const monthlyData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        
        // Сезонний фактор
        const month = date.getMonth();
        const seasonalFactor = (month >= 3 && month <= 8) 
          ? 0.1 + (month - 3) * 0.03
          : 0.1 - Math.abs(month - 9) * 0.03;
        
        // Додаємо випадкові варіації для різних індексів
        monthlyData.push({
          date: date.toISOString().split('T')[0],
          ndvi: parseFloat(Math.min(0.9, Math.max(0.1, baseNDVI + seasonalFactor + (Math.random() * 0.1 - 0.05))).toFixed(2)),
          evi: parseFloat(Math.min(0.9, Math.max(0.1, baseEVI + seasonalFactor + (Math.random() * 0.1 - 0.05))).toFixed(2)),
          savi: parseFloat(Math.min(0.9, Math.max(0.1, baseSAVI + seasonalFactor + (Math.random() * 0.1 - 0.05))).toFixed(2)),
          ndmi: parseFloat(Math.min(0.9, Math.max(0.1, baseNDMI + seasonalFactor + (Math.random() * 0.1 - 0.05))).toFixed(2)),
          ndre: parseFloat(Math.min(0.9, Math.max(0.1, baseNDRE + seasonalFactor + (Math.random() * 0.1 - 0.05))).toFixed(2))
        });
      }
      
      return {
        city: city,
        coordinates: { lat, lon },
        indices_comparison: {
          current: {
            ndvi: parseFloat(baseNDVI.toFixed(2)),
            evi: parseFloat(baseEVI.toFixed(2)),
            savi: parseFloat(baseSAVI.toFixed(2)),
            ndmi: parseFloat(baseNDMI.toFixed(2)),
            ndre: parseFloat(baseNDRE.toFixed(2))
          },
          monthly_data: monthlyData
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Помилка отримання даних порівняння індексів вегетації:', error);
      throw new Error('Не вдалося отримати дані порівняння індексів вегетації');
    }
  }
}

function calculateHealthIndex(ndvi) {
  if (ndvi < 0.2) return 'critical';
  if (ndvi < 0.4) return 'poor';
  if (ndvi < 0.6) return 'moderate';
  if (ndvi < 0.8) return 'good';
  return 'excellent';
}

function getVegetationStatus(ndvi) {
  if (ndvi < 0.2) return 'Дуже низька вегетація';
  if (ndvi < 0.4) return 'Низька вегетація';
  if (ndvi < 0.6) return 'Середня вегетація';
  if (ndvi < 0.8) return 'Висока вегетація';
  return 'Дуже висока вегетація';
}

module.exports = new VegetationService();