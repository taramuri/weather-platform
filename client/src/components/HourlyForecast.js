import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';

// Функція для форматування часу
const formatTime = (date) => {
  return date.toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Функція для визначення іконки погоди
const getWeatherIcon = (description) => {
  const lowerDescription = description.toLowerCase();
  
  if (lowerDescription.includes('sun') || lowerDescription.includes('clear')) {
    return '☀️';
  }
  
  if (lowerDescription.includes('cloud')) {
    return '☁️';
  }
  
  if (lowerDescription.includes('rain')) {
    return '🌧️';
  }
  
  if (lowerDescription.includes('snow')) {
    return '❄️';
  }
  
  return '🌤️'; // За замовчуванням
};

function HourlyForecast({ city }) {
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchHourlyForecast = async () => {
      if (!city) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5000/api/weather/hourly/${city}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Помилка отримання погодинного прогнозу');
        }
        
        const data = await response.json();
        setHourlyForecast(data);
      } catch (err) {
        console.error('Помилка:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHourlyForecast();
  }, [city]);

  if (loading) return <Typography>Завантаження...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!hourlyForecast.length) return null;

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Погодинний прогноз
      </Typography>
      <Grid 
        container 
        spacing={isSmallScreen ? 1 : 2} 
        justifyContent="center"
      >
        {hourlyForecast.map((hourData, index) => (
          <Grid item xs={4} sm={3} md={2} key={index}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 1, 
                textAlign: 'center', 
                bgcolor: 'background.default' 
              }}
            >
              <Typography variant="subtitle2">
                {formatTime(new Date(hourData.time))}
              </Typography>
              <Box sx={{ fontSize: '2rem', my: 1 }}>
                {getWeatherIcon(hourData.description)}
              </Box>
              <Typography variant="body2">
                {Math.round(hourData.temperature)}°C
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hourData.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default HourlyForecast;