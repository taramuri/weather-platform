import React from 'react';
import { Box, Paper, Typography, Skeleton, Alert } from '@mui/material';
import WeatherIcon from '../common/WeatherIcon';
import { getWeatherIcon, capitalizeFirstLetter } from '../utils/weatherUtils';
import { useTemperature } from '../../context/TemperatureContext';

function CurrentWeatherCard({ city, currentWeather }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();

  if (!currentWeather) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          backgroundImage: 'linear-gradient(to bottom, #614385, #516395)',
          color: 'white'
        }}
      >
        <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
          Місто не знайдено. Перевірте правильність написання або виберіть інше місто.
        </Alert>
        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
          Введіть назву міста, щоб отримати актуальні дані про погоду
        </Typography>
        <Skeleton variant="rectangular" height={120} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      </Paper>
    );
  }

  const hasValidData = 
    city && 
    currentWeather.country && 
    currentWeather.temperature !== undefined && 
    currentWeather.description;

  if (!hasValidData) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          backgroundImage: 'linear-gradient(to bottom, #614385, #516395)',
          color: 'white'
        }}
      >
        <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
          Не вдалося отримати дані погоди для вказаного міста
        </Alert>
        <Typography variant="body1" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
          Спробуйте ввести інше місто або повторіть спробу пізніше
        </Typography>
      </Paper>
    );
  }

  const cityName = capitalizeFirstLetter(city);
  const country = currentWeather.country || 'Україна';
  const description = currentWeather.description || 'Невідомо';
  const temperature = currentWeather.temperature ?? 0;
  const maxTemperature = currentWeather.maxTemperature ?? 0;
  const minTemperature = currentWeather.minTemperature ?? 0;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        backgroundImage: 'linear-gradient(to bottom, #614385, #516395)',
        color: 'white'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            {cityName}, {country}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Станом на {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: 4 
        }}>
          <WeatherIcon condition={getWeatherIcon(description)} size={100} />
          <Typography variant="h1" sx={{ fontWeight: 'bold', ml: 2 }}>
            {formatTemperature(temperature)}{getUnitSymbol()}
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5">
            {description}
          </Typography>
          <Typography variant="h6">
            Удень {formatTemperature(maxTemperature)}{getUnitSymbol()} • Ніч {formatTemperature(minTemperature)}{getUnitSymbol()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default CurrentWeatherCard;