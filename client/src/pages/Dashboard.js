import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import WeatherMiniCard from '../components/WeatherMiniCard';
import HourlyForecast from '../components/HourlyForecast';

const dayNameMap = {
  'monday': 'Понеділок',
  'tuesday': 'Вівторок',
  'wednesday': 'Середа',
  'thursday': 'Четвер',
  'friday': "П'ятниця",
  'saturday': 'Субота',
  'sunday': 'Неділя'
};

const getLocalizedDayName = (dateString) => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return dayNameMap[dayName] || dayName;
};

const getWeatherCondition = (description) => {
  if (!description) return 'cloudy';

  const lowerDescription = description.toLowerCase();
  
  const conditions = {
    sunny: ['clear', 'sunny', 'sun'],
    cloudy: ['cloudy', 'cloud', 'overcast'],
    rainy: ['rain', 'rainy', 'shower', 'drizzle'],
    thunderstorm: ['thunder', 'thunderstorm', 'lightning'],
    snow: ['snow', 'snowy', 'sleet'],
    partly_cloudy: ['partly cloudy', 'few clouds']
  };

  for (const [condition, keywords] of Object.entries(conditions)) {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {
      return condition;
    }
  }
  
  return 'cloudy';
};

function Dashboard() {
  const [city, setCity] = useState('Київ');
  const [inputCity, setInputCity] = useState('Київ');
  const [originalCityName, setOriginalCityName] = useState('Київ'); 
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`http://localhost:5000/api/weather/location?lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data.city) {
              setCity(data.city);
              setInputCity(data.city);
              await fetchWeatherData(data.city);
            }
          } catch (error) {
            console.error('Помилка отримання міста:', error);
            setError('Не вдалося визначити місто за поточним місцерозташуванням');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Помилка геолокації:', error);
          setError('Не вдалося отримати геолокацію');
          setLoading(false);
        }
      );
    } else {
      setError('Геолокація не підтримується вашим браузером');
    }
  };

  const fetchWeatherData = async (cityToFetch = city) => {
    if (!cityToFetch) return;
    
    setOriginalCityName(cityToFetch);
    setLoading(true);
    setError('');
    
    try {
      const weatherResponse = await fetch(`http://localhost:5000/api/weather/current/${cityToFetch}`);
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        throw new Error(errorData.error || 'Помилка отримання даних про погоду');
      }
      
      const weatherData = await weatherResponse.json();
      
      const forecastResponse = await fetch(`http://localhost:5000/api/weather/forecast/${cityToFetch}`);
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json();
        throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
      }
      
      const forecastData = await forecastResponse.json();
      
      setCurrentWeather(weatherData);
      setForecast(forecastData);
      
      // По замовчуванню встановлюємо перший день
      setSelectedDay(forecastData[0]);
      
      // Оновлюємо місто, якщо воно було змінене
      setCity(cityToFetch);
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
          <Paper sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}>
            <Tooltip title="Визначити поточне місце">
              <IconButton 
                color="primary" 
                onClick={detectLocation}
                disabled={loading}
                sx={{ 
                  mr: 1, 
                  flexShrink: 0 
                }}
              >
                <LocationIcon />
              </IconButton>
            </Tooltip>
            <TextField
              label="Введіть місто"
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
              fullWidth
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={() => {
                setCity(inputCity);
                fetchWeatherData(inputCity);
              }}
              disabled={loading}
              sx={{ flexShrink: 0 }}
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

        {/* Прогноз на тиждень */}
        {forecast.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ my: 2 }}>
              Прогноз на тиждень
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: 2, 
              pb: 2 
            }}>
              {forecast.slice(0, 7).map((day, index) => (
                <WeatherMiniCard 
                  key={index}
                  date={getLocalizedDayName(day.date)}
                  minTemp={Math.round(day.minTemperature)}
                  maxTemp={Math.round(day.maxTemperature)}
                  condition={getWeatherCondition(day.description)}
                  onClick={() => setSelectedDay(day)}
                  selected={selectedDay === day}
                />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Погодинний прогноз для обраного дня */}
      {city && selectedDay && (
        <HourlyForecast 
          city={city} 
          selectedDay={selectedDay} 
        />
      )}
    </Container>
  );
}

export default Dashboard;