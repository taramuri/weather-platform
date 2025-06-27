import React from 'react';
import { Box, Grid, Typography, Divider, Paper } from '@mui/material';
import { 
  Opacity as OpacityIcon, 
  Air as WindIcon,
  WbSunny as UVIcon,
  WbTwilight as SunriseIcon
} from '@mui/icons-material';
import TenDayWeatherDetail from './TenDayWeatherDetail';
import WeatherSummary from './WeatherSummary';
import MoonPhaseDisplay from './MoonPhaseDisplay';

function DayForecastDetails({ dayData }) {
  const formatTime = (isoString) => {
    if (!isoString) return 'Н/Д';
    try {
      return new Date(isoString).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Помилка форматування часу:", e);
      return 'Н/Д';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
      <Grid container spacing={2}>
        {/* День */}
        <Grid item xs={12} md={6}>
          <Box>
            <WeatherSummary 
              data={dayData.day}
              title="День"
            />

            <Divider sx={{ my: 2 }} />

            <TenDayWeatherDetail icon={<OpacityIcon />} label="Вологість" value={`${dayData.day.humidity}%`} />
            
            <Divider sx={{ my: 2 }} />

            <TenDayWeatherDetail icon={<WindIcon />} label="Вітер" value={`${dayData.day.windDirection} ${dayData.day.windSpeed} км/год`} />
            <TenDayWeatherDetail icon={<UVIcon />} label="УФ-індекс" value={dayData.day.uvIndex} />

            <Divider sx={{ my: 2 }} />

            <TenDayWeatherDetail icon={<SunriseIcon />} label="Схід сонця" value={formatTime(dayData.day.sunrise)} />
            <TenDayWeatherDetail icon={<SunriseIcon sx={{ transform: 'rotate(180deg)' }} />} label="Захід сонця" value={formatTime(dayData.day.sunset)} />
          </Box>
        </Grid>

        {/* Ніч */}
        <Grid item xs={12} md={6}>
          <Box>
            <WeatherSummary 
              data={dayData.night}
              title="Ніч"
            />

            <Divider sx={{ my: 2 }} />

            <TenDayWeatherDetail icon={<OpacityIcon />} label="Вологість" value={`${dayData.night.humidity}%`} />
            
            <Divider sx={{ my: 2 }} />

            <TenDayWeatherDetail icon={<WindIcon />} label="Вітер" value={`${dayData.night.windDirection} ${dayData.night.windSpeed} км/год`} />
            <TenDayWeatherDetail icon={<UVIcon />} label="УФ-індекс" value={dayData.night.uvIndex} />

            <Divider sx={{ my: 2 }} />
            
            {/* Moon phase display */}
            {dayData.night.moonPhase && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="medium">Фаза місяця</Typography>
                <MoonPhaseDisplay phase={dayData.night.moonPhase} />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default DayForecastDetails;  