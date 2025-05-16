import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Alert, Paper, Button } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

import CurrentWeatherCard from '../cards/CurrentWeatherCard';
import AirQualityCard from '../cards/AirQualityCard';
import WeatherDetailsCard from '../cards/WeatherDetailsCard';
import HourlyForecastPreview from '../forecast/hourly/HourlyForecastPreview';
import AgroInfoCard from '../cards/AgroInfoCard';

function TodayForecast({ currentWeather, forecast, city, airQuality, onTabChange, onRefresh }) {
  const [hourlyData, setHourlyData] = useState([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [hourlyError, setHourlyError] = useState('');

  const isWeatherDataValid = 
    currentWeather && 
    typeof currentWeather === 'object' && 
    'temperature' in currentWeather &&
    'description' in currentWeather &&
    'country' in currentWeather;

  const isForecastValid = 
    Array.isArray(forecast) && 
    forecast.length > 0;

  useEffect(() => {
    const fetchHourlyData = async () => {
      if (!city) return;
      
      setHourlyLoading(true);
      setHourlyError('');
      
      try {
        const response = await fetch(`http://localhost:5000/api/weather/hourly/${city}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Помилка отримання погодинного прогнозу');
        }
        
        const data = await response.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const currentHour = new Date().getHours();
        
        const filteredData = data
          .filter(item => {
            const itemDate = new Date(item.time);
            const itemDateWithoutTime = new Date(itemDate);
            itemDateWithoutTime.setHours(0, 0, 0, 0);
            
            return itemDateWithoutTime.getTime() === today.getTime() && 
                  itemDate.getHours() >= currentHour;
          })
          .slice(0, 8);
        
        setHourlyData(filteredData);
      } catch (err) {
        console.error('Помилка:', err);
        setHourlyError(err.message || 'Помилка отримання погодинного прогнозу');
      } finally {
        setHourlyLoading(false);
      }
    };
    
    if (isWeatherDataValid) {
      fetchHourlyData();
    } else {
      setHourlyData([]);
    }
  }, [city, isWeatherDataValid]);

  const handleViewHourlyForecast = () => {
    if (onTabChange) onTabChange(1);
  };

  const handleViewAirQualityDetails = () => {
    if (onTabChange) onTabChange(5);
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
  };

  if (!city) {
    return (
      <Paper 
        sx={{ 
          p: 3, 
          textAlign: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <ErrorOutline sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Місто не вказано
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Будь ласка, введіть назву міста для отримання прогнозу погоди
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!isWeatherDataValid) {
    return (
      <Paper 
        sx={{ 
          p: 3, 
          textAlign: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <ErrorOutline sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Не вдалося знайти місто або отримати дані погоди
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Місто "{city}" не знайдено або виникла помилка при отриманні даних. Перевірте правильність написання назви міста.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Спробувати знову
          </Button>
        </Box>
      </Paper>
    );
  }

  if (!isForecastValid && isWeatherDataValid) {
    return (
      <Grid container spacing={3}>
        {/* Основний блок з поточною погодою */}
        <Grid item xs={12}>
          <CurrentWeatherCard 
            city={city} 
            currentWeather={currentWeather} 
          />
        </Grid>

        {/* Сообщение об ошибке прогноза */}
        <Grid item xs={12}>
          <Alert 
            severity="warning"
            sx={{ mb: 2 }}
          >
            Не вдалося отримати прогноз погоди. Доступна лише поточна інформація про погоду.
          </Alert>
        </Grid>

        {/* Блок с качеством воздуха, если данные есть */}
        {airQuality && (
          <Grid item xs={12} md={6}>
            <AirQualityCard 
              airQuality={airQuality} 
              onViewDetails={handleViewAirQualityDetails}
            />
          </Grid>
        )}

        {/* Блок з детальними даними про погоду */}
        <Grid item xs={12} md={airQuality ? 6 : 12}>
          <WeatherDetailsCard 
            city={city} 
            currentWeather={currentWeather}
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Основний блок з поточною погодою */}
      <Grid item xs={12}>
        <CurrentWeatherCard 
          city={city} 
          currentWeather={currentWeather} 
        />
      </Grid>

      {/* Блок з показником якості повітря */}
      <Grid item xs={12} md={6}>
        <AirQualityCard 
          airQuality={airQuality} 
          onViewDetails={handleViewAirQualityDetails}
        />
      </Grid>

      {/* Блок з детальними даними про погоду */}
      <Grid item xs={12} md={6}>
        <WeatherDetailsCard 
          city={city} 
          currentWeather={currentWeather}
        />
      </Grid>

      {/* Прогноз на сьогодні по годинам */}
      <Grid item xs={12}>
        <HourlyForecastPreview 
          hourlyData={hourlyData}
          hourlyLoading={hourlyLoading}
          hourlyError={hourlyError}
          onViewHourly={handleViewHourlyForecast}
        />
      </Grid>

      {/* Агрометеорологічна інформація */}
      <Grid item xs={12}>
        <AgroInfoCard />
      </Grid>
    </Grid>
  );
}

export default TodayForecast;