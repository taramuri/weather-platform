import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography } from '@mui/material';
import { capitalizeFirstLetter } from '../utils/weatherUtils';
import DayRow from './tenday/TenDayRow';

function TenDayForecast({ city }) {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!city) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`http://localhost:5000/api/weather/extended-forecast/${city}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Помилка отримання прогнозу погоди');
        }

        const data = await response.json();
        console.log('Отримані дані:', data);
        setForecast(data);
      } catch (err) {
        console.error('Помилка:', err);
        setError(err.message || 'Помилка отримання прогнозу погоди');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [city]);

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