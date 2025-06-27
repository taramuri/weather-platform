import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, FormControl, 
         InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { capitalizeFirstLetter } from './utils/weatherUtils';

const MAP_TYPES = [
  { value: 'radar', label: 'Опади (радар)' },
  { value: 'rain', label: 'Дощ' },
  { value: 'temp', label: 'Температура' },
  { value: 'wind', label: 'Вітер' },
  { value: 'clouds', label: 'Хмарність' }
];

function SimpleWeatherRadar({ city }) {
  const [mapType, setMapType] = useState(MAP_TYPES[0].value);
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (city) {
      fetchCityData(city);
    }
  }, [city]);

  const fetchCityData = async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/weathermap/coordinates/${encodeURIComponent(cityName)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Помилка отримання координат міста (${response.status})`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Відповідь сервера не містить необхідних даних');
      }
      
      setCityData(result.data);
    } catch (err) {
      console.error('Помилка отримання координат міста:', err);
      setError(err.message || 'Не вдалося отримати координати міста');
    } finally {
      setLoading(false);
    }
  };

  const handleMapTypeChange = (event) => {
    setMapType(event.target.value);
  };

  const generateWindyUrl = () => {
    if (!cityData) return '';
    
    return `https://embed.windy.com/embed2.html?lat=${cityData.latitude}&lon=${cityData.longitude}&zoom=7&level=surface&overlay=${mapType}&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1&logo=0&attribution=0&message=&hideMenu=true`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Радар погоди
            {cityData ? ` - ${capitalizeFirstLetter(cityData.name)}` : ''}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="map-type-select-label">Тип даних</InputLabel>
              <Select
                labelId="map-type-select-label"
                id="map-type-select"
                value={mapType}
                onChange={handleMapTypeChange}
                label="Тип даних"
                disabled={loading}
              >
                {MAP_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {error && (
          <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        )}
        
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: 500,
            border: '1px solid #eee',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          {loading && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 100
              }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body1">Завантаження карти погоди...</Typography>
            </Box>
          )}
          
          {cityData && !loading && (
            <iframe 
              title="Radar Weather Map"
              src={generateWindyUrl()}
              frameBorder="0"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              aria-label="Інтерактивна карта погоди від Windy.com"
              allow="geolocation"
            />
          )}
        </Box>        
      </Paper>
    </Container>
  );
}

export default SimpleWeatherRadar;