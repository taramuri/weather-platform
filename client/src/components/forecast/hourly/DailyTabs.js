import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { capitalizeFirstLetter, formatDateToUkrainianFormat } from '../../utils/weatherUtils';

function DailyTabs({ selectedDay, onDayChange }) {
  const getTabs = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    
    return [today, tomorrow, afterTomorrow].map((date, index) => {
      let label = '';
      if (index === 0) {
        label = 'Сьогодні';
      } else if (index === 1) {
        label = 'Завтра';
      } else {
        label = capitalizeFirstLetter(formatDateToUkrainianFormat(date));
      }
      return { date, label };
    });
  };

  const tabsData = getTabs();
  
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs value={selectedDay} onChange={onDayChange} aria-label="день прогнозу" variant="fullWidth">
        {tabsData.map((tab, index) => (
          <Tab 
            key={index} 
            label={tab.label} 
            value={index} 
            sx={{ fontWeight: selectedDay === index ? 'bold' : 'normal' }}
          />
        ))}
      </Tabs>
    </Box>
  );
}

export default DailyTabs;