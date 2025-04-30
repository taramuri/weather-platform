import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import HourRow from './HourRow';
import { capitalizeFirstLetter, formatDateToUkrainianFormat } from '../../utils/weatherUtils';

function HourlyForecastContent({ 
  filteredHourlyData, 
  selectedDay, 
  tabsData, 
  expandedHour, 
  toggleHourDetails, 
  handleGoToTenDayForecast 
}) {
  return (
    <>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        {capitalizeFirstLetter(formatDateToUkrainianFormat(tabsData[selectedDay].date))}
      </Typography>
               
      {/* Деталі погоди погодинно */}
      {filteredHourlyData.map((hourData, index) => (
        <HourRow 
          key={index}
          hourData={hourData}
          index={index}
          isLast={index === filteredHourlyData.length - 1}
          isExpanded={expandedHour === index}
          onToggle={toggleHourDetails}
        />
      ))}
      
      {/* Кнопка для переходу на 10-денний прогноз */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          variant="contained" 
          endIcon={<ChevronRightIcon />}
          onClick={handleGoToTenDayForecast}
        >
          Перейти до 10-денного прогнозу
        </Button>
      </Box>
    </>
  );
}

export default HourlyForecastContent;