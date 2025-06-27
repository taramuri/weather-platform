const axios = require('axios');
const weatherService = require('./weatherService');
const moistureService = require('./moistureService');

require('dotenv').config();

class AnalyticsServiceError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'AnalyticsServiceError';
    this.type = type;
  }
}

const analyticsService = {
  async getWeatherTrends(params) {
    try {
      let coordinates;
      
      if (params.lat && params.lon) {
        coordinates = { latitude: params.lat, longitude: params.lon };
      } else if (params.city) {
        const location = await weatherService.getCoordinates(params.city);
        coordinates = { latitude: location.latitude, longitude: location.longitude };
      } else {
        throw new AnalyticsServiceError('Необхідно вказати місто або координати', 'PARAMS_MISSING');
      }
      
      const timeRange = params.timeRange || 'month';
      const trendsData = await this.generateWeatherTrends(coordinates, timeRange);
      
      return trendsData;
    } catch (error) {
      console.error('Помилка отримання трендів погоди:', error);
      if (error.name === 'AnalyticsServiceError') {
        throw error;
      }
      throw new AnalyticsServiceError(`Помилка отримання трендів погоди: ${error.message}`, 'TRENDS_ERROR');
    }
  },

  async generateWeatherTrends(coordinates, timeRange) {
    try {
      const { latitude, longitude } = coordinates;
      const endDate = new Date();
      let startDate = new Date();
      let dataPoints = [];
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          dataPoints = await this.generateDailyTrends(latitude, longitude, startDate, endDate);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          dataPoints = await this.generateDailyTrends(latitude, longitude, startDate, endDate);
          break;
        case 'season':
          startDate.setMonth(endDate.getMonth() - 3);
          dataPoints = await this.generateWeeklyTrends(latitude, longitude, startDate, endDate);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          dataPoints = await this.generateMonthlyTrends(latitude, longitude, startDate, endDate);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
          dataPoints = await this.generateDailyTrends(latitude, longitude, startDate, endDate);
      }
      
      const analysis = this.analyzeTrends(dataPoints, timeRange);
      
      return {
        timeRange,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        data: dataPoints,
        analysis,
        coordinates,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Помилка генерації трендів:', error);
      throw new AnalyticsServiceError('Помилка генерації трендів: ' + error.message, 'TREND_GENERATION_ERROR');
    }
  },

  async generateDailyTrends(latitude, longitude, startDate, endDate) {
    const dataPoints = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const seasonalTemp = this.getSeasonalTemperature(latitude, currentDate);
      const seasonalPrecip = this.getSeasonalPrecipitation(latitude, currentDate);
      const seasonalHumidity = this.getSeasonalHumidity(latitude, currentDate);
      
      const tempVariation = (Math.random() - 0.5) * 10;
      const precipVariation = Math.random() * 0.7 + 0.3;
      const humidityVariation = (Math.random() - 0.5) * 20;
      
      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        day: currentDate.toLocaleDateString('uk-UA', { weekday: 'short' }),
        temperature: parseFloat((seasonalTemp + tempVariation).toFixed(1)),
        temperature_max: parseFloat((seasonalTemp + tempVariation + Math.random() * 5).toFixed(1)),
        temperature_min: parseFloat((seasonalTemp + tempVariation - Math.random() * 5).toFixed(1)),
        precipitation: parseFloat((seasonalPrecip * precipVariation).toFixed(1)),
        humidity: Math.round(Math.max(20, Math.min(95, seasonalHumidity + humidityVariation))),
        wind_speed: parseFloat((5 + Math.random() * 10).toFixed(1)),
        pressure: Math.round(1013 + (Math.random() - 0.5) * 40),
        uv_index: this.calculateUVIndex(latitude, currentDate)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dataPoints;
  },

  async generateWeeklyTrends(latitude, longitude, startDate, endDate) {
    const dataPoints = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const weekData = await this.generateDailyTrends(latitude, longitude, currentDate, new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000));
      
      const weeklyData = this.aggregateWeeklyData(weekData, currentDate);
      dataPoints.push(weeklyData);
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dataPoints;
  },

  async generateMonthlyTrends(latitude, longitude, startDate, endDate) {
    const dataPoints = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const monthData = await this.generateDailyTrends(latitude, longitude, currentDate, monthEnd);
      
      const monthlyData = this.aggregateMonthlyData(monthData, currentDate);
      dataPoints.push(monthlyData);
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return dataPoints;
  },

  getSeasonalTemperature(latitude, date) {
    const month = date.getMonth() + 1;
    const latitudeFactor = Math.max(0.3, 1 - Math.abs(latitude - 50) / 50);
    
    const baseTemperatures = {
      1: -3, 2: -1, 3: 4, 4: 11, 5: 17, 6: 20,
      7: 22, 8: 21, 9: 16, 10: 10, 11: 4, 12: -1
    };
    
    return (baseTemperatures[month] || 10) * latitudeFactor;
  },

  getSeasonalPrecipitation(latitude, date) {
    const month = date.getMonth() + 1;
    
    const basePrecipitation = {
      1: 1.5, 2: 1.3, 3: 1.6, 4: 1.8, 5: 2.1, 6: 2.7,
      7: 2.5, 8: 2.3, 9: 1.9, 10: 1.4, 11: 1.7, 12: 1.6
    };
    
    return basePrecipitation[month] || 1.8;
  },

  getSeasonalHumidity(latitude, date) {
    const month = date.getMonth() + 1;
    
    const baseHumidity = {
      1: 85, 2: 82, 3: 76, 4: 70, 5: 68, 6: 71,
      7: 73, 8: 75, 9: 78, 10: 81, 11: 84, 12: 86
    };
    
    return baseHumidity[month] || 75;
  },

  calculateUVIndex(latitude, date) {
    const month = date.getMonth() + 1;
    const latitudeFactor = Math.max(0.1, 1 - Math.abs(latitude - 25) / 40);
    
    const baseUV = {
      1: 1, 2: 2, 3: 4, 4: 6, 5: 8, 6: 9,
      7: 9, 8: 8, 9: 6, 10: 4, 11: 2, 12: 1
    };
    
    return Math.round((baseUV[month] || 5) * latitudeFactor);
  },

  aggregateWeeklyData(dailyData, weekStart) {
    const totalDays = dailyData.length;
    
    return {
      date: weekStart.toISOString().split('T')[0],
      week: `Тиждень ${this.getWeekNumber(weekStart)}`,
      temperature: parseFloat((dailyData.reduce((sum, day) => sum + day.temperature, 0) / totalDays).toFixed(1)),
      temperature_max: Math.max(...dailyData.map(day => day.temperature_max)),
      temperature_min: Math.min(...dailyData.map(day => day.temperature_min)),
      precipitation: parseFloat(dailyData.reduce((sum, day) => sum + day.precipitation, 0).toFixed(1)),
      humidity: Math.round(dailyData.reduce((sum, day) => sum + day.humidity, 0) / totalDays),
      wind_speed: parseFloat((dailyData.reduce((sum, day) => sum + day.wind_speed, 0) / totalDays).toFixed(1)),
      pressure: Math.round(dailyData.reduce((sum, day) => sum + day.pressure, 0) / totalDays)
    };
  },

  aggregateMonthlyData(dailyData, monthStart) {
    const totalDays = dailyData.length;
    
    return {
      date: monthStart.toISOString().split('T')[0],
      month: monthStart.toLocaleDateString('uk-UA', { month: 'long' }),
      temperature: parseFloat((dailyData.reduce((sum, day) => sum + day.temperature, 0) / totalDays).toFixed(1)),
      temperature_max: Math.max(...dailyData.map(day => day.temperature_max)),
      temperature_min: Math.min(...dailyData.map(day => day.temperature_min)),
      precipitation: parseFloat(dailyData.reduce((sum, day) => sum + day.precipitation, 0).toFixed(1)),
      humidity: Math.round(dailyData.reduce((sum, day) => sum + day.humidity, 0) / totalDays),
      wind_speed: parseFloat((dailyData.reduce((sum, day) => sum + day.wind_speed, 0) / totalDays).toFixed(1)),
      pressure: Math.round(dailyData.reduce((sum, day) => sum + day.pressure, 0) / totalDays)
    };
  },

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  },

  analyzeTrends(dataPoints, timeRange) {
    if (!Array.isArray(dataPoints) || dataPoints.length < 2) {
      return {
        temperature_trend: { 
          direction: 'stable', 
          magnitude: 'minimal', 
          description: 'Стабільна' 
        },
        precipitation_trend: { 
          direction: 'stable', 
          magnitude: 'minimal', 
          description: 'Стабільна' 
        },
        humidity_trend: { 
          direction: 'stable', 
          magnitude: 'minimal', 
          description: 'Стабільна' 
        },
        anomalies: [],
        forecast: {
          confidence: 'low',
          description: 'Недостатньо даних для аналізу'
        },
        summary: 'Недостатньо даних для аналізу'
      };
    }
    
    const temperatures = dataPoints.map(point => point.temperature || 0).filter(temp => !isNaN(temp));
    const precipitations = dataPoints.map(point => point.precipitation || 0).filter(precip => !isNaN(precip));
    const humidities = dataPoints.map(point => point.humidity || 0).filter(hum => !isNaN(hum));
    
    const temperatureTrend = temperatures.length > 1 ? this.calculateTrend(temperatures) : 0;
    const precipitationTrend = precipitations.length > 1 ? this.calculateTrend(precipitations) : 0;
    const humidityTrend = humidities.length > 1 ? this.calculateTrend(humidities) : 0;
    
    const anomalies = this.detectAnomalies(dataPoints);
    
    const forecast = this.generateShortTermForecast(dataPoints);
    
    const tempTrendObj = this.interpretTrend(temperatureTrend, 'temperature');
    const precipTrendObj = this.interpretTrend(precipitationTrend, 'precipitation');
    const humidTrendObj = this.interpretTrend(humidityTrend, 'humidity');
    
    return {
      temperature_trend: tempTrendObj,
      precipitation_trend: precipTrendObj,
      humidity_trend: humidTrendObj,
      anomalies: anomalies || [],
      forecast: forecast || { confidence: 'low', description: 'Прогноз недоступний' },
      summary: this.generateSummary(tempTrendObj, precipTrendObj, anomalies, timeRange)
    };
  },

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  },

  interpretTrend(slope, type) {
    const threshold = type === 'temperature' ? 0.1 : (type === 'precipitation' ? 0.05 : 0.5);
    
    if (Math.abs(slope) < threshold) {
      return { 
        direction: 'stable', 
        magnitude: 'minimal', 
        description: 'Стабільна' 
      };
    } else if (slope > threshold * 3) {
      return { 
        direction: 'increasing', 
        magnitude: 'strong', 
        description: 'Сильне зростання' 
      };
    } else if (slope > threshold) {
      return { 
        direction: 'increasing', 
        magnitude: 'moderate', 
        description: 'Помірне зростання' 
      };
    } else if (slope < -threshold * 3) {
      return { 
        direction: 'decreasing', 
        magnitude: 'strong', 
        description: 'Сильне зниження' 
      };
    } else {
      return { 
        direction: 'decreasing', 
        magnitude: 'moderate', 
        description: 'Помірне зниження' 
      };
    }
  },

  detectAnomalies(dataPoints) {
    const anomalies = [];
    const temperatures = dataPoints.map(point => point.temperature);
    const tempMean = temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length;
    const tempStd = Math.sqrt(temperatures.reduce((sum, val) => sum + Math.pow(val - tempMean, 2), 0) / temperatures.length);
    
    dataPoints.forEach((point, index) => {
      if (Math.abs(point.temperature - tempMean) > 2 * tempStd) {
        anomalies.push({
          date: point.date,
          type: 'temperature',
          value: point.temperature,
          deviation: Math.abs(point.temperature - tempMean),
          description: point.temperature > tempMean ? 'Аномально висока температура' : 'Аномально низька температура'
        });
      }
      
      if (point.precipitation > 10) {
        anomalies.push({
          date: point.date,
          type: 'precipitation',
          value: point.precipitation,
          description: 'Інтенсивні опади'
        });
      }
    });
    
    return anomalies;
  },

  generateShortTermForecast(dataPoints) {
    const recentData = dataPoints.slice(-7); 
    
    if (recentData.length < 3) {
      return {
        confidence: 'low',
        description: 'Недостатньо даних для прогнозу'
      };
    }
    
    const tempTrend = this.calculateTrend(recentData.map(p => p.temperature));
    const precipTrend = this.calculateTrend(recentData.map(p => p.precipitation));
    
    const lastPoint = recentData[recentData.length - 1];
    
    return {
      next_period: {
        temperature: parseFloat((lastPoint.temperature + tempTrend).toFixed(1)),
        precipitation: Math.max(0, parseFloat((lastPoint.precipitation + precipTrend).toFixed(1))),
        confidence: recentData.length >= 7 ? 'high' : 'medium'
      },
      description: this.generateForecastDescription(tempTrend, precipTrend)
    };
  },

  generateForecastDescription(tempTrend, precipTrend) {
    let description = 'На найближчий період очікується ';
    
    if (tempTrend > 0.2) {
      description += 'підвищення температури';
    } else if (tempTrend < -0.2) {
      description += 'зниження температури';
    } else {
      description += 'стабільна температура';
    }
    
    if (precipTrend > 0.1) {
      description += ' та збільшення кількості опадів';
    } else if (precipTrend < -0.1) {
      description += ' та зменшення кількості опадів';
    } else {
      description += ' без значних змін в опадах';
    }
    
    return description + '.';
  },

  generateSummary(tempTrend, precipTrend, anomalies, timeRange) {
    const tempDescription = tempTrend?.description || 'невідома тенденція';
    const precipDescription = precipTrend?.description || 'невідома тенденція';
    const precipDirection = precipTrend?.direction || 'stable';
    
    const safeTimeRange = timeRange || 'period';
    
    let summary = `Аналіз погодних умов за ${
      safeTimeRange === 'week' ? 'тиждень' : 
      safeTimeRange === 'month' ? 'місяць' : 
      safeTimeRange === 'season' ? 'сезон' :
      safeTimeRange === 'year' ? 'рік' : 'період'
    }: `;
    
    summary += `температура ${tempDescription.toLowerCase()}`;
    
    if (precipDirection !== 'stable' && precipDescription) {
      summary += `, опади ${precipDescription.toLowerCase()}`;
    }
    
    if (Array.isArray(anomalies) && anomalies.length > 0) {
      summary += `. Виявлено ${anomalies.length} аномалій`;
    }
    
    return summary + '.';
  },

  async getCropYieldPrediction(params) {
    try {
      const city = params.city;
      const crop = params.crop || 'пшениця';
      
      if (!city) {
        throw new AnalyticsServiceError('Необхідно вказати місто', 'CITY_REQUIRED');
      }
      
      const weatherTrends = await this.getWeatherTrends({ city, timeRange: 'season' });
      
      const moistureData = await moistureService.getMoistureData({ city });
      
      const yieldPrediction = await this.calculateYieldPrediction(crop, weatherTrends, moistureData);
      
      return yieldPrediction;
    } catch (error) {
      console.error('Помилка прогнозування врожайності:', error);
      if (error.name === 'AnalyticsServiceError') {
        throw error;
      }
      throw new AnalyticsServiceError(`Помилка прогнозування врожайності: ${error.message}`, 'YIELD_PREDICTION_ERROR');
    }
  },

  async calculateYieldPrediction(crop, weatherTrends, moistureData) {
    const baseCropYields = {
      'пшениця': { base: 4.5, min: 2.0, max: 7.0 },
      'кукурудза': { base: 6.8, min: 3.0, max: 12.0 },
      'соняшник': { base: 2.2, min: 1.0, max: 3.5 },
      'ріпак': { base: 2.8, min: 1.5, max: 4.2 },
      'соя': { base: 2.1, min: 1.0, max: 3.2 },
      'картопля': { base: 18.5, min: 10.0, max: 35.0 }
    };
    
    const cropData = baseCropYields[crop] || baseCropYields['пшениця'];
    let yieldFactor = 1.0;
    const factors = [];
    
    const avgTemp = weatherTrends.data.reduce((sum, point) => sum + point.temperature, 0) / weatherTrends.data.length;
    
    if (avgTemp < 15) {
      yieldFactor *= 0.85;
      factors.push({ factor: 'low_temperature', impact: -15, description: 'Низька температура знижує врожайність' });
    } else if (avgTemp > 25) {
      yieldFactor *= 0.9;
      factors.push({ factor: 'high_temperature', impact: -10, description: 'Висока температура може знижувати врожайність' });
    } else {
      factors.push({ factor: 'optimal_temperature', impact: 5, description: 'Оптимальна температура для росту' });
      yieldFactor *= 1.05;
    }
    
    const totalPrecip = weatherTrends.data.reduce((sum, point) => sum + point.precipitation, 0);
    
    if (totalPrecip < 50) {
      yieldFactor *= 0.7;
      factors.push({ factor: 'drought', impact: -30, description: 'Недостатня кількість опадів' });
    } else if (totalPrecip > 200) {
      yieldFactor *= 0.85;
      factors.push({ factor: 'excess_rain', impact: -15, description: 'Надмірна кількість опадів' });
    } else {
      factors.push({ factor: 'adequate_rain', impact: 10, description: 'Достатня кількість опадів' });
      yieldFactor *= 1.1;
    }
    
    if (moistureData.current_moisture < 30) {
      yieldFactor *= 0.75;
      factors.push({ factor: 'low_soil_moisture', impact: -25, description: 'Низька вологість ґрунту' });
    } else if (moistureData.current_moisture > 80) {
      yieldFactor *= 0.9;
      factors.push({ factor: 'high_soil_moisture', impact: -10, description: 'Надмірна вологість ґрунту' });
    } else {
      factors.push({ factor: 'optimal_soil_moisture', impact: 8, description: 'Оптимальна вологість ґрунту' });
      yieldFactor *= 1.08;
    }
    
    const predictedYield = Math.max(cropData.min, Math.min(cropData.max, cropData.base * yieldFactor));
    
    let riskLevel = 'low';
    let riskDescription = 'Низький ризик втрат врожаю';
    
    if (yieldFactor < 0.8) {
      riskLevel = 'high';
      riskDescription = 'Високий ризик втрат врожаю';
    } else if (yieldFactor < 0.9) {
      riskLevel = 'medium';
      riskDescription = 'Помірний ризик втрат врожаю';
    }
    
    const recommendations = this.generateYieldRecommendations(factors, crop);
    
    return {
      crop,
      predicted_yield: parseFloat(predictedYield.toFixed(1)),
      yield_range: {
        min: parseFloat((predictedYield * 0.85).toFixed(1)),
        max: parseFloat((predictedYield * 1.15).toFixed(1))
      },
      baseline_yield: cropData.base,
      yield_factor: parseFloat(yieldFactor.toFixed(2)),
      risk_level: riskLevel,
      risk_description: riskDescription,
      confidence: yieldFactor > 0.95 ? 'high' : yieldFactor > 0.85 ? 'medium' : 'low',
      factors,
      recommendations,
      last_updated: new Date().toISOString()
    };
  },

  generateYieldRecommendations(factors, crop) {
    const recommendations = [];
    
    factors.forEach(factor => {
      switch (factor.factor) {
        case 'drought':
          recommendations.push({
            priority: 'high',
            action: 'Збільшити полив',
            description: 'Необхідне додаткове зрошення через недостатню кількість опадів'
          });
          break;
        case 'low_soil_moisture':
          recommendations.push({
            priority: 'high',
            action: 'Інтенсивний полив ґрунту',
            description: 'Критично низька вологість ґрунту потребує негайного втручання'
          });
          break;
        case 'high_temperature':
          recommendations.push({
            priority: 'medium',
            action: 'Захист від перегріву',
            description: 'Розглянути можливості затінення або охолодження'
          });
          break;
        case 'excess_rain':
          recommendations.push({
            priority: 'medium',
            action: 'Забезпечити дренаж',
            description: 'Надлишок вологи може потребувати дренажних заходів'
          });
          break;
      }
    });
    
    const cropSpecificRecommendations = {
      'пшениця': [
        { priority: 'medium', action: 'Моніторинг хвороб', description: 'Пшениця схильна до грибкових захворювань у вологих умовах' }
      ],
      'кукурудза': [
        { priority: 'medium', action: 'Контроль шкідників', description: 'Кукурудза потребує захисту від кукурудзяного жука' }
      ],
      'соняшник': [
        { priority: 'low', action: 'Орієнтація на сонце', description: 'Забезпечити оптимальне освітлення посівів' }
      ]
    };
    
    if (cropSpecificRecommendations[crop]) {
      recommendations.push(...cropSpecificRecommendations[crop]);
    }
    
    return recommendations;
  }
};

module.exports = analyticsService;