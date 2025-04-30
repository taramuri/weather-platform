import React from 'react';
import { Box } from '@mui/material';
import { getWeatherIcon, isNightTime } from '../utils/weatherUtils';

function WeatherIcon({ condition, isNight = false, currentTime = null, sunrise = null, sunset = null, size = 64, sx = {} }) {
  const isNightTimeCalculated = currentTime && sunrise && sunset 
    ? isNightTime(currentTime, sunrise, sunset) 
    : isNight;
    
  const iconName = getWeatherIcon(condition, isNightTimeCalculated, currentTime, sunrise, sunset);
  const iconPath = `/icons/conditions/${iconName}.svg`;
  
  return (
    <Box
      component="img"
      src={iconPath}
      alt={typeof condition === 'string' ? condition : `Weather code: ${condition}`}
      sx={{ width: size, height: size, ...sx }}
    />
  );
}

export default WeatherIcon;