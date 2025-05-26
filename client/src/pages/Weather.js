import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import TodayForecast from '../components/forecast/TodayForecast';
import HourlyForecast from '../components/forecast/HourlyForecast';
import TenDayForecast from '../components/forecast/TenDayForecast';
import AirQualityDetails from '../components/details/AirQualityDetails';
import WeatherRadar from '../components/WeatherRadar';

function Weather({ city, setLoading }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const cityParam = searchParams.get('city');
    
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (tabIndex >= 0 && tabIndex <= 4) {
        setActiveTab(tabIndex);
      }
    }
    
    if (cityParam && cityParam !== city) {
      console.log('City from URL:', cityParam);
    }
  }, [searchParams, city]);
  
  const fetchWeatherData = useCallback(async (cityToFetch = city) => {
    if (!cityToFetch) return;
    
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
      
      const airQualityResponse = await fetch(`http://localhost:5000/api/weather/air-quality/${cityToFetch}`);
    
      let airQualityData = null;
      if (airQualityResponse.ok) {
        airQualityData = await airQualityResponse.json();
      } else {
        console.warn(`Помилка отримання даних про якість повітря: ${airQualityResponse.status} ${airQualityResponse.statusText}`);
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
  }, [city, setLoading]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]); 
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newValue.toString());
    if (city) {
      newSearchParams.set('city', city);
    }
    setSearchParams(newSearchParams);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Відображення помилки, якщо вона є */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
      {activeTab === 3 && <WeatherRadar city={city} />}
      {activeTab === 4 && <AirQualityDetails city={city} airQuality={airQuality} />}
    </Container>
  );
}

export default Weather;