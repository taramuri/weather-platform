import React from 'react';
import { Box, Typography } from '@mui/material';
import WeatherIcon from '../../common/WeatherIcon';
import { useTemperature } from '../../../context/TemperatureContext';

function WeatherSummary({ data, title }) {
  const isNightTime = title.toLowerCase().includes('ніч');
  const { formatTemperature, getUnitSymbol } = useTemperature();

  return (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>

      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h2" fontWeight="bold">
          {formatTemperature(data.temperature)}{getUnitSymbol()}
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
    </>
  );
}

export default WeatherSummary;