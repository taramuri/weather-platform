import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const WEATHER_TABS = {
  TODAY: 0,
  HOURLY: 1,
  TEN_DAY: 2,
  RADAR: 3,
  AIR_QUALITY: 4
};

export const useWeatherNavigation = () => {
  const navigate = useNavigate();

  const navigateToWeather = useCallback((city, tab = 0, additionalParams = {}) => {
    const searchParams = new URLSearchParams();
    
    if (city) {
      searchParams.set('city', city);
    }
    
    if (tab !== 0) {
      searchParams.set('tab', tab.toString());
    }
    
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    navigate(`/weather${queryString ? `?${queryString}` : ''}`);
  }, [navigate]);

  const navigateToHourlyForecast = useCallback((city) => {
    navigateToWeather(city, WEATHER_TABS.HOURLY);
  }, [navigateToWeather]);

  const navigateToTenDayForecast = useCallback((city) => {
    navigateToWeather(city, WEATHER_TABS.TEN_DAY);
  }, [navigateToWeather]);

  const navigateToRadar = useCallback((city) => {
    navigateToWeather(city, WEATHER_TABS.RADAR);
  }, [navigateToWeather]);

  const navigateToAirQuality = useCallback((city) => {
    navigateToWeather(city, WEATHER_TABS.AIR_QUALITY);
  }, [navigateToWeather]);

  return {
    navigateToWeather,
    navigateToHourlyForecast,
    navigateToTenDayForecast,
    navigateToRadar,
    navigateToAirQuality
  };
};

export const createWeatherUrl = (city, tab = 0, additionalParams = {}) => {
  const searchParams = new URLSearchParams();
  
  if (city) {
    searchParams.set('city', city);
  }
  
  if (tab !== 0) {
    searchParams.set('tab', tab.toString());
  }
  
  Object.entries(additionalParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return `/weather${queryString ? `?${queryString}` : ''}`;
};