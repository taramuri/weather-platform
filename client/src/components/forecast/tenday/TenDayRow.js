import React from 'react';
import { Box, Typography, IconButton, Collapse, Divider } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Opacity as OpacityIcon, Air as WindIcon } from '@mui/icons-material';
import WeatherIcon from '../../common/WeatherIcon';
import DayForecastDetails from './DayForecastDetails';
import { formatDateToUkrainianFormat } from '../../utils/weatherUtils';
import { useTemperature } from '../../../context/TemperatureContext';

function TenDayRow({ day, index, isExpanded, onToggle, isLast }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();

  return (
    <>
      <Box display="flex" alignItems="center" p={2}>
        {/* День тижня */}
        <Box width="15%" display="flex" flexDirection="column">
          <Typography variant="body1" fontWeight="bold">
            {day.dayLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {index === 0 ? 'Сьогодні' : formatDateToUkrainianFormat(day.date).split(',')[1]}
          </Typography>
        </Box>
                
        {/* Мін/Макс температура */}
        <Box width="15%" display="flex" alignItems="center">
          <Box display="flex" alignItems="baseline">
            <Typography variant="body1" fontWeight="bold">
              {formatTemperature(day.day.maxTemperature)}{getUnitSymbol()}
            </Typography>
            <Typography component="span" color="text.secondary" variant="body2">
              /
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTemperature(day.day.minTemperature)}{getUnitSymbol()}
            </Typography>
          </Box>
        </Box>
        
        {/* Іконка погоди та опис */}
        <Box width="40%" display="flex" alignItems="center">
          <Box mr={1}>
            <WeatherIcon
              condition={day.day.weatherCode || day.day.description}
              currentTime={day.day.time}
              sunrise={day.day.sunrise}
              sunset={day.day.sunset}
              size={40}
        />
          </Box>
          <Typography variant="body2">
            {day.day.description}
          </Typography>
        </Box>
        
        {/* Вологість */}
        <Box width="10%" display="flex" alignItems="center">
          <OpacityIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
          <Typography variant="body2">
            {day.day.humidity}%
          </Typography>
        </Box>
        
        {/* Вітер */}
        <Box width="15%" display="flex" alignItems="center">
          <WindIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
          <Typography variant="body2">
            {day.day.windDirection} {day.day.windSpeed} км/год
          </Typography>
        </Box>
        
        {/* Кнопка деталей */}
        <Box width="5%" display="flex" justifyContent="flex-end">
          <IconButton
            onClick={() => onToggle(index)}
            aria-expanded={isExpanded}
            aria-label="показати деталі"
          >
            {isExpanded ? <RemoveIcon /> : <AddIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Деталі дня */}
      <Collapse in={isExpanded}>
        <DayForecastDetails dayData={day} />
      </Collapse>
      
      {!isLast && <Divider />}
    </>
  );
}

export default TenDayRow;