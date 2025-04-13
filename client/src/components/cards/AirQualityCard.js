import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';

function AirQualityCard({ airQuality, onViewDetails }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        ПОКАЗНИК ЯКОСТІ ПОВІТРЯ
      </Typography>
      
      {airQuality ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: airQuality.color || '#e8f5e9',
            mr: 2
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color: airQuality.index > 60 ? 'white' : 'black' 
            }}>
              {airQuality.index}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: airQuality.color || '#2e7d32' 
            }}>
              {airQuality.quality}
            </Typography>
            <Typography variant="body2">
              {airQuality.description}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e8f5e9',
            mr: 2
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              --
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              Завантаження...
            </Typography>
            <Typography variant="body2">
              Отримання даних про якість повітря...
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: 4 }}
          onClick={onViewDetails}
        >
          Детальніше
        </Button>
      </Box>
    </Paper>
  );
}

export default AirQualityCard;