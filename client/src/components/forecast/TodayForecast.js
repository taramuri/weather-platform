// TodayForecast.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography } from '@mui/material';

// Імпортуємо створені компоненти
import CurrentWeatherCard from '../cards/CurrentWeatherCard';
import AirQualityCard from '../cards/AirQualityCard';
import WeatherDetailsCard from '../cards/WeatherDetailsCard';
import HourlyForecastPreview from '../forecast/hourly/HourlyForecastPreview';
import AgroInfoCard from '../cards/AgroInfoCard';

function TodayForecast({ currentWeather, forecast, city, airQuality, onTabChange }) {
  const [hourlyData, setHourlyData] = useState([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [hourlyError, setHourlyError] = useState('');

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
        
        // Фільтруємо тільки дані для сьогоднішнього дня
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Фільтруємо тільки найближчі години
        const currentHour = new Date().getHours();
        
        const filteredData = data
          .filter(item => {
            const itemDate = new Date(item.time);
            const itemDateWithoutTime = new Date(itemDate);
            itemDateWithoutTime.setHours(0, 0, 0, 0);
            
            return itemDateWithoutTime.getTime() === today.getTime() && 
                  itemDate.getHours() >= currentHour;
          })
          .slice(0, 8); // Беремо тільки перші 8 годин
        
        setHourlyData(filteredData);
      } catch (err) {
        console.error('Помилка:', err);
        setHourlyError(err.message || 'Помилка отримання погодинного прогнозу');
      } finally {
        setHourlyLoading(false);
      }
    };
    
    fetchHourlyData();
  }, [city]);

  // Обробники подій для кнопок
  const handleViewHourlyForecast = () => {
    if (onTabChange) onTabChange(1);
  };

  const handleViewAirQualityDetails = () => {
    if (onTabChange) onTabChange(5);
  };

  if (!currentWeather || !forecast || forecast.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Завантаження даних прогнозу...</Typography>
      </Box>
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