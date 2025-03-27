import React, { useState, useEffect } from 'react';
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
import WeatherMiniCard from '../components/WeatherMiniCard';
import HourlyForecast from '../components/HourlyForecast';

// Mapping of day names to their correct nominative form
const dayNameMap = {
  'monday': 'Понеділок',
  'tuesday': 'Вівторок',
  'wednesday': 'Середа',
  'thursday': 'Четвер',
  'friday': "П'ятниця",
  'saturday': 'Субота',
  'sunday': 'Неділя'
};

// Function to get correct day name
const getLocalizedDayName = (dateString) => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return dayNameMap[dayName] || dayName;
};

function Dashboard() {
  const [city, setCity] = useState('Київ');
  const [originalCityName, setOriginalCityName] = useState('Київ'); 
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      setCurrentWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Помилка отримання даних погоди');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

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
              {loading ? <CircularProgress size={24} /> : 'Пошук'}
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
                  <Typography variant="h5">{currentWeather.temperature}°C</Typography>
                </Box>
                <Typography>Опис: {currentWeather.description}</Typography>
                <Typography>Вологість: {currentWeather.humidity}%</Typography>
                <Typography>Швидкість вітру: {currentWeather.windSpeed} км/год</Typography>
              </Paper>
            </Grid>

            {/* Додаємо WeatherMiniCard для поточної погоди з точною температурою */}
            <Grid item xs={12} md={6}>
              <WeatherMiniCard 
                date={getLocalizedDayName(new Date().toISOString())}
                minTemp={currentWeather.temperature} // Використовуємо поточну температуру як мінімальну
                maxTemp={currentWeather.temperature} // Використовуємо поточну температуру як максимальну
                condition={getWeatherCondition(currentWeather.description)}
              />
            </Grid>
          </Grid>
        )}

        {/* Прогноз на наступні дні */}
        {forecast.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ my: 2 }}>
              Прогноз на тиждень
            </Typography>
            <Grid container spacing={2}>
              {forecast.slice(0, 7).map((day, index) => (
                <Grid item xs={6} sm={4} md={2} key={index}>
                  <WeatherMiniCard 
                    date={getLocalizedDayName(day.date)}
                    minTemp={Math.round(day.minTemperature)}
                    maxTemp={Math.round(day.maxTemperature)}
                    condition={getWeatherCondition(day.description || 'cloudy')}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
      {city && (
        <HourlyForecast city={city} />
      )}
    </Container>
  );
}

export default Dashboard;