import React from 'react';
import { Box, Typography, IconButton, Collapse, Divider } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Air as WindIcon, WaterDrop as WaterDropIcon, Cloud as CloudIcon } from '@mui/icons-material';
import WeatherIcon from '../../common/WeatherIcon';
import WeatherDetails from '../../details/WeatherDetails';
import { useTemperature } from '../../../context/TemperatureContext';

function HourRow({ hourData, index, isLast, isExpanded, onToggle }) {
  const { formatTemperature, getUnitSymbol } = useTemperature();

  return (
    <React.Fragment>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        py: 2,
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.03)'
        }
      }}>
        {/* Година */}
        <Box sx={{ width: '10%', textAlign: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            {hourData.hour}:00
          </Typography>
        </Box>
        
        {/* Іконка погоди та опис */}
        <Box sx={{ width: '20%', display: 'flex', alignItems: 'center' }}>
        <WeatherIcon 
          condition={hourData.weatherCode || hourData.description} 
          currentTime={hourData.time}
          sunrise={hourData.sunrise}
          sunset={hourData.sunset}
          size={40}
        />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {hourData.description}
          </Typography>
        </Box>
        
        {/* Температура */}
        <Box sx={{ width: '10%', textAlign: 'center' }}>
          <Typography variant="body1" fontWeight="bold">
            {formatTemperature(Math.round(hourData.temperature))}{getUnitSymbol()}
          </Typography>
        </Box>
        
        {/* Відчувається як */}
        <Box sx={{ width: '15%', display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">
            Відчувається як {formatTemperature(Math.round(hourData.feelsLike))}{getUnitSymbol()}
          </Typography>
        </Box>
        
        {/* Вірогідність опадів */}
        <Box sx={{ width: '15%', display: 'flex', alignItems: 'center' }}>
          <CloudIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
          <Typography variant="body2">
            {hourData.precipProbability}%
          </Typography>
        </Box>
        
        {/* Вітер */}
        <Box sx={{ width: '15%', display: 'flex', alignItems: 'center' }}>
          <WindIcon sx={{ fontSize: 18, mr: 0.5 }} />
          <Typography variant="body2">
            {hourData.windDirection} {Math.round(hourData.windSpeed)} км/год
          </Typography>
        </Box>
        
        {/* Вологість */}
        <Box sx={{ width: '10%', display: 'flex', alignItems: 'center' }}>
          <WaterDropIcon sx={{ fontSize: 18, mr: 0.5, color: 'primary.main' }} />
          <Typography variant="body2">
            {hourData.humidity}%
          </Typography>
        </Box>
        
        {/* Кнопка деталей */}
        <Box sx={{ width: '5%', textAlign: 'right' }}>
          <IconButton 
            size="small" 
            onClick={() => onToggle(index)}
            aria-expanded={isExpanded}
            aria-label="показати деталі"
          >
            {isExpanded ? <RemoveIcon /> : <AddIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Розгорнуті деталі */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <WeatherDetails hourData={hourData} />
      </Collapse>
      
      {!isLast && <Divider />}
    </React.Fragment>
  );
}

export default HourRow;