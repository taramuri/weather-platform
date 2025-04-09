import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';

function GeolocationButton({ onLocationDetect }) {
  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`http://localhost:5000/api/weather/location?lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data.city) {
              onLocationDetect(data.city);
            }
          } catch (error) {
            console.error('Помилка отримання міста:', error);
          }
        },
        (error) => {
          console.error('Помилка геолокації:', error);
          // Можна додати сповіщення користувачу
        }
      );
    } else {
      alert('Геолокація не підтримується вашим браузером');
    }
  };

  return (
    <Tooltip title="Визначити поточне місце">
      <IconButton 
        color="primary" 
        onClick={detectLocation}
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 10 
        }}
      >
        <LocationIcon />
      </IconButton>
    </Tooltip>
  );
}

export default GeolocationButton;