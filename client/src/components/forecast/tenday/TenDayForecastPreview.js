import React from 'react';
import { Box, Paper, Typography, Button, Divider } from '@mui/material';
import { Opacity as OpacityIcon, Air as WindIcon } from '@mui/icons-material';
import WeatherIcon from '../../common/WeatherIcon';
import { formatDateToUkrainianFormat } from '../../utils/weatherUtils';
import { useTemperature } from '../../../context/TemperatureContext';

function TenDayForecastPreview({ extendedData, loading, error, onViewTenDay }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();

  const previewData = extendedData ? extendedData.slice(0, 5) : [];

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        📅 Прогноз на найближчі дні
      </Typography>
      
      {loading ? (
        <Typography color="textSecondary">
          Завантаження прогнозу на 10 днів...
        </Typography>
      ) : error ? (
        <Typography color="error">
          {error}
        </Typography>
      ) : previewData.length > 0 ? (
        <>
          {previewData.map((day, index) => {
            const dayData = day.day || day;
            const nightData = day.night;
            
            return (
              <Box key={index}>
                <Box display="flex" alignItems="center" py={1.5}>
                  {/* День тижня */}
                  <Box width="20%" display="flex" flexDirection="column">
                    <Typography variant="body2" fontWeight="bold">
                      {day.dayLabel || (index === 0 ? 'Сьогодні' : formatDateToUkrainianFormat(day.date).split(',')[0])}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {index === 0 ? 'Сьогодні' : formatDateToUkrainianFormat(day.date).split(',')[1]?.trim()}
                    </Typography>
                  </Box>
                          
                  {/* Мін/Макс температура */}
                  <Box width="18%" display="flex" alignItems="center">
                    <Box display="flex" alignItems="baseline">
                      <Typography variant="body2" fontWeight="bold">
                        {formatTemperature(dayData.maxTemperature || dayData.temperature)}{getUnitSymbol()}
                      </Typography>
                      <Typography component="span" color="text.secondary" variant="body2" sx={{ mx: 0.5 }}>
                        /
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTemperature(dayData.minTemperature || nightData?.temperature)}{getUnitSymbol()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Іконка погоди та опис */}
                  <Box width="35%" display="flex" alignItems="center">
                    <Box mr={1}>
                      <WeatherIcon
                        condition={dayData.weatherCode || dayData.description}
                        currentTime={dayData.time}
                        sunrise={dayData.sunrise}
                        sunset={dayData.sunset}
                        size={32}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {dayData.description || 'Невідомо'}
                    </Typography>
                  </Box>
                  
                  {/* Вологість */}
                  <Box width="12%" display="flex" alignItems="center">
                    <OpacityIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {dayData.humidity || '--'}%
                    </Typography>
                  </Box>
                  
                  {/* Вітер */}
                  <Box width="15%" display="flex" alignItems="center">
                    <WindIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {dayData.windDirection || 'Пд'} {dayData.windSpeed || 0} км/год
                    </Typography>
                  </Box>
                </Box>
                
                {index < previewData.length - 1 && <Divider />}
              </Box>
            );
          })}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={onViewTenDay}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              Переглянути 10-денний прогноз
            </Button>
          </Box>
        </>
      ) : (
        <Typography color="textSecondary">
          Немає доступних даних прогнозу на 10 днів
        </Typography>
      )}
    </Paper>
  );
}

export default TenDayForecastPreview;