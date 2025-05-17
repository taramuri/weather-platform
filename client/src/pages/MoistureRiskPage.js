import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress, 
  Alert, 
  Button, 
  Divider 
} from '@mui/material';
import { 
  WaterDrop as WaterDropIcon,
  Info as InfoIcon,
  Opacity as OpacityIcon
} from '@mui/icons-material';
import MoistureRiskMap from '../components/agricultural/MoistureRiskMap';
import MoistureStats from '../components/agricultural/MoistureStats';
import { capitalizeFirstLetter } from '../components/utils/weatherUtils';

function MoistureRiskPage({ city }) {
  const [moistureData, setMoistureData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMoistureData = async () => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/weather/moisture?city=${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося отримати дані про вологість');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setMoistureData(data.data);
      } else {
        throw new Error(data.error || 'Помилка отримання даних про вологість');
      }
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Не вдалося отримати дані про вологість');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMoistureData();
  }, [city]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Заголовок */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <WaterDropIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Оцінка зони ризику вологи - {capitalizeFirstLetter(city)}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Аналіз вологості ґрунту та визначення зон ризику для оптимізації сільськогосподарських процесів.
        </Typography>
        
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Верхній блок - Карта і Статистика */}
          <Grid container spacing={3} mb={3}>
            {/* Карта */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Карта зон ризику вологи
                </Typography>
                <MoistureRiskMap 
                  city={city} 
                  riskZones={moistureData?.risk_zones}
                />
              </Paper>
            </Grid>
            
            {/* Статистика */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Аналіз вологості ґрунту
                </Typography>
                <MoistureStats 
                  moistureData={moistureData} 
                  loading={loading}
                />
              </Paper>
            </Grid>
          </Grid>
                    
          {/* Додаткова інформація і рекомендації */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Рекомендації щодо управління вологістю
            </Typography>
            
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                Загальні рекомендації
              </Typography>
              <Typography variant="body1">
                Оптимальна вологість ґрунту залежить від типу ґрунту та погодних умов. Для більшості рослин оптимальний діапазон вологості становить 40-60% від повної вологоємності.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      При недостатній вологості
                    </Typography>
                    <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                      <li>Оптимізуйте графік поливу на основі прогнозу опадів</li>
                      <li>Застосовуйте мульчування для зменшення випаровування</li>
                      <li>Використовуйте крапельне зрошення для економії води</li>
                      <li>Збільшіть частоту поливу в посушливі періоди</li>
                    </ul>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      При надмірній вологості
                    </Typography>
                    <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                      <li>Перевірте стан дренажних систем</li>
                      <li>Обробляйте ґрунт для покращення структури і дренажу</li>
                      <li>Застосовуйте глибоке розпушування для зменшення ущільнення</li>
                      <li>Тимчасово зупиніть полив до нормалізації рівня вологості</li>
                    </ul>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}

export default MoistureRiskPage;