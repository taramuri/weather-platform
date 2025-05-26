import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Alert, Box, Grid, 
  LinearProgress, Chip, Avatar, Divider
} from '@mui/material';
import { 
  WaterDrop, Schedule, Warning, CheckCircle, 
  LocalFlorist, Opacity
} from '@mui/icons-material';

const IrrigationRecommendationCard = ({ city, crop = 'пшениця', moistureData }) => {
  const recommendation = useMemo(() => {
    if (!moistureData?.current_moisture) {
      return {
        status: 'info',
        message: 'Дані недоступні для формування рекомендацій',
        nextAction: 'Очікування даних',
        timing: 'Невідомо',
        priority: 'low',
        waterAmount: 0
      };
    }

    const moisture = moistureData.current_moisture;
    const historical = moistureData.historical_average || 50;
    let status, message, nextAction, timing, priority, waterAmount, color, icon;

    if (moisture < 20) {
      status = 'error';
      message = 'Критично низька вологість! Терміново потрібен полив.';
      nextAction = 'Негайний інтенсивний полив';
      timing = 'Зараз';
      priority = 'high';
      waterAmount = 25;
      color = '#f44336';
      icon = <Warning />;
    } else if (moisture < 35) {
      status = 'warning';
      message = 'Низька вологість. Рекомендується полив найближчим часом.';
      nextAction = 'Помірний полив';
      timing = 'У найближчі 12-24 години';
      priority = 'medium';
      waterAmount = 15;
      color = '#ff9800';
      icon = <WaterDrop />;
    } else if (moisture > 80) {
      status = 'info';
      message = 'Висока вологість. Уникайте поливу найближчі дні.';
      nextAction = 'Призупинити полив';
      timing = 'Наступний полив через 5-7 днів';
      priority = 'low';
      waterAmount = 0;
      color = '#2196f3';
      icon = <Opacity />;
    } else if (moisture > 65) {
      status = 'success';
      message = 'Оптимальна вологість. Легкий підтримуючий полив.';
      nextAction = 'Підтримуючий полив';
      timing = 'Через 2-3 дні';
      priority = 'low';
      waterAmount = 8;
      color = '#4caf50';
      icon = <CheckCircle />;
    } else {
      status = 'success';
      message = 'Вологість в нормі. Стандартний режим поливу.';
      nextAction = 'Плановий полив';
      timing = 'Через 3-4 дні';
      priority = 'medium';
      waterAmount = 12;
      color = '#4caf50';
      icon = <LocalFlorist />;
    }

    return {
      status,
      message,
      nextAction,
      timing,
      priority,
      waterAmount,
      moisture: Math.round(moisture),
      historical: Math.round(historical),
      color,
      icon
    };
  }, [moistureData, crop]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <WaterDrop sx={{ mr: 1, color: 'primary.main' }} />
            Рекомендації поливу
          </Typography>
          <Chip 
            label={crop} 
            size="small" 
            sx={{ bgcolor: 'primary.light', color: 'white' }}
          />
        </Box>

        {/* Основна рекомендація */}
        <Alert 
          severity={recommendation.status} 
          icon={recommendation.icon}
          sx={{ mb: 2 }}
        >
          {recommendation.message}
        </Alert>

        {/* Детальна інформація */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="caption" color="textSecondary">
                Поточна вологість
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: recommendation.color,
                  mr: 1,
                  fontSize: '0.8rem'
                }}>
                  {recommendation.moisture}%
                </Avatar>
                <Box sx={{ flex: 1, ml: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={recommendation.moisture} 
                    sx={{ 
                      height: 6,
                      borderRadius: 3,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: recommendation.color
                      }
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="caption" color="textSecondary">
                Пріоритет
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={recommendation.priority === 'high' ? 'Високий' : 
                        recommendation.priority === 'medium' ? 'Середній' : 'Низький'}
                  color={getPriorityColor(recommendation.priority)}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1 }} />

        {/* Наступна дія */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Наступна дія:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              {recommendation.nextAction}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            ⏰ {recommendation.timing}
          </Typography>
          {recommendation.waterAmount > 0 && (
            <Typography variant="body2" color="text.secondary">
              💧 Рекомендована норма: {recommendation.waterAmount} л/м²
            </Typography>
          )}
        </Box>

        {/* Додаткові поради */}
        <Box sx={{ 
          mt: 'auto', 
          p: 1, 
          bgcolor: 'info.light', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'info.main'
        }}>
          <Typography variant="caption" sx={{ 
            display: 'block',
            color: 'white',
            fontWeight: 'medium'
          }}>
            💡 Оптимальний час поливу: рано вранці (6-8 годин) або ввечері (18-20 годин)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IrrigationRecommendationCard;