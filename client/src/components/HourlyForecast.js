import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box 
} from '@mui/material';
import { 
  WbSunny as SunnyIcon, 
  Cloud as CloudyIcon,
  WbCloudy as PartlyCloudyIcon,
  Thunderstorm as ThunderstormIcon,
  AcUnit as SnowIcon,
  BeachAccess as RainIcon,
  WaterDrop as DrizzleIcon,
  Opacity as HumidIcon,
  FilterDrama as FogIcon
} from '@mui/icons-material';

// Enhanced weather icon mapping with more comprehensive keywords
const weatherIconMap = {
  'sunny': {
    keywords: ['clear', 'sunny', 'sun', 'fair', 'bright', 'ясно', 'сонячно'],
    icon: SunnyIcon,
    label: 'Сонячно'
  },
  'partly_cloudy': {
    keywords: ['partly cloudy', 'few clouds', 'mostly sunny', 'some clouds', 'невелика хмарність'],
    icon: PartlyCloudyIcon,
    label: 'Мінлива хмарність'
  },
  'cloudy': {
    keywords: ['cloudy', 'cloud', 'overcast', 'grey', 'mostly cloudy', 'covered', 'хмарно', 'хмарність'],
    icon: CloudyIcon,
    label: 'Хмарно'
  },
  'thunderstorm': {
    keywords: ['thunder', 'thunderstorm', 'lightning', 'storm', 'electric', 'гроза', 'блискавка'],
    icon: ThunderstormIcon,
    label: 'Гроза'
  },
  'snow': {
    keywords: ['snow', 'snowy', 'sleet', 'freezing', 'wintery', 'blizzard', 'сніг', 'снігопад'],
    icon: SnowIcon,
    label: 'Сніг'
  },
  'rain': {
    keywords: ['rain', 'rainy', 'shower', 'precipitation', 'downpour', 'rainfall', 'дощ', 'місцями дощ'],
    icon: RainIcon,
    label: 'Дощ'
  },
  'drizzle': {
    keywords: ['drizzle', 'light rain', 'sprinkle', 'mizzle', 'невеликий дощ'],
    icon: DrizzleIcon,
    label: 'Невеликий дощ'
  },
  'fog': {
    keywords: ['mist', 'fog', 'haze', 'misty', 'foggy', 'туман', 'мряка'],
    icon: FogIcon,
    label: 'Туман'
  }
};

function getWeatherIcon(description) {
  if (!description) return { icon: CloudyIcon, label: 'Хмарно' };
  
  const lowerDescription = description.toLowerCase();
 
  for (const [type, config] of Object.entries(weatherIconMap)) {
    if (lowerDescription === type || 
        config.keywords.some(keyword => lowerDescription.includes(keyword))) {
      return { icon: config.icon, label: config.label };
    }
  }
 
  return { icon: CloudyIcon, label: 'Хмарно' };
}

function HourlyForecast({ city, selectedDay }) {
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHourlyForecast = async () => {
    if (!city) return;
  
    setLoading(true);
    setError('');
  
    try {
      const response = await fetch(`http://localhost:5000/api/weather/hourly/${city}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка отримання погодинного прогнозу');
      }
      
      const data = await response.json();
      
      // Змініть логіку фільтрації
      const filteredHourlyData = data.filter(hour => {
        const hourDate = new Date(hour.time);
        const selectedDate = new Date(selectedDay.date);
        
        return (
          hourDate.getFullYear() === selectedDate.getFullYear() &&
          hourDate.getMonth() === selectedDate.getMonth() &&
          hourDate.getDate() === selectedDate.getDate()
        );
      });
  
      setHourlyForecast(filteredHourlyData);
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Помилка отримання погодинного прогнозу');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHourlyForecast();
  }, [city, selectedDay]);

  if (loading) return <Typography>Завантаження...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Grid item xs={12} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Погодинний прогноз
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        overflowX: 'auto', 
        gap: 2, 
        pb: 2 
      }}>
        {hourlyForecast.map((hour, index) => {
          const { icon: HourIcon, label } = getWeatherIcon(hour.description);
          const time = new Date(hour.time).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

          return (
            <Paper 
              key={index} 
              sx={{ 
                minWidth: 120, 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
              }}
            >
              <Typography variant="subtitle2">{time}</Typography>
              <HourIcon color="action" sx={{ my: 1 }} />
    <Typography>{Math.round(hour.temperature)}°C</Typography>
    <Typography variant="caption">{label}</Typography>
            </Paper>
          );
        })}
      </Box>
    </Grid>
  );
}

export default HourlyForecast;