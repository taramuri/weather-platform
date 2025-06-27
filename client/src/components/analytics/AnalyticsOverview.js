
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, Box, 
  Grid, Chip, LinearProgress, Paper, Tabs, Tab,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp, TrendingDown, TrendingFlat,
  Thermostat, Opacity, Grass, Analytics,
  WaterDrop, Timeline
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Bar, RadialBarChart, RadialBar, Legend,
  ComposedChart
} from 'recharts';
import { useTemperature } from '../../context/TemperatureContext';
import WeatherIcon from '../common/WeatherIcon';

const AnalyticsOverview = ({ 
  weatherData, 
  moistureData, 
  vegetationData, 
  trendsData,
  city,
  forecastData: propForecastData,
  hourlyForecastData: propHourlyData,
  extendedForecastData: propExtendedData,
  monthlyForecastData: propMonthlyData,
  loading: propLoading
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [processedForecast, setProcessedForecast] = useState([]);
  const [correlationData, setCorrelationData] = useState([]);
  const [moistureForecast, setMoistureForecast] = useState([]);
  const [loadingMoisture, setLoadingMoisture] = useState(false);
  const { formatTemperature, getUnitSymbol, units } = useTemperature();

  useEffect(() => {
    if (propExtendedData && propExtendedData.length > 0) {
      const processed = propExtendedData.map(day => ({
        date: new Date(day.date).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' }),
        fullDate: day.date,
        temperature: formatTemperature(day.day?.temperature || day.temperature || 0),
        minTemperature: formatTemperature(day.night?.temperature || day.minTemperature || 0),
        maxTemperature: formatTemperature(day.day?.temperature || day.maxTemperature || 0),
        humidity: Math.round(day.day?.humidity || day.humidity || 50),
        windSpeed: Math.round((day.day?.windSpeed || day.windSpeed || 0) * 10) / 10,
        precipProbability: day.precipProbability || day.day?.precipProbability || 0
      }));
      setProcessedForecast(processed);
    } 
    else if (propForecastData && propForecastData.length > 0) {
      const processed = propForecastData.map(day => ({
        date: new Date(day.date).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' }),
        fullDate: day.date,
        temperature: formatTemperature(day.temperature),
        minTemperature: formatTemperature(day.minTemperature),
        maxTemperature: formatTemperature(day.maxTemperature),
        humidity: Math.round(day.humidity),
        windSpeed: Math.round(day.windSpeed * 10) / 10,
        precipProbability: day.precipProbability || 0
      }));
      setProcessedForecast(processed);
    }
  }, [propExtendedData, propForecastData, formatTemperature, units]);

  const generateBasicMoistureForecast = useCallback(() => {
    const forecast = processedForecast.map(day => {
      const baseValue = moistureData?.current_moisture || 50;
      const variation = (Math.random() - 0.5) * 15;
      const moisture = Math.max(10, Math.min(90, baseValue + variation));
      const optimal = moisture >= 40 && moisture <= 70;
      
      return {
        date: day.date,
        moisture: Math.round(moisture),
        optimal: optimal ? moisture : 0,
        risk: !optimal ? moisture : 0
      };
    });
    setMoistureForecast(forecast);
  }, [processedForecast, moistureData]);

  const fetchMoistureForecast = useCallback(async () => {
    setLoadingMoisture(true);
    try {
      const response = await fetch(`http://localhost:5000/api/weather/moisture?city=${encodeURIComponent(city)}`);
      
      if (response.ok) {
        const moistureResult = await response.json();
        
        if (moistureResult.success && moistureResult.data) {
          const forecast = processedForecast.map((day, index) => {
            const currentMoisture = moistureResult.data.current_moisture;
            const precipProbability = day.precipProbability || 0;
            const temperature = day.temperature;
            
            let moistureChange = 0;
            
            if (precipProbability > 50) {
              moistureChange += (precipProbability / 100) * 15;
            }
            
            const tempCelsius = units === 'fahrenheit' ? (temperature - 32) * 5/9 : temperature;
            if (tempCelsius > 25) {
              moistureChange -= (tempCelsius - 25) * 0.5;
            }
            
            moistureChange -= index * 2;
            
            const predictedMoisture = Math.max(10, Math.min(90, currentMoisture + moistureChange));
            const optimal = predictedMoisture >= 40 && predictedMoisture <= 70;
            
            return {
              date: day.date,
              moisture: Math.round(predictedMoisture),
              optimal: optimal ? predictedMoisture : 0,
              risk: !optimal ? predictedMoisture : 0,
              precipProbability: precipProbability,
              temperature: temperature
            };
          });
          
          setMoistureForecast(forecast);
        }
      } else {
        console.warn('Не вдалося отримати дані вологості для прогнозу');
        generateBasicMoistureForecast();
      }
    } catch (error) {
      console.error('Помилка отримання прогнозу вологості:', error);
      generateBasicMoistureForecast();
    } finally {
      setLoadingMoisture(false);
    }
  }, [city, processedForecast, units, generateBasicMoistureForecast]); 

  useEffect(() => {
    if (city && processedForecast.length > 0) {
      fetchMoistureForecast();
    }
  }, [city, processedForecast, fetchMoistureForecast]);

  const generateCorrelationFromProps = useCallback(() => {
    if (processedForecast.length > 0) {
      const daysToUse = Math.min(14, processedForecast.length);
      const correlation = processedForecast.slice(0, daysToUse).map((day, index) => {
        const moistureValue = moistureForecast.length > index ? 
          moistureForecast[index].moisture : 
          (moistureData?.current_moisture || 50);
          
        return {
          date: day.date,
          temperature: day.temperature,
          moisture: moistureValue,
          vegetation: vegetationData?.indices?.ndvi || 0.5,
          humidity: day.humidity,
          windSpeed: day.windSpeed
        };
      });
      setCorrelationData(correlation);
    }
  }, [processedForecast, moistureData, vegetationData, moistureForecast]);

  useEffect(() => {
    generateCorrelationFromProps();
  }, [generateCorrelationFromProps]);

  const getMetricStatus = (value, thresholds) => {
    if (value >= thresholds.excellent) return { status: 'excellent', color: '#4caf50' };
    if (value >= thresholds.good) return { status: 'good', color: '#8bc34a' };
    if (value >= thresholds.moderate) return { status: 'moderate', color: '#ff9800' };
    return { status: 'poor', color: '#f44336' };
  };

  const getTrendIcon = (trend) => {
    if (!trend) return <TrendingFlat color="action" />;
    switch (trend.direction) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const calculateOverallScore = () => {
    let score = 0;
    let factors = 0;
  
    if (weatherData?.temperature !== undefined) {
      const tempCelsius = weatherData.temperature; 
      const tempScore = tempCelsius >= 15 && tempCelsius <= 25 ? 100 : 50;
      score += tempScore;
      factors++;
    }
  
    if (moistureData?.current_moisture !== undefined) {
      const moistureScore = moistureData.current_moisture >= 40 && moistureData.current_moisture <= 70 ? 100 : 50;
      score += moistureScore;
      factors++;
    }
  
    if (vegetationData?.health?.score !== undefined) {
      score += vegetationData.health.score;
      factors++;
    }
  
    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const overallScore = calculateOverallScore();
  const scoreStatus = getMetricStatus(overallScore, { excellent: 80, good: 65, moderate: 50 });

  const radialData = [
    {
      name: 'Температура',
      value: weatherData?.temperature ? Math.min(100, Math.abs(weatherData.temperature) * 2.5) : 50,
      fill: '#ff7300'
    },
    {
      name: 'Вологість',
      value: moistureData?.current_moisture || 50,
      fill: '#82ca9d'
    },
    {
      name: 'Рослинність',
      value: vegetationData?.health?.score || 50,
      fill: '#8884d8'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderMainMetrics = () => (
    <Grid container spacing={3}>
      {/* Overall Score */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" sx={{ color: scoreStatus.color, fontWeight: 'bold' }}>
            {overallScore}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Загальна оцінка
          </Typography>
          <LinearProgress
            variant="determinate"
            value={overallScore}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                backgroundColor: scoreStatus.color
              }
            }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {scoreStatus.status === 'excellent' ? 'Відмінно' :
             scoreStatus.status === 'good' ? 'Добре' :
             scoreStatus.status === 'moderate' ? 'Помірно' : 'Потребує уваги'}
          </Typography>
        </Paper>
      </Grid>

      {/* Weather Metrics */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Thermostat color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">
              Погодні умови
            </Typography>
          </Box>
          
          {weatherData && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <WeatherIcon 
                  condition={weatherData.description} 
                  currentTime={new Date()}
                  sunrise={weatherData.sunrise}
                  sunset={weatherData.sunset}
                  size={48}
                />
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatTemperature(weatherData.temperature)}{getUnitSymbol()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {weatherData.description}
                  </Typography>
                </Box>
              </Box>
              
              <Chip
                label={`Вітер: ${weatherData.windSpeed} м/с`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          {trendsData?.analysis?.temperature_trend && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {getTrendIcon(trendsData.analysis.temperature_trend)}
              <Typography variant="caption">
                {trendsData.analysis.temperature_trend.description}
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Moisture Metrics */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Opacity color="info" />
            <Typography variant="subtitle1" fontWeight="bold">
              Вологість ґрунту
            </Typography>
          </Box>
          
          {moistureData && (
            <Box>
              <Typography variant="h4" color="info.main" gutterBottom>
                {moistureData.current_moisture}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={moistureData.current_moisture}
                sx={{
                  mb: 1,
                  height: 6,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: moistureData.current_moisture < 30 ? '#f44336' :
                                   moistureData.current_moisture > 70 ? '#2196f3' : '#4caf50'
                  }
                }}
              />
              <Typography variant="body2" color="textSecondary">
                Різниця з історичною: {moistureData.moisture_difference > 0 ? '+' : ''}{moistureData.moisture_difference}%
              </Typography>
              <Chip
                label={moistureData.risk_level === 'normal' ? 'Нормальний рівень' : 'Потребує уваги'}
                size="small"
                color={moistureData.risk_level === 'normal' ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Vegetation Metrics */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Grass color="success" />
            <Typography variant="subtitle1" fontWeight="bold">
              Стан рослинності
            </Typography>
          </Box>
          
          {vegetationData && (
            <Box>
              {vegetationData.health?.score && (
                <Typography variant="h4" color="success.main" gutterBottom>
                  {vegetationData.health.score}/100
                </Typography>
              )}
              
              {vegetationData.indices?.ndvi && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  NDVI: {vegetationData.indices.ndvi.toFixed(3)}
                </Typography>
              )}
              
              <Chip
                label={vegetationData.health?.status === 'excellent' ? 'Відмінно' :
                       vegetationData.health?.status === 'good' ? 'Добре' :
                       vegetationData.health?.status === 'moderate' ? 'Помірно' : 'Потребує уваги'}
                size="small"
                color={vegetationData.health?.status === 'excellent' || vegetationData.health?.status === 'good' ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTemperatureChart = () => {
    const chartData = processedForecast;
    const daysCount = chartData.length;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌡️ Температурні тренди ({daysCount} {daysCount === 1 ? 'день' : daysCount <= 4 ? 'дні' : 'днів'})
          </Typography>
          {propLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  interval={daysCount > 10 ? 1 : 0}
                  angle={daysCount > 10 ? -45 : 0}
                  textAnchor={daysCount > 10 ? 'end' : 'middle'}
                  height={daysCount > 10 ? 80 : 60}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => `Дата: ${value}`}
                  formatter={(value, name) => {
                    if (name.includes('температура')) {
                      return [`${value}${getUnitSymbol()}`, name];
                    }
                    if (name === 'Вологість повітря (%)') return [`${value}%`, name];
                    if (name === 'Швидкість вітру (м/с)') return [`${value} м/с`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="humidity"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  stroke="#82ca9d"
                  name="Вологість повітря (%)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ff7300"
                  strokeWidth={3}
                  name={`Температура (${getUnitSymbol()})`}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="maxTemperature"
                  stroke="#ff9999"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={`Макс. температура (${getUnitSymbol()})`}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="minTemperature"
                  stroke="#99ccff"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={`Мін. температура (${getUnitSymbol()})`}
                />
                <Bar
                  yAxisId="right"
                  dataKey="windSpeed"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Швидкість вітру (м/с)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">Дані недоступні</Typography>
            </Box>
          )}          
        </CardContent>
      </Card>
    );
  };

  const renderMoistureChart = () => {
    const daysCount = moistureForecast.length;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💧 Прогноз вологості ґрунту ({daysCount} {daysCount === 1 ? 'день' : daysCount <= 4 ? 'дні' : 'днів'})
          </Typography>
          {propLoading || loadingMoisture ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : moistureForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={moistureForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  interval={daysCount > 10 ? 1 : 0}
                  angle={daysCount > 10 ? -45 : 0}
                  textAnchor={daysCount > 10 ? 'end' : 'middle'}
                  height={daysCount > 10 ? 80 : 60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Оптимальна вологість' || name === 'Ризикова вологість') {
                      return [`${value}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="optimal"
                  stackId="1"
                  stroke="#4caf50"
                  fill="#4caf50"
                  name="Оптимальна вологість"
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stackId="2"
                  stroke="#f44336"
                  fill="#f44336"
                  name="Ризикова вологість"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">Дані недоступні</Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip size="small" label="Оптимально: 40-70%" color="success" />
            <Chip size="small" label="Ризик: <30% або >70%" color="error" />
            {moistureData && (
              <Chip 
                size="small" 
                label={`Поточна: ${moistureData.current_moisture}%`} 
                color="primary" 
              />
            )}
            {daysCount >= 10 && (
              <Chip 
                size="small" 
                label="Розширений прогноз" 
                color="success" 
              />
            )}
            <Chip 
              size="small" 
              label="На основі API даних" 
              color="info" 
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderVegetationChart = () => {
    const vegetationHistory = [];
    const currentDate = new Date();
    const baseNDVI = vegetationData?.indices?.ndvi || 0.5;
    const baseEVI = vegetationData?.indices?.evi || 0.3;
    const baseLAI = vegetationData?.indices?.lai || 2.0;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      
      const seasonalFactor = Math.sin((date.getMonth() + 1) * Math.PI / 6) * 0.3 + 0.7;
      
      vegetationHistory.push({
        month: date.toLocaleDateString('uk-UA', { month: 'short' }),
        ndvi: Math.round((baseNDVI * seasonalFactor + (Math.random() - 0.5) * 0.1) * 1000) / 1000,
        evi: Math.round((baseEVI * seasonalFactor + (Math.random() - 0.5) * 0.08) * 1000) / 1000,
        lai: Math.round((baseLAI * seasonalFactor + (Math.random() - 0.5) * 0.3) * 100) / 100
      });
    }
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌱 Індекси вегетації (12 місяців)
          </Typography>
          {vegetationHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vegetationHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="NDVI"
                />
                <Line
                  type="monotone"
                  dataKey="evi"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="EVI"
                />
                <Line
                  type="monotone"
                  dataKey="lai"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="LAI"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">Дані вегетації недоступні</Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip size="small" label="NDVI: Індекс вегетації" color="primary" />
            <Chip size="small" label="EVI: Покращений індекс" color="success" />
            <Chip size="small" label="LAI: Індекс листової поверхні" color="warning" />
            {vegetationData?.indices && (
              <Chip 
                size="small" 
                label={`Поточний NDVI: ${vegetationData.indices.ndvi?.toFixed(3)}`} 
                color="info" 
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCorrelationChart = () => {
    const daysCount = correlationData.length;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔗 Кореляція параметрів ({daysCount} {daysCount === 1 ? 'день' : daysCount <= 4 ? 'дні' : 'днів'})
              </Typography>
              {propLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : correlationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      interval={daysCount > 10 ? 1 : 0}
                      angle={daysCount > 10 ? -45 : 0}
                      textAnchor={daysCount > 10 ? 'end' : 'middle'}
                      height={daysCount > 10 ? 80 : 60}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name.includes('температура')) {
                          return [`${value}${getUnitSymbol()}`, name];
                        }
                        if (name === 'Вологість ґрунту (%)') return [`${value}%`, name];
                        if (name === 'NDVI') return [value, name];
                        if (name === 'Вітер (м/с)') return [`${value} м/с`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      stroke="#ff7300"
                      name={`Температура (${getUnitSymbol()})`}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="moisture"
                      stroke="#82ca9d"
                      name="Вологість ґрунту (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="vegetation"
                      stroke="#8884d8"
                      name="NDVI"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="windSpeed"
                      fill="#ffc658"
                      fillOpacity={0.6}
                      name="Вітер (м/с)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">Дані кореляції недоступні</Typography>
                </Box>
              )}
              {daysCount >= 10 && (
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    size="small" 
                    label="Розширений аналіз кореляції" 
                    color="success" 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Розподіл показників
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart data={radialData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    dataKey="value"
                  />
                  <Legend />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics color="primary" />
        Аналітичний огляд - {city}
      </Typography>

      {/* Main Metrics */}
      <Box sx={{ mb: 3 }}>
        {renderMainMetrics()}
      </Box>

      {/* Charts Navigation */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab 
              label="Температура" 
              icon={<Thermostat />} 
              iconPosition="start"
            />
            <Tab 
              label="Вологість" 
              icon={<WaterDrop />} 
              iconPosition="start"
            />
            <Tab 
              label="Рослинність" 
              icon={<Grass />} 
              iconPosition="start"
            />
            <Tab 
              label="Кореляції" 
              icon={<Timeline />} 
              iconPosition="start"
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Chart Content */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && renderTemperatureChart()}
        {activeTab === 1 && renderMoistureChart()}
        {activeTab === 2 && renderVegetationChart()}
        {activeTab === 3 && renderCorrelationChart()}
      </Box>

      {/* API Data Status */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {moistureData?.current_moisture < 30 && (
            <Chip
              label="Низька вологість ґрунту"
              color="error"
              size="small"
              icon={<Opacity />}
            />
          )}
          
          {weatherData?.temperature && (
            (() => {
              const tempCelsius = units === 'fahrenheit' ? (weatherData.temperature - 32) * 5/9 : weatherData.temperature;
              return tempCelsius > 30 ? (
                <Chip
                  label="Висока температура"
                  color="warning"
                  size="small"
                  icon={<Thermostat />}
                />
              ) : null;
            })()
          )}
          
          {vegetationData?.health?.stress_level === 'high' && (
            <Chip
              label="Стрес рослинності"
              color="error"
              size="small"
              icon={<Grass />}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsOverview;