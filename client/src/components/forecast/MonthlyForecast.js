import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  IconButton, 
  CircularProgress
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WeatherIcon from '../common/WeatherIcon';
import { capitalizeFirstLetter } from '../utils/weatherUtils';

function MonthlyForecast({ city }) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Days of the week in Ukrainian
  const weekdays = ['СОНЦЕ', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

  useEffect(() => {
    fetchMonthlyForecast();
  }, [city, currentMonth, currentYear]);

  const fetchMonthlyForecast = async () => {
    if (!city) return;

    setLoading(true);
    setError('');

    try {
      // We'll use the extended forecast endpoint since it provides more data
      const response = await fetch(`http://localhost:5000/api/weather/extended-forecast/${city}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
      }

      // Get the actual forecast data (usually 10 days)
      const forecastData = await response.json();

      // Generate a full month calendar with available forecast data
      const monthData = generateMonthCalendar(forecastData);
      setMonthlyData(monthData);
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Помилка отримання прогнозу погоди');
    } finally {
      setLoading(false);
    }
  };

  // Generate a calendar for the current month with forecast data where available
  const generateMonthCalendar = (forecastData) => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create array for the entire month
    const calendarDays = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      if (i === 0) continue; // Skip the first column which is for the week names
      calendarDays.push({
        day: null,
        date: null,
        forecast: null
      });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      // Find matching forecast if available
      const matchingForecast = forecastData.find(f => {
        const forecastDate = new Date(f.date);
        return forecastDate.getDate() === day && 
               forecastDate.getMonth() === currentMonth && 
               forecastDate.getFullYear() === currentYear;
      });
      
      calendarDays.push({
        day,
        date,
        forecast: matchingForecast
      });
    }
    
    return calendarDays;
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    
    if (direction === 'next') {
      newMonth += 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
    } else {
      newMonth -= 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getMonthName = () => {
    const months = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return months[currentMonth];
  };

  // Helper to group days into weeks for the grid
  const getWeeksGrid = () => {
    const weeks = [];
    
    // Add header row with day names
    weeks.push(
      <Grid container key="header">
        {weekdays.map((day, index) => (
          <Grid item xs key={index} sx={{ textAlign: 'center', fontWeight: 'bold', py: 1 }}>
            {day}
          </Grid>
        ))}
      </Grid>
    );
    
    // Skip first cell in the first row (it's taken by the "СОНЦЕ" label)
    let daysToSkip = new Date(currentYear, currentMonth, 1).getDay();
    if (daysToSkip === 0) daysToSkip = 7; // Sunday is 0, make it 7 for our grid
    
    // Create the calendar grid
    for (let i = 0; i < 6; i++) { // Max 6 weeks in a month
      const weekDays = [];
      
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j === 0) {
          // This is the "СОНЦЕ" cell, already handled in the header
          weekDays.push(
            <Grid item xs key={`${i}-${j}`} sx={{ textAlign: 'center' }}></Grid>
          );
          continue;
        }
        
        if (i === 0 && j < daysToSkip) {
          // Empty cells before the 1st day of month
          weekDays.push(
            <Grid item xs key={`${i}-${j}`} sx={{ textAlign: 'center' }}>
              <Box sx={{ height: 100, p: 1, borderRadius: 1 }}>
                <Typography variant="body2">--</Typography>
                <Typography variant="body2">--</Typography>
                <Typography variant="body2">--</Typography>
              </Box>
            </Grid>
          );
        } else {
          const dayNumber = i * 7 + j - daysToSkip + 1;
          
          if (dayNumber > 0 && dayNumber <= new Date(currentYear, currentMonth + 1, 0).getDate()) {
            // Find the forecast data for this day
            const dayData = monthlyData.find(d => d.day === dayNumber);
            
            weekDays.push(
              <Grid item xs key={`${i}-${j}`} sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    height: 100, 
                    p: 1, 
                    borderRadius: 1,
                    backgroundColor: dayNumber === new Date().getDate() && 
                                     currentMonth === new Date().getMonth() && 
                                     currentYear === new Date().getFullYear() 
                                     ? 'primary.main' 
                                     : 'transparent',
                    color: dayNumber === new Date().getDate() && 
                           currentMonth === new Date().getMonth() && 
                           currentYear === new Date().getFullYear() 
                           ? 'white' 
                           : 'inherit',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 5, 
                    right: 5, 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%',
                    bgcolor: getPhaseIcon(dayNumber)
                  }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {dayNumber}
                  </Typography>
                  
                  {dayData?.forecast ? (
                    <>
                      <WeatherIcon 
                        condition={dayData.forecast.day.weatherCode} 
                        size={32}
                        sx={{ my: 0.5 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.round(dayData.forecast.day.maxTemperature)}°
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(dayData.forecast.night.minTemperature)}°
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2">--</Typography>
                      <Typography variant="body2">--</Typography>
                    </>
                  )}
                </Box>
              </Grid>
            );
          } else {
            // Empty cells after the last day of month
            weekDays.push(
              <Grid item xs key={`${i}-${j}`} sx={{ textAlign: 'center' }}>
                <Box sx={{ height: 100, p: 1, borderRadius: 1 }}>
                  <Typography variant="body2">--</Typography>
                  <Typography variant="body2">--</Typography>
                  <Typography variant="body2">--</Typography>
                </Box>
              </Grid>
            );
          }
        }
      }
      
      weeks.push(
        <Grid container key={`week-${i}`}>
          {weekDays}
        </Grid>
      );
      
      // If we've shown all days in the month, break
      if ((i + 1) * 7 - daysToSkip + 1 > new Date(currentYear, currentMonth + 1, 0).getDate()) {
        break;
      }
    }
    
    return weeks;
  };
  
  // Simulated moon phase icon - just for visual representation
  const getPhaseIcon = (day) => {
    // This is a simple representation - in a real app, you would calculate actual moon phases
    const phase = day % 28;
    
    if (phase < 7) return 'rgba(255,255,255,0.9)'; // New moon to waxing crescent
    if (phase < 14) return 'rgba(200,200,200,0.9)'; // First quarter to waxing gibbous
    if (phase < 21) return 'rgba(150,150,150,0.9)'; // Full moon to waning gibbous
    return 'rgba(100,100,100,0.9)'; // Last quarter to waning crescent
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigateMonth('prev')}>
            <ArrowBackIosNewIcon />
          </IconButton>
          
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {getMonthName()} {currentYear}
          </Typography>
          
          <IconButton onClick={() => navigateMonth('next')}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Погода на місяць - {capitalizeFirstLetter(city)}
          </Typography>
          <Typography variant="subtitle1" sx={{ ml: 1, color: 'text.secondary' }}>
            Станом на {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} EEST
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Box sx={{ minWidth: 700 }}>
              {getWeeksGrid()}
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            * Прогноз доступний лише для найближчих 10 днів. Дані оновлюються щогодини.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default MonthlyForecast;