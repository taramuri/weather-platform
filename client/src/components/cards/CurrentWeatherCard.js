import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import WeatherIcon from '../common/WeatherIcon';
import { getWeatherIcon  } from '../utils/weatherUtils';
import { capitalizeFirstLetter } from '../utils/weatherUtils';

function CurrentWeatherCard({ city, currentWeather }) {
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
            {capitalizeFirstLetter(city)}, {currentWeather.country}
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
          <WeatherIcon condition={getWeatherIcon (currentWeather.description)} size={100} />
          <Typography variant="h1" sx={{ fontWeight: 'bold', ml: 2 }}>
            {Math.round(currentWeather.temperature)}°
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h5">
            {currentWeather.description}
          </Typography>
          <Typography variant="h6">
            Удень {Math.round(currentWeather.maxTemperature)}° • Ніч {Math.round(currentWeather.minTemperature)}°
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default CurrentWeatherCard;