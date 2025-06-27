import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import {
  WbSunny as SunIcon,
  Air as WindIcon,
  Opacity as HumidityIcon,
  Timeline as PressureIcon,
  ArrowForward
} from '@mui/icons-material';
import { formatTimeFromISO, capitalizeFirstLetter } from '../utils/weatherUtils';
import { useTemperature } from '../../context/TemperatureContext';
import WeatherIcon from '../common/WeatherIcon';

function WeatherDetailsCard({ city, currentWeather }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/weather');
  };
  
  if (!currentWeather) {
    return (
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Погода сьогодні — {capitalizeFirstLetter(city)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Дані недоступні
        </Typography>
      </Paper>
    );
  }

  const sunriseTime = formatTimeFromISO(currentWeather.sunrise);
  const sunsetTime = formatTimeFromISO(currentWeather.sunset);
  const sunriseSunsetTime = `${sunriseTime || '6:24'} / ${sunsetTime || '19:58'}`;
  
  function calculateDewPoint(tempC, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return dewPoint;
  }
  
  const dewPoint = (currentWeather.temperature && currentWeather.humidity)
  ? Math.round(calculateDewPoint(currentWeather.temperature, currentWeather.humidity))
  : 0;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Погода сьогодні — {capitalizeFirstLetter(city)}
      </Typography>
     
      {/* Температура з іконкою погоди */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <WeatherIcon 
          condition={currentWeather.description} 
          currentTime={new Date()}
          sunrise={currentWeather.sunrise}
          sunset={currentWeather.sunset}
          size={56}
        />
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {formatTemperature(currentWeather.temperature)}{getUnitSymbol()}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentWeather.description}
          </Typography>
        </Box>
      </Box>
     
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SunIcon sx={{ mr: 1, color: 'orange' }} />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 'bold' }}>Схід/Захід:</Box> {sunriseSunsetTime}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WindIcon sx={{ mr: 1, color: 'lightblue' }} />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 'bold' }}>Вітер:</Box> {currentWeather.windSpeed || 0} км/год
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HumidityIcon sx={{ mr: 1, color: 'blue' }} />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 'bold' }}>Вологість повітря:</Box> {currentWeather.humidity || 0}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PressureIcon sx={{ mr: 1, color: 'green' }} />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 'bold' }}>Точка роси:</Box> {formatTemperature(dewPoint)}{getUnitSymbol()}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={handleViewDetails}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white'
              }
            }}
          >
            Переглянути весь прогноз
          </Button>
        </Box>
    </Paper>
  );
}

export default WeatherDetailsCard;