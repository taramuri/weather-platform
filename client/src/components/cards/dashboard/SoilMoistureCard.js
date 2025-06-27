import React from 'react';
import { 
  Typography, 
  Box,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import { Info as InfoIcon, Warning, CheckCircle } from '@mui/icons-material';

const SoilMoistureCard = ({ city, lat, lon, moistureData }) => {
  const currentMoisture = moistureData?.current_moisture ?? 0;
  const riskLevel = moistureData?.risk_level ?? 'normal';
  
  const getMoistureStatus = () => {
    if (!moistureData) return { text: 'Невідомо', color: '#999', icon: null };
    
    if (currentMoisture < 20) return { text: 'Дуже низька', color: '#d32f2f', icon: <Warning /> };
    if (currentMoisture < 30) return { text: 'Низька', color: '#f44336', icon: <Warning /> };
    if (currentMoisture < 40) return { text: 'Недостатня', color: '#ff9800', icon: <InfoIcon /> };
    if (currentMoisture <= 70) return { text: 'Оптимальна', color: '#4caf50', icon: <CheckCircle /> };
    if (currentMoisture <= 85) return { text: 'Висока', color: '#2196f3', icon: <InfoIcon /> };
    return { text: 'Надмірна', color: '#9c27b0', icon: <Warning /> };
  };
  
  const moistureStatus = getMoistureStatus();
  
  const moisturePercentage = Math.min(Math.max(currentMoisture, 0), 100);
  
  const getDetailedRecommendations = () => {
    if (currentMoisture < 30) {
      return {
        primary: 'Терміновий полив',
        actions: [
          'Оптимізуйте графік поливу на основі прогнозу опадів',
          'Використовуйте крапельне зрошення для економії води',
          'Застосовуйте мульчування для зменшення випаровування'
        ]
      };
    }
    
    if (currentMoisture > 85) {
      return {
        primary: 'Зменшити полив',
        actions: [
          'Перевірте стан дренажних систем',
          'Тимчасово зупиніть полив до нормалізації рівня вологості',
          'Застосовуйте глибоке розпушування для покращення дренажу'
        ]
      };
    }
    
    if (currentMoisture >= 40 && currentMoisture <= 70) {
      return {
        primary: 'Підтримувати режим',
        actions: [
          'Продовжуйте поточний режим поливу',
          'Моніторте прогноз погоди для корекції поливу',
          'Регулярно перевіряйте стан ґрунту'
        ]
      };
    }
    
    return {
      primary: 'Моніторити стан',
      actions: [
        'Спостерігайте за змінами вологості',
        'Будьте готові до корекції режиму поливу'
      ]
    };
  };

  const getRiskInfo = () => {
    switch (riskLevel) {
      case 'high-dry':
        return { text: 'Високий ризик посухи', color: '#d32f2f', bgcolor: '#ffebee' };
      case 'moderate-dry':
        return { text: 'Помірний ризик посухи', color: '#f57c00', bgcolor: '#fff3e0' };
      case 'high-wet':
        return { text: 'Високий ризик перезволоження', color: '#1976d2', bgcolor: '#e3f2fd' };
      case 'moderate-wet':
        return { text: 'Помірний ризик перезволоження', color: '#0288d1', bgcolor: '#e1f5fe' };
      default:
        return { text: 'Нормальний стан', color: '#388e3c', bgcolor: '#e8f5e8' };
    }
  };
  
  const recommendations = getDetailedRecommendations();
  const riskInfo = getRiskInfo();
  
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Вологість ґрунту
      </Typography>
      
      {!moistureData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="textSecondary">
            Завантаження даних про вологість ґрунту...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Основні показники */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                mr: 2
              }}
            >
              <CircularProgress
                variant="determinate"
                value={moisturePercentage}
                size={80}
                thickness={4}
                sx={{
                  color: moistureStatus.color,
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  color="text.primary"
                >{`${Math.round(currentMoisture)}%`}</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {moistureStatus.icon && React.cloneElement(moistureStatus.icon, { 
                  fontSize: 'small', 
                  sx: { color: moistureStatus.color, mr: 0.5 } 
                })}
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  <span style={{ color: moistureStatus.color }}>{moistureStatus.text}</span>
                </Typography>
              </Box>
              <Chip
                label={recommendations.primary}
                size="small"
                color={currentMoisture >= 40 && currentMoisture <= 70 ? "success" : "warning"}
                variant="outlined"
              />
            </Box>
          </Box>
          
          {/* Рівень ризику */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1.5, 
              mb: 2, 
              bgcolor: riskInfo.bgcolor,
              border: `1px solid ${riskInfo.color}20`
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: riskInfo.color, 
                fontWeight: 'medium',
                textAlign: 'center'
              }}
            >
              {riskInfo.text}
            </Typography>
          </Paper>
          
          {/* Рекомендації */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              Рекомендації:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
              {recommendations.actions.map((action, index) => (
                <Typography 
                  key={index}
                  component="li" 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ mb: 0.5 }}
                >
                  {action}
                </Typography>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SoilMoistureCard;