import React from 'react';
import { Box, Typography } from '@mui/material';
import WeatherIcon from '../../common/WeatherIcon';

function WeatherSummary({ data, title }) {
  const isNightTime = title.toLowerCase().includes('ніч');
  
  return (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>

      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h2" fontWeight="bold">
          {data.temperature}°
        </Typography>
        <WeatherIcon
            condition={data.weatherCode || data.description}
            isNight={isNightTime}
            sx={{ width: 60, height: 60, ml: 2 }}
        />
      </Box>

      <Typography variant="body1" mb={1}>
        {data.description}. {title.includes('День') ? `Максимум ${data.maxTemperature}°C.` : `Мінімум ${data.minTemperature}°C.`}
      </Typography>
      <Typography variant="body1" mb={3}>
        Вітер {data.windDirection} і змінний.
      </Typography>
    </>
  );
}

export default WeatherSummary;