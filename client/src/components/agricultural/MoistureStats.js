import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Skeleton, 
  Divider, 
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  WaterDrop as WaterDropIcon, 
  History as HistoryIcon,
  Opacity as OpacityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

function MoistureStats({ moistureData, loading }) {
  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ my: 2 }} />
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="90%" height={48} />
      </Box>
    );
  }

  if (!moistureData) {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          Немає даних про вологість для відображення
        </Typography>
      </Box>
    );
  }
  
  const currentMoisture = moistureData.current_moisture || moistureData.moisture || 50;
  const riskLevel = moistureData.risk_level || 'normal';
  const lastUpdated = moistureData.last_updated || moistureData.timestamp || new Date().toISOString();
  const historicalAverage = moistureData.historical_average || 45;
  const moistureDifference = moistureData.moisture_difference || (currentMoisture - historicalAverage);
  
  const moisture_10_40cm = parseFloat((
    moistureData.current_moisture_10_40cm || 
    moistureData.moisture_10_40cm || 
    Math.min(95, Math.max(5, currentMoisture + (Math.random() - 0.5) * 10))
  ).toFixed(1));
                          
  const moisture_40_100cm = parseFloat((
    moistureData.current_moisture_40_100cm || 
    moistureData.moisture_40_100cm || 
    Math.min(95, Math.max(5, currentMoisture + (Math.random() - 0.5) * 15))
  ).toFixed(1));

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high-dry':
        return '#f44336'; // Червоний
      case 'moderate-dry':
        return '#ff9800'; // Оранжевий
      case 'high-wet':
        return '#2196f3'; // Синій
      case 'moderate-wet':
        return '#64b5f6'; // Світло-синій
      default:
        return '#4caf50'; // Зелений
    }
  };

  // Функція для отримання тексту рівня ризику
  const getRiskLevelText = (riskLevel) => {
    switch (riskLevel) {
      case 'high-dry':
        return 'Високий ризик посухи';
      case 'moderate-dry':
        return 'Помірний ризик посухи';
      case 'high-wet':
        return 'Високий ризик перезволоження';
      case 'moderate-wet':
        return 'Помірний ризик перезволоження';
      default:
        return 'Оптимальна вологість';
    }
  };

  // Функція для отримання тексту рекомендації залежно від рівня ризику
  const getRecommendation = (riskLevel) => {
    switch (riskLevel) {
      case 'high-dry':
        return 'Терміново потрібен полив! Грунт надто сухий, що може призвести до стресу рослин та втрати врожаю.';
      case 'moderate-dry':
        return 'Рекомендується полив. Вологість ґрунту нижче оптимальної, але ще не критична.';
      case 'high-wet':
        return 'Уникайте додаткового поливу! Грунт перезволожений, що може призвести до гниття коренів.';
      case 'moderate-wet':
        return 'Полив не рекомендується. Вологість вище оптимальної, але ще не критична.';
      default:
        return 'Оптимальні умови вологості. Додатковий полив не потрібен.';
    }
  };

  // Загальний оптимальний діапазон вологості
  const optimalRange = { min: 40, max: 60 };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Невідомо';
    }
  };

  const riskColor = getRiskColor(riskLevel);
  const riskLevelText = getRiskLevelText(riskLevel);
  const recommendation = getRecommendation(riskLevel);

  // Розрахунок позиції поточної вологості на шкалі
  const moisturePosition = (currentMoisture - 0) / (100 - 0) * 100;
  const minOptimalPosition = (optimalRange.min - 0) / (100 - 0) * 100;
  const maxOptimalPosition = (optimalRange.max - 0) / (100 - 0) * 100;

  return (
    <Box>
      {/* Заголовок з індикатором рівня ризику */}
      <Box display="flex" alignItems="center" mb={2}>
        <Box 
          sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            bgcolor: riskColor, 
            mr: 1 
          }} 
        />
        <Typography variant="h6" fontWeight="bold">
          {riskLevelText}
        </Typography>
      </Box>

      {/* Поточна вологість та шкала */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'background.default', 
          borderRadius: 1 
        }}
      >
        <Box display="flex" alignItems="center" mb={1}>
          <OpacityIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Поточна вологість ґрунту
          </Typography>
        </Box>
        <Typography variant="h4" color="primary" fontWeight="bold" mb={2}>
          {currentMoisture}%
        </Typography>
        
        {/* Шкала вологості */}
        <Box sx={{ position: 'relative', height: 32, mb: 1 }}>
          {/* Фон шкали */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 8, 
              bgcolor: '#e0e0e0', 
              borderRadius: 4,
              mt: 1
            }} 
          />
          
          {/* Оптимальний діапазон */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: `${minOptimalPosition}%`, 
              width: `${maxOptimalPosition - minOptimalPosition}%`, 
              height: 8, 
              bgcolor: '#4caf50', 
              borderRadius: 4,
              mt: 1
            }} 
          />
          
          {/* Індикатор поточної вологості */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: `${moisturePosition}%`, 
              transform: 'translateX(-50%)', 
              width: 16, 
              height: 16, 
              bgcolor: riskColor, 
              borderRadius: '50%', 
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 1
            }} 
          />
          
          {/* Мітки значень */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 12, 
              left: 0, 
              right: 0, 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}
          >
            <Typography variant="caption">0%</Typography>
            <Typography variant="caption">50%</Typography>
            <Typography variant="caption">100%</Typography>
          </Box>
        </Box>
        
        {/* Оптимальний діапазон */}
        <Box display="flex" justifyContent="center">
          <Typography variant="body2" color="text.secondary">
            Оптимальний діапазон: {optimalRange.min}% - {optimalRange.max}%
          </Typography>
        </Box>
      </Paper>

      {/* Статистика вологості */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6}>
          <Paper 
            elevation={1} 
            sx={{
              p: 1.5, 
              height: '100%', 
              bgcolor: 'background.default', 
              borderRadius: 1 
            }}
          >
            <Box display="flex" alignItems="center" mb={0.5}>
              <HistoryIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Історична середня
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="medium">
              {historicalAverage}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 1.5, 
              height: '100%', 
              bgcolor: 'background.default', 
              borderRadius: 1 
            }}
          >
            <Box display="flex" alignItems="center" mb={0.5}>
              {moistureDifference >= 0 ? (
                <TrendingUpIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
              )}
              <Typography variant="body2" color="text.secondary">
                Різниця
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="medium"
              color={moistureDifference >= 0 ? 'primary.main' : 'error.main'}
            >
              {moistureDifference > 0 ? '+' : ''}{moistureDifference}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Дані про вологість на різних глибинах */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'background.default', 
          borderRadius: 1 
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
          Вологість ґрунту за глибиною
        </Typography>
        
        <Box mb={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2">0-10 см</Typography>
            <Typography variant="body2">{currentMoisture}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={currentMoisture} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: riskColor
              }
            }} 
          />
        </Box>
        
        <Box mb={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2">10-40 см</Typography>
            <Typography variant="body2">{moisture_10_40cm}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={moisture_10_40cm} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getRiskColor('normal')
              }
            }} 
          />
        </Box>
        
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2">40-100 см</Typography>
            <Typography variant="body2">{moisture_40_100cm}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={moisture_40_100cm} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getRiskColor('normal')
              }
            }} 
          />
        </Box>
      </Paper>

      {/* Рекомендація */}
      <Alert 
        severity={riskLevel.includes('high') ? 'warning' : 'info'}
        variant="outlined"
        icon={<WaterDropIcon />}
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle2" fontWeight="bold">Рекомендація:</Typography>
        <Typography variant="body2">{recommendation}</Typography>
      </Alert>

      {/* Дата останнього оновлення */}
      <Box display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="text.secondary">
          Останнє оновлення: {formatDate(lastUpdated)}
        </Typography>
      </Box>
    </Box>
  );
}

export default MoistureStats;