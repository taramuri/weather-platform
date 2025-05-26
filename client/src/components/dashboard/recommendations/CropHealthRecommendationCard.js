import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, 
  Alert, Chip, List, ListItem, ListItemIcon, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import { 
  Agriculture, BugReport, ExpandMore,
  WaterDrop, WbSunny, Science, Timeline
} from '@mui/icons-material';

const CropHealthRecommendationCard = ({ vegetationData, weatherData, moistureData, crop = 'пшениця' }) => {
  const healthAnalysis = useMemo(() => {
    if (!vegetationData?.indices) {
      return {
        status: 'unknown',
        score: 0,
        recommendations: ['Дані недоступні для аналізу'],
        alerts: [],
        actionPlan: []
      };
    }

    const { ndvi, evi, lai, ndwi } = vegetationData.indices;
    
    let score = 0;
    let status = 'poor';
    let recommendations = [];
    let alerts = [];
    let actionPlan = [];

    if (ndvi) score += ndvi * 40;
    if (evi) score += evi * 30;
    if (lai) score += Math.min(lai / 6, 1) * 20;
    if (ndwi) score += Math.max(0, ndwi) * 10;

    if (score >= 75) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'moderate';
    else status = 'poor';

    if (ndvi < 0.3) {
      alerts.push('Низька фотосинтетична активність');
      recommendations.push('Перевірте стан ґрунту та живлення');
      actionPlan.push({
        priority: 'high',
        action: 'Аналіз ґрунту та підживлення',
        timing: '2-3 дні',
        icon: <Science color="error" />
      });
    }

    if (evi < 0.2) {
      alerts.push('Слабкий розвиток рослинності');
      recommendations.push('Розгляньте додаткове удобрення');
      actionPlan.push({
        priority: 'medium',
        action: 'Листове підживлення',
        timing: '3-5 днів'
      });
    }

    if (lai < 2) {
      recommendations.push('Оптимізуйте густоту посівів наступного сезону');
    }

    if (ndwi && ndwi < -0.1) {
      alerts.push('Водний стрес рослин');
      actionPlan.push({
        priority: 'high',
        action: 'Додатковий полив',
        timing: '24 години',
        icon: <WaterDrop color="error" />
      });
    }

    if (weatherData) {
      const temp = weatherData.temperature;
      const humidity = weatherData.humidity;

      if (temp > 30) {
        alerts.push('Тепловий стрес рослин');
        recommendations.push('Забезпечте додатковий полив через високу температуру');
        actionPlan.push({
          priority: 'high',
          action: 'Охолоджуючий полив',
          timing: 'Щодня до 8:00',
          icon: <WbSunny color="error" />
        });
      }

      if (humidity > 85) {
        alerts.push('Ризик грибкових захворювань');
        actionPlan.push({
          priority: 'medium',
          action: 'Профілактичне обприскування',
          timing: 'При можливості',
          icon: <BugReport color="warning" />
        });
      }
    }

    // Аналіз вологості ґрунту
    if (moistureData) {
      const soilMoisture = moistureData.current_moisture;
      if (soilMoisture < 25) {
        alerts.push('Критично низька вологість ґрунту');
        actionPlan.push({
          priority: 'high',
          action: 'Інтенсивний полив',
          timing: 'Негайно',
          icon: <WaterDrop color="error" />
        });
      }
    }

    const getCropSpecificAdvice = (crop, ndvi, evi, weather) => {
      const recommendations = [];
      const alerts = [];
      const actionPlan = [];
  
      switch (crop) {
        case 'пшениця':
          if (ndvi < 0.4) {
            recommendations.push('Пшениця потребує підживлення азотом');
            actionPlan.push({
              priority: 'medium',
              action: 'Азотні добрива (30-40 кг/га)',
              timing: 'Фаза кущення',
              icon: <Science color="info" />
            });
          }
          if (weather?.humidity > 80) {
            alerts.push('Ризик іржі пшениці');
          }
          break;
  
        case 'кукурудза':
          if (weather?.temperature > 25 && evi < 0.3) {
            recommendations.push('Кукурудза потребує інтенсивного поливу');
            actionPlan.push({
              priority: 'high',
              action: 'Полив 40-50 мм',
              timing: 'Фаза цвітіння',
              icon: <WaterDrop color="primary" />
            });
          }
          break;
  
        case 'соняшник':
          if (ndvi < 0.5) {
            recommendations.push('Соняшник чутливий до водного стресу');
          }
          break;
      }
  
      return { recommendations, alerts, actionPlan };
    };
  
    const cropAdvice = getCropSpecificAdvice(crop, ndvi, evi, weatherData);
    recommendations.push(...cropAdvice.recommendations);
    alerts.push(...cropAdvice.alerts);
    actionPlan.push(...cropAdvice.actionPlan);

    if (score >= 70) {
      recommendations.push('Підтримуйте поточний режим догляду');
    } else {
      recommendations.push('Посиліть догляд та моніторинг');
    }

    if (recommendations.length === 0) {
      recommendations.push('Загальний догляд відповідно до агротехніки');
    }

    return {
      status,
      score: Math.round(score),
      recommendations,
      alerts,
      actionPlan,
      ndvi: Math.round((ndvi || 0) * 100),
      evi: Math.round((evi || 0) * 100),
      lai: lai || 0,
      ndwi: ndwi ? Math.round(ndwi * 100) : null
    };
  }, [vegetationData, weatherData, moistureData, crop]);

  
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'moderate': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'excellent': return 'Відмінно';
      case 'good': return 'Добре';
      case 'moderate': return 'Помірно';
      case 'poor': return 'Погано';
      default: return 'Невідомо';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
             Здоров'я культур
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={crop} 
              size="small" 
              sx={{ bgcolor: 'success.light', color: 'white' }}
            />            
          </Box>
        </Box>

        {/* Загальна оцінка */}
        <Box sx={{ mb: 1, textAlign: 'center' }}>
          <Box sx={{ 
            width: 70, 
            height: 70, 
            borderRadius: '50%', 
            bgcolor: getStatusColor(healthAnalysis.status),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {healthAnalysis.score}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: getStatusColor(healthAnalysis.status), fontWeight: 'bold' }}>
            {getStatusLabel(healthAnalysis.status)}
          </Typography>
        </Box>

        {/* Індекси рослинності */}
        <Grid container spacing={1} sx={{ mb: 0.5 }}>
          <Grid item xs={3}>
            <Tooltip title="Нормалізований індекс рослинності">
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">NDVI</Typography>
                <Typography variant="h6" sx={{ color: healthAnalysis.ndvi > 50 ? 'success.main' : 'warning.main' }}>
                  {healthAnalysis.ndvi}%
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={3}>
            <Tooltip title="Покращений індекс рослинності">
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">EVI</Typography>
                <Typography variant="h6" sx={{ color: healthAnalysis.evi > 30 ? 'success.main' : 'warning.main' }}>
                  {healthAnalysis.evi}%
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={3}>
            <Tooltip title="Індекс листової поверхні">
              <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">LAI</Typography>
                <Typography variant="h6" sx={{ color: healthAnalysis.lai > 3 ? 'success.main' : 'warning.main' }}>
                  {healthAnalysis.lai.toFixed(1)}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          {healthAnalysis.ndwi !== null && (
            <Grid item xs={3}>
              <Tooltip title="Індекс водного стресу">
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">NDWI</Typography>
                  <Typography variant="h6" sx={{ color: healthAnalysis.ndwi > 10 ? 'success.main' : 'warning.main' }}>
                    {healthAnalysis.ndwi}%
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          )}
        </Grid>

        {/* Алерти */}
        {healthAnalysis.alerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="body2">
              {healthAnalysis.alerts.slice(0, 2).join(', ')}
              {healthAnalysis.alerts.length > 2 && ` (+${healthAnalysis.alerts.length - 2} ще)`}
            </Typography>
          </Alert>
        )}

        {/* Основні рекомендації */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Рекомендації ({healthAnalysis.recommendations.length}):
          </Typography>
          <List dense>
            {healthAnalysis.recommendations.slice(0, 3).map((rec, index) => (
              <ListItem key={index} sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Agriculture sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={rec}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* План дій (згортаємий) */}
        {healthAnalysis.actionPlan.length > 0 && (
          <Accordion sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 0.5, fontSize: 16 }} />
                План дій ({healthAnalysis.actionPlan.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {healthAnalysis.actionPlan.map((action, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  p: 1, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: `${getPriorityColor(action.priority)}.main`
                }}>
                  {action.icon}
                  <Box sx={{ ml: 1, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {action.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.timing}
                    </Typography>
                  </Box>
                  <Chip 
                    label={action.priority === 'high' ? 'Високий' : action.priority === 'medium' ? 'Середній' : 'Низький'}
                    color={getPriorityColor(action.priority)}
                    size="small"
                  />
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )}

      </CardContent>
    </Card>
  );
};

export default CropHealthRecommendationCard;