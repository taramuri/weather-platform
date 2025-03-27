import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import WeatherMiniCard from '../components/WeatherMiniCard';

function WeatherAnalysis() {
  const [city, setCity] = useState('');
  const [originalCityName, setOriginalCityName] = useState(''); 
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeatherData = async () => {
    if (!city) return;
    
    setOriginalCityName(city);
    setLoading(true);
    setError('');
    
    try {
      const weatherResponse = await fetch(`http://localhost:5000/api/weather/current/${city}`);
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        throw new Error(errorData.error || 'Помилка отримання даних про погоду');
      }
      
      const weatherData = await weatherResponse.json();
      
      const forecastResponse = await fetch(`http://localhost:5000/api/weather/forecast/${city}`);
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json();
        throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
      }
      
      const forecastData = await forecastResponse.json();
      
      const modifiedWeatherData = {
        ...weatherData,
        originalCityName: originalCityName 
      };
      
      setCurrentWeather(modifiedWeatherData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Помилка отримання даних погоди');
    } finally {
      setLoading(false);
    }
  };

  // Функція для визначення стану погоди
  const getWeatherCondition = (description) => {
    const sunnyConditions = ['clear', 'sunny', 'sun'];
    const cloudyConditions = ['cloudy', 'cloud', 'overcast'];
    
    const lowerDescription = description.toLowerCase();
    
    if (sunnyConditions.some(condition => lowerDescription.includes(condition))) {
      return 'sunny';
    }
    
    if (cloudyConditions.some(condition => lowerDescription.includes(condition))) {
      return 'cloudy';
    }
    
    return 'cloudy'; // За замовчуванням
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="Введіть місто"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={fetchWeatherData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Отримати погоду'}
            </Button>
          </Paper>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          </Grid>
        )}

        {currentWeather && (
          <Grid item xs={12} container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Поточна погода в {originalCityName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {currentWeather.icon && (
                    <img 
                      src={currentWeather.icon} 
                      alt={currentWeather.description}
                      style={{ marginRight: '10px' }}
                    />
                  )}
                  <Typography variant="h5">{currentWeather.temperature}°C</Typography>
                </Box>
                <Typography>Опис: {currentWeather.description}</Typography>
                <Typography>Вологість: {currentWeather.humidity}%</Typography>
                <Typography>Швидкість вітру: {currentWeather.windSpeed} км/год</Typography>
                {currentWeather.city !== originalCityName && (
                  <Typography variant="caption" color="text.secondary">
                      {currentWeather.city}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Додаємо WeatherMiniCard для поточної погоди з точною температурою */}
            <Grid item xs={12} md={6}>
              <WeatherMiniCard 
                date={new Date().toLocaleDateString('uk-UA', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
                minTemp={currentWeather.temperature} // Використовуємо поточну температуру як мінімальну
                maxTemp={currentWeather.temperature} // Використовуємо поточну температуру як максимальну
                condition={getWeatherCondition(currentWeather.description)}
              />
            </Grid>
          </Grid>
        )}

        {forecast.length > 0 && (
          <Grid item xs={12} container spacing={2}>
            {/* Прогноз погоди у вигляді міні-карток з точними мінімальними та максимальними температурами */}
            {forecast.slice(0, 5).map((dailyForecast, index) => (
              <Grid item key={index} xs={12} sm={4} md={2.4}>
                <WeatherMiniCard 
                  date={new Date(dailyForecast.date).toLocaleDateString('uk-UA', { 
                    weekday: 'long', 
                    day: 'numeric' 
                  })}
                  minTemp={Math.round(dailyForecast.minTemperature)} // Точна мінімальна температура
                  maxTemp={Math.round(dailyForecast.maxTemperature)} // Точна максимальна температура
                  condition={getWeatherCondition(dailyForecast.description || 'cloudy')}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {forecast.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Прогноз погоди для {originalCityName}
              </Typography>
              <Box sx={{ width: '100%', height: 300, overflowX: 'auto' }}>
                <LineChart
                  width={800}
                  height={300}
                  data={forecast}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      if (date instanceof Date) {
                        return date.toLocaleDateString();
                      }
                      return new Date(date).toLocaleDateString();
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => {
                      if (date instanceof Date) {
                        return date.toLocaleDateString();
                      }
                      return new Date(date).toLocaleDateString();
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#8884d8" 
                    name="Температура"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#82ca9d" 
                    name="Вологість"
                  />
                </LineChart>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default WeatherAnalysis;