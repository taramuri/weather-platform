import React from 'react';
import { Box, Grid } from '@mui/material';
import WeatherDetailCard from '../common/WeatherDetailCard';
import { 
  Thermostat as ThermostatIcon,
  Air as WindIcon,
  WbSunny as SunnyIcon,
  FilterDrama as CloudIcon,
  Opacity as OpacityIcon,
  WaterDrop as RainIcon
} from '@mui/icons-material';
import { useTemperature } from '../../context/TemperatureContext';

function WeatherDetails({ hourData }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();

  return (
    <Box sx={{ 
      p: 1.5, 
      bgcolor: 'rgba(0, 0, 0, 0.02)',
      borderRadius: 1,
      mt: 1,
      mb: 1
    }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<ThermostatIcon color="primary" sx={{ mr: 1 }} />}
            title="Відчувається як"
            value={`${formatTemperature(Math.round(hourData.feelsLike))}${getUnitSymbol()}`}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<WindIcon color="primary" sx={{ mr: 1 }} />}
            title="Вітер"
            value={`${hourData.windDirection} ${Math.round(hourData.windSpeed)} км/год`}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<OpacityIcon color="primary" sx={{ mr: 1 }} />}
            title="Вологість"
            value={`${hourData.humidity}%`}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<SunnyIcon color="warning" sx={{ mr: 1 }} />}
            title="УФ-індекс"
            value={hourData.uvIndex || '1 з 11'}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<CloudIcon color="primary" sx={{ mr: 1 }} />}
            title="Хмарність"
            value={`${hourData.cloudiness || '95'}%`}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <WeatherDetailCard 
            icon={<RainIcon color="primary" sx={{ mr: 1 }} />}
            title="Кількість дощу"
            value={`${hourData.rainAmount || '0'} мм`}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default WeatherDetails;