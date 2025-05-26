import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  ArrowForward,
  Air as AirIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

function AirQualityCard({ airQuality, onViewDetails }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/air-quality');
  };

  const getAQIStatus = (index) => {
    if (index <= 20) return { icon: <CheckIcon />, label: 'Відмінно', color: '#50F0E6' };
    if (index <= 40) return { icon: <CheckIcon />, label: 'Добре', color: '#50CCAA' };
    if (index <= 60) return { icon: <WarningIcon />, label: 'Помірно', color: '#F0E641' };
    if (index <= 80) return { icon: <WarningIcon />, label: 'Посередньо', color: '#FF5050' };
    if (index <= 100) return { icon: <ErrorIcon />, label: 'Погано', color: '#960032' };
    return { icon: <ErrorIcon />, label: 'Дуже погано', color: '#7D2181' };
  };

  const getTopPollutants = (details) => {
    if (!details) return [];
    
    const pollutantLimits = {
      pm10: 50,
      pm2_5: 25,
      carbon_monoxide: 10000,
      nitrogen_dioxide: 200,
      sulphur_dioxide: 350,
      ozone: 120
    };

    const pollutantNames = {
      pm10: 'PM10',
      pm2_5: 'PM2.5',
      carbon_monoxide: 'CO',
      nitrogen_dioxide: 'NO₂',
      sulphur_dioxide: 'SO₂',
      ozone: 'O₃'
    };

    return Object.entries(details)
      .map(([key, value]) => ({
        name: pollutantNames[key] || key,
        value,
        limit: pollutantLimits[key] || 100,
        percentage: Math.min((value / (pollutantLimits[key] || 100)) * 100, 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 0.7, fontWeight: 'bold' }}>
        Показник якості повітря
      </Typography>
      
      {airQuality ? (
        <Box>
          {/* Основний індекс */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: airQuality.color || '#e8f5e9',
              mr: 2,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(${airQuality.color || '#50CCAA'} ${(airQuality.index / 100) * 360}deg, #e0e0e0 0deg)`,
                padding: '4px',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white calc(100% - 4px))'
              }
            }}>
              <Box sx={{
                width: '90%',
                height: '90%',
                borderRadius: '50%',
                backgroundColor: airQuality.color || '#e8f5e9',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: airQuality.index > 60 ? 'white' : 'black',
                  lineHeight: 1
                }}>
                  {airQuality.index}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: airQuality.index > 60 ? 'white' : 'black',
                  fontSize: '0.6rem'
                }}>
                  EAQI
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getAQIStatus(airQuality.index).icon}
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: airQuality.color || '#2e7d32',
                  ml: 0.5
                }}>
                  {airQuality.quality}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                {airQuality.description}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Топ забруднювачі */}
          {airQuality.details && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <AirIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                Основні забруднювачі
              </Typography>
              
              <Grid container spacing={1}>
                {getTopPollutants(airQuality.details).map((pollutant, index) => (
                  <Grid item xs={4} key={pollutant.name}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: 'background.default',
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="caption" fontWeight="bold">
                        {pollutant.name}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={pollutant.percentage} 
                        sx={{ 
                          my: 0.5,
                          height: 4,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: pollutant.percentage > 80 ? '#f44336' : 
                                           pollutant.percentage > 60 ? '#ff9800' : 
                                           pollutant.percentage > 40 ? '#ffeb3b' : '#4caf50'
                          }
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {pollutant.value.toFixed(1)} мкг/м³
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ 
            width: 80,
            height: 80,
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="primary"
          endIcon={<ArrowForward />}
          onClick={handleViewDetails}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'white !important'
            }
          }}
        >
          Детально
        </Button>
      </Box>
    </Paper>
  );
}

export default AirQualityCard;