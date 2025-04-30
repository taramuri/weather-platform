import React from 'react';
import { Box, Paper, Typography, Grid, Button, Divider } from '@mui/material';
import WeatherIcon from '../../common/WeatherIcon';
import { getWeatherIcon  } from '../../utils/weatherUtils';

function HourlyForecastPreview({ hourlyData, hourlyLoading, hourlyError, onViewHourly }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Прогноз на сьогодні по годинам
      </Typography>
      <Divider sx={{ mb: 2 }} />
  
      {hourlyLoading ? (
        <Typography>Завантаження погодинного прогнозу...</Typography>
      ) : hourlyError ? (
        <Typography color="error">{hourlyError}</Typography>
      ) : hourlyData.length > 0 ? (
        <Grid container spacing={2}>
          {hourlyData.map((hour, i) => {
            const hourTime = new Date(hour.time);
            
            return (
              <Grid item xs={6} sm={3} md={1.5} key={i}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: i === 0 ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(25, 118, 210, 0.3)' : 'none'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {hourTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  
                  <WeatherIcon 
                    condition={hour.icon || getWeatherIcon (hour.description)} 
                    size={40} 
                  />
                  
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {Math.round(hour.temperature)}°
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography>Немає доступних даних погодинного прогнозу</Typography>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={onViewHourly}
          sx={{ borderRadius: 4 }}
        >
          Переглянути погодинний прогноз
        </Button>
      </Box>
    </Paper>
  );
}

export default HourlyForecastPreview;