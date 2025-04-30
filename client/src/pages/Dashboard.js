import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Tabs,
  Tab
} from '@mui/material';
import TodayForecast from '../components/forecast/TodayForecast';
import HourlyForecast from '../components/forecast/HourlyForecast';
import TenDayForecast from '../components/forecast/TenDayForecast';
import MonthlyForecast from '../components/forecast/MonthlyForecast';
import WeatherRadar from '../components/WeatherRadar';
import AirQualityDetails from '../components/details/AirQualityDetails';

function Dashboard({ city, setLoading }) {
  const [activeTab, setActiveTab] = useState(0);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [error, setError] = useState('');
  
  // Функція для отримання даних про погоду
  const fetchWeatherData = async (cityToFetch = city) => {
    if (!cityToFetch) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Запит на поточну погоду
      const weatherResponse = await fetch(`http://localhost:5000/api/weather/current/${cityToFetch}`);
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        throw new Error(errorData.error || 'Помилка отримання даних про погоду');
      }
      
      const weatherData = await weatherResponse.json();
      
      // Запит на прогноз погоди
      const forecastResponse = await fetch(`http://localhost:5000/api/weather/forecast/${cityToFetch}`);
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json();
        throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
      }
      
      const forecastData = await forecastResponse.json();
      
      const airQualityResponse = await fetch(`http://localhost:5000/api/weather/air-quality/${cityToFetch}`);
    
      let airQualityData = null;
      if (airQualityResponse.ok) {
        airQualityData = await airQualityResponse.json();
      } else {
        console.warn(`Помилка отримання даних про якість повітря: ${airQualityResponse.status} ${airQualityResponse.statusText}`);
        // Можливо запит на дані про якість повітря з Open-Meteo також повертає помилку
        try {
          const errorData = await airQualityResponse.json();
          console.error('Деталі помилки:', errorData);
        } catch (e) {
          console.error('Не вдалося розпарсити відповідь помилки');
        }
      }
      
      setCurrentWeather(weatherData);
      setForecast(forecastData);
      setAirQuality(airQualityData);
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Помилка отримання даних погоди');
    } finally {
      setLoading(false);
    }
  };

  // Завантаження даних при першому рендері або зміні міста
  useEffect(() => {
    fetchWeatherData();
  }, [city]);
  
  // Обробник зміни вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Основні вкладки */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="weather tabs"
          variant="fullWidth"
        >
          <Tab label="Сьогодні" />
          <Tab label="Погодинно" />
          <Tab label="10 Днів" />
          <Tab label="Щомісяця" />
          <Tab label="Радар" />
          <Tab label="Якість повітря" />
        </Tabs>
      </Box>

      {/* Відображення вмісту активної вкладки */}
      {activeTab === 0 && (
          <TodayForecast 
            currentWeather={currentWeather} 
            forecast={forecast} 
            city={city} 
            airQuality={airQuality} 
            onTabChange={setActiveTab}
          />
      )}
      {activeTab === 1 && <HourlyForecast city={city} onTabChange={setActiveTab} />}
      {activeTab === 2 && <TenDayForecast city={city} />}
      {activeTab === 3 && <MonthlyForecast city={city} />}
      {activeTab === 4 && <WeatherRadar city={city} />}
      {activeTab === 5 && <AirQualityDetails city={city} airQuality={airQuality} />}
    </Container>
  );
}

export default Dashboard; 