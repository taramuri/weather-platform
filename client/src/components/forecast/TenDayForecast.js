import React, { useState, useEffect, useCallback } from 'react';
import { Container, Paper, Typography } from '@mui/material';
import { capitalizeFirstLetter } from '../utils/weatherUtils';
import DayRow from './tenday/TenDayRow';

function TenDayForecast({ 
  city, 
  extendedForecastData = null, 
  loading: externalLoading = false 
}) {
  const [localForecast, setLocalForecast] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  const shouldFetchData = !extendedForecastData && city;
  const forecast = extendedForecastData || localForecast;
  const loading = externalLoading || localLoading;

  const fetchForecast = useCallback(async () => {
    if (!city) return;

    setLocalLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/weather/extended-forecast/${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
      }

      const data = await response.json();
      setLocalForecast(data);
    } catch (err) {
      console.error('TenDayForecast: Помилка:', err);
      setError(err.message || 'Помилка отримання прогнозу погоди');
    } finally {
      setLocalLoading(false);
    }
  }, [city]);

  useEffect(() => {
    if (shouldFetchData) {
      fetchForecast();
    } else if (extendedForecastData) {
      setError('');
    }
  }, [city, shouldFetchData, extendedForecastData, fetchForecast]);

  const toggleDayDetails = (dayIndex) => {
    if (expandedDay === dayIndex) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dayIndex);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Прогноз погоди на 10 днів - {capitalizeFirstLetter(city)}
        </Typography>
        
        {extendedForecastData && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            📊 Дані отримані з централізованого Dashboard
          </Typography>
        )}

        {loading ? (
          <Typography>Завантаження даних прогнозу...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : forecast.length > 0 ? (
          <>
            {forecast.map((day, index) => (
              <DayRow 
                key={index}
                day={day}
                index={index}
                isExpanded={expandedDay === index}
                onToggle={toggleDayDetails}
                isLast={index === forecast.length - 1}
              />
            ))}
          </>
        ) : (
          <Typography>Немає доступних даних для відображення</Typography>
        )}
      </Paper>
    </Container>
  );
}

export default TenDayForecast;