import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { 
  WbSunny as SunIcon,
  Air as WindIcon,
  Opacity as HumidityIcon,
  Timeline as PressureIcon
} from '@mui/icons-material';
import { formatTimeFromISO } from '../utils/weatherUtils';
import { useTemperature } from '../../context/TemperatureContext';

function WeatherDetailsCard({ city, currentWeather }) {

  const { formatTemperature, getUnitSymbol } = useTemperature();
  const sunriseTime = formatTimeFromISO(currentWeather.sunrise);
  const sunsetTime = formatTimeFromISO(currentWeather.sunset);
  const sunriseSunsetTime = `${sunriseTime || '6:24'} / ${sunsetTime || '19:58'}`;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Погода сьогодні — {city}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Відчувається як
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
          {formatTemperature(Math.round(currentWeather.temperature - 1))}{getUnitSymbol()}
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SunIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Схід/Захід: {sunriseSunsetTime}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WindIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Вітер: {currentWeather.windSpeed} км/год
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HumidityIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Вологість: {currentWeather.humidity}%
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PressureIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Точка роси: {formatTemperature(Math.round(currentWeather.temperature - 5))}{getUnitSymbol()}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default WeatherDetailsCard;