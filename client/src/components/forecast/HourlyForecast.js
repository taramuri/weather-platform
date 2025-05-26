import React, { useState, useEffect, useCallback } from 'react';
import { Container, Paper, Typography} from '@mui/material';
import DailyTabs from './hourly/DailyTabs';
import HourlyForecastContent from './hourly/HourlyForecastContent';
import { getWeatherIcon, capitalizeFirstLetter, formatDateToUkrainianFormat } from '../utils/weatherUtils';

function HourlyForecast({ 
  city, 
  onTabChange,
  hourlyForecastData = null, 
  loading: externalLoading = false 
}) {
  const [localHourlyForecast, setLocalHourlyForecast] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedHour, setExpandedHour] = useState(null);

  const shouldFetchData = !hourlyForecastData && city;
  const rawHourlyData = hourlyForecastData || localHourlyForecast;
  const loading = externalLoading || localLoading;

  const hourlyForecast = Array.isArray(rawHourlyData) ? processHourlyData(rawHourlyData) : [];

  const fetchHourlyForecast = useCallback(async () => {
    if (!city) return;

    setLocalLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/weather/hourly/${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка отримання погодинного прогнозу');
      }
      
      const data = await response.json();
      console.log('HourlyForecast: Отримані дані:', data);
      setLocalHourlyForecast(data);
    } catch (err) {
      console.error('HourlyForecast: Помилка:', err);
      setError(err.message || 'Помилка отримання погодинного прогнозу');
    } finally {
      setLocalLoading(false);
    }
  }, [city]); 

  useEffect(() => {
    if (shouldFetchData) {
      console.log('HourlyForecast: Fetching data for city:', city);
      fetchHourlyForecast();
    } else if (hourlyForecastData) {
      console.log('HourlyForecast: Using external data:', hourlyForecastData);
      setError(''); 
    }
  }, [city, shouldFetchData, hourlyForecastData, fetchHourlyForecast]); 

  function processHourlyData(data) {
    if (!Array.isArray(data)) return [];

    const organizedData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    
    data.forEach(hourData => {
      const hourDate = new Date(hourData.time);
      hourDate.setHours(hourDate.getHours());
      
      const dateWithoutTime = new Date(hourDate);
      dateWithoutTime.setHours(0, 0, 0, 0);
      
      let day;
      if (dateWithoutTime.getTime() === today.getTime()) {
        day = 0; 
      } else if (dateWithoutTime.getTime() === tomorrow.getTime()) {
        day = 1;
      } else if (dateWithoutTime.getTime() === afterTomorrow.getTime()) {
        day = 2; 
      } else {
        return; 
      }
      
      if (day === 0) {
        const currentHour = new Date().getHours();
        if (hourDate.getHours() < currentHour) return;
      }
      
      organizedData.push({
        date: hourDate,
        day: day,
        hour: hourDate.getHours(),
        temperature: hourData.temperature,
        feelsLike: hourData.temperature - Math.random() * 3,
        description: hourData.description,
        humidity: hourData.humidity,
        windSpeed: hourData.windSpeed,
        windDirection: hourData.windDirection || 'Пд',
        precipProbability: hourData.precipProbability || 0,
        condition: hourData.icon || getWeatherIcon(hourData.description),
        uvIndex: hourData.uvIndex || '1 з 11',
        cloudiness: hourData.cloudiness || 95,
        rainAmount: hourData.rainAmount || 0
      });
    });
    
    return organizedData;
  }
  
  const toggleHourDetails = (hourIndex) => {
    if (expandedHour === hourIndex) {
      setExpandedHour(null);
    } else {
      setExpandedHour(hourIndex);
    }
  };
  
  const filteredHourlyData = hourlyForecast.filter(forecast => forecast.day === selectedDay);
  
  const handleDayChange = (event, newValue) => {
    setSelectedDay(newValue);
    setExpandedHour(null); 
  };
  
  const handleGoToTenDayForecast = () => {
    if (onTabChange) {
      onTabChange(2); 
    }
  };

  const getTabs = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    
    return [today, tomorrow, afterTomorrow].map((date, index) => {
      let label = '';
      if (index === 0) {
        label = 'Сьогодні';
      } else if (index === 1) {
        label = 'Завтра';
      } else {
        label = capitalizeFirstLetter(formatDateToUkrainianFormat(date));
      }
      return { date, label };
    });
  };

  const tabsData = getTabs();
    
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Погодинний прогноз погоди - {capitalizeFirstLetter(city)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Станом на {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        
        {hourlyForecastData && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            📊 Дані отримані з централізованого Dashboard
          </Typography>
        )}
    
        <DailyTabs selectedDay={selectedDay} onDayChange={handleDayChange} />
        
        {loading ? (
          <Typography>Завантаження даних прогнозу...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : filteredHourlyData.length > 0 ? (
          <HourlyForecastContent 
            filteredHourlyData={filteredHourlyData}
            selectedDay={selectedDay}
            tabsData={tabsData}
            expandedHour={expandedHour}
            toggleHourDetails={toggleHourDetails}
            handleGoToTenDayForecast={handleGoToTenDayForecast}
          />
        ) : (
          <Typography>Немає доступних даних для відображення</Typography>
        )}
      </Paper>
    </Container>
  );
}

export default HourlyForecast;