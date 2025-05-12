import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography} from '@mui/material';
import DailyTabs from './hourly/DailyTabs';
import HourlyForecastContent from './hourly/HourlyForecastContent';
import { getWeatherIcon, capitalizeFirstLetter, formatDateToUkrainianFormat } from '../utils/weatherUtils';

function HourlyForecast({ city, onTabChange }) {
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedHour, setExpandedHour] = useState(null);

  useEffect(() => {
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
        
        // Організовуємо дані по днях
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
            day = 0; // сьогодні
          } else if (dateWithoutTime.getTime() === tomorrow.getTime()) {
            day = 1; // завтра
          } else if (dateWithoutTime.getTime() === afterTomorrow.getTime()) {
            day = 2; // післязавтра
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
            feelsLike: hourData.temperature - Math.random(1,3),
            description: hourData.description,
            humidity: hourData.humidity,
            windSpeed: hourData.windSpeed,
            windDirection: hourData.windDirection || 'Пд', // Використовуємо реальні дані або значення за замовчуванням
            precipProbability: hourData.precipProbability || 0, // Використовуємо реальні дані або значення за замовчуванням
            condition: hourData.icon || getWeatherIcon(hourData.description),
            uvIndex: hourData.uvIndex || '1 з 11', // Додаткова інформація
            cloudiness: hourData.cloudiness || 95, // Додаткова інформація
            rainAmount: hourData.rainAmount || 0 // Додаткова інформація
          });
        });
        
        setHourlyForecast(organizedData);
      } catch (err) {
        console.error('Помилка:', err);
        setError(err.message || 'Помилка отримання погодинного прогнозу');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHourlyForecast();
  }, [city]);
  
  // Функція для розгортання/згортання детальної інформації
  const toggleHourDetails = (hourIndex) => {
    if (expandedHour === hourIndex) {
      setExpandedHour(null);
    } else {
      setExpandedHour(hourIndex);
    }
  };
  
  // Фільтрація погодинних даних за обраним днем
  const filteredHourlyData = hourlyForecast.filter(forecast => forecast.day === selectedDay);
  
  const handleDayChange = (event, newValue) => {
    setSelectedDay(newValue);
    setExpandedHour(null); // Скидаємо розгорнуті деталі при зміні дня
  };
  
  // Перехід на вкладку "День 10"
  const handleGoToTenDayForecast = () => {
    if (onTabChange) {
      onTabChange(2); 
    }
  };

  // Отримання унікальних дат для вкладок
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
        
        {/* Вкладки для вибору дня */}
        <DailyTabs selectedDay={selectedDay} onDayChange={handleDayChange} />
        
        {/* Відображення погодинного прогнозу */}
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