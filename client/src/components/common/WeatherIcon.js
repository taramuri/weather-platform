// WeatherIcon.jsx
import React from 'react';
import { Box } from '@mui/material';

function WeatherIcon({ condition, size = 64 }) {
  const iconPath = `/icons/${condition}.svg`;
  return (
    <Box component="img" 
      src={iconPath} 
      alt={condition}
      sx={{ 
        width: size, 
        height: size,
        filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.2))'
      }} 
    />
  );
}

export default WeatherIcon;