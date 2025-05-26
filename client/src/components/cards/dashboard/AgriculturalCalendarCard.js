import React, { useMemo } from 'react';
import { 
  Card, CardContent, Typography, Box, Chip,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Alert, Accordion, AccordionSummary, 
  AccordionDetails
} from '@mui/material';
import { 
  CalendarMonth, Agriculture, Schedule, Warning, 
  WaterDrop, BugReport, WbSunny,
  ExpandMore, PriorityHigh , LocalFlorist
} from '@mui/icons-material';

const AgriculturalCalendarCard = ({ 
  weatherData, 
  moistureData, 
  vegetationData, 
  forecastData, 
  crop = 'пшениця',
  city 
}) => {
  const calendarData = useMemo(() => {
    const today = new Date();
    const nextWeek = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      nextWeek.push(date);
    }

    const operations = [];
        
    // 1. Аналіз поливу з IrrigationRecommendationCard
    if (moistureData?.current_moisture) {
      const moisture = moistureData.current_moisture;
      
      if (moisture < 25) {
        operations.push({
          id: 'irrigation-urgent',
          name: 'Термінових полив',
          type: 'irrigation',
          date: nextWeek[0], // Сьогодні
          priority: 'high',
          status: 'urgent',
          recommendation: `Критично низька вологість ${Math.round(moisture)}%. Полив 20-25 л/м²`,
          icon: <WaterDrop color="error" />,
          source: 'moisture_analysis'
        });
      } else if (moisture < 40) {
        operations.push({
          id: 'irrigation-planned',
          name: 'Плановий полив',
          type: 'irrigation',
          date: nextWeek[1], // Завтра
          priority: 'medium',
          status: 'recommended',
          recommendation: `Низька вологість ${Math.round(moisture)}%. Полив 12-15 л/м²`,
          icon: <WaterDrop color="warning" />,
          source: 'moisture_analysis'
        });
      } else if (moisture > 75) {
        operations.push({
          id: 'irrigation-skip',
          name: 'Призупинити полив',
          type: 'irrigation',
          date: nextWeek[0],
          priority: 'low',
          status: 'not-needed',
          recommendation: `Висока вологість ${Math.round(moisture)}%. Полив не потрібен 5-7 днів`,
          icon: <WaterDrop color="info" />,
          source: 'moisture_analysis'
        });
      }
    }

    if (vegetationData?.indices) {
      const { ndvi, evi } = vegetationData.indices;
      
      if (ndvi < 0.3) {
        operations.push({
          id: 'fertilization',
          name: 'Підживлення рослин',
          type: 'fertilization',
          date: nextWeek[2], 
          priority: 'high',
          status: 'urgent',
          recommendation: `Низький NDVI ${Math.round(ndvi * 100)}%. Азотні добрива 30-40 кг/га`,
          source: 'vegetation_analysis'
        });
      }
      
      if (evi < 0.2) {
        operations.push({
          id: 'leaf-feeding',
          name: 'Листове підживлення',
          type: 'fertilization',
          date: nextWeek[3],
          priority: 'medium',
          status: 'recommended',
          recommendation: `Слабкий EVI ${Math.round(evi * 100)}%. Мікроелементи`,
          icon: <LocalFlorist color="warning" />,
          source: 'vegetation_analysis'
        });
      }
    }

    // 3. Погодний аналіз з WeatherBasedRecommendationCard
    if (weatherData) {
      const temp = weatherData.temperature;
      const humidity = weatherData.humidity;
      const windSpeed = weatherData.windSpeed;

      if (temp > 30) {
        operations.push({
          id: 'heat-protection',
          name: 'Захист від спеки',
          type: 'protection',
          date: nextWeek[0],
          priority: 'high',
          status: 'urgent',
          recommendation: `Температура ${Math.round(temp)}°C. Полив до 8:00 ранку`,
          icon: <WbSunny color="error" />,
          source: 'weather_analysis'
        });
      }

      if (temp < 0) {
        operations.push({
          id: 'frost-protection',
          name: 'Захист від заморозків',
          type: 'protection',
          date: nextWeek[0],
          priority: 'high',
          status: 'urgent',
          recommendation: `Заморозки ${Math.round(temp)}°C. Антифризні засоби`,
          icon: <Warning color="error" />,
          source: 'weather_analysis'
        });
      }

      if (humidity > 85) {
        operations.push({
          id: 'disease-prevention',
          name: 'Профілактичне обприскування',
          type: 'protection',
          date: nextWeek[1],
          priority: 'medium',
          status: 'recommended',
          recommendation: `Вологість ${humidity}%. Ризик грибкових хвороб`,
          icon: <BugReport color="warning" />,
          source: 'weather_analysis'
        });
      }

      if (windSpeed > 15) {
        operations.push({
          id: 'wind-warning',
          name: 'Припинити польові роботи',
          type: 'restriction',
          date: nextWeek[0],
          priority: 'high',
          status: 'warning',
          recommendation: `Сильний вітер ${Math.round(windSpeed)} км/г. Небезпечно`,
          icon: <Warning color="error" />,
          source: 'weather_analysis'
        });
      }
    }

    // 4. Прогноз опадів
    if (forecastData && forecastData.length > 0) {
      forecastData.slice(0, 7).forEach((day, index) => {
        if (day.precipProbability > 70) {
          operations.push({
            id: `rain-${index}`,
            name: 'Дощовий день',
            type: 'weather',
            date: nextWeek[index],
            priority: 'medium',
            status: 'info',
            recommendation: `Ймовірність дощу ${day.precipProbability}%. Планувати роботи в приміщенні`,
            icon: <WaterDrop color="info" />,
            source: 'weather_forecast'
          });
        }
      });
    }

    const getSeasonalOperations = (crop, month, week) => {
      const operations = [];
      
      switch (crop) {
        case 'пшениця':
          if (month >= 3 && month <= 5) {
            operations.push({
              id: 'wheat-spring',
              name: 'Весняне підживлення пшениці',
              type: 'fertilization',
              date: week[4],
              priority: 'medium',
              status: 'seasonal',
              recommendation: 'Азотні добрива у фазі кущення',
              icon: <Agriculture color="success" />,
              source: 'seasonal_calendar'
            });
          }
          break;
          
        case 'кукурудза':
          if (month >= 4 && month <= 5) {
            operations.push({
              id: 'corn-planting',
              name: 'Посів кукурудзи',
              type: 'planting',
              date: week[3],
              priority: 'high',
              status: 'seasonal',
              recommendation: 'Оптимальний час посіву при температурі ґрунту >10°C',
              icon: <Agriculture color="primary" />,
              source: 'seasonal_calendar'
            });
          }
          break;
          
        case 'соняшник':
          if (month >= 4 && month <= 5) {
            operations.push({
              id: 'sunflower-planting',
              name: 'Посів соняшнику',
              type: 'planting',
              date: week[5],
              priority: 'medium',
              status: 'seasonal',
              recommendation: 'Посів після прогрівання ґрунту до 8-10°C',
              icon: <WbSunny color="warning" />,
              source: 'seasonal_calendar'
            });
          }
          break;

        default:
          // Загальні операції для всіх культур
          if (month >= 3 && month <= 5) {
            operations.push({
              id: 'general-spring',
              name: 'Весняний огляд посівів',
              type: 'inspection',
              date: week[2],
              priority: 'low',
              status: 'seasonal',
              recommendation: 'Загальний огляд стану рослин та планування робіт',
              icon: <Agriculture color="info" />,
              source: 'seasonal_calendar'
            });
          }
          break;
      }
      
      return operations;
    };
    
    const month = today.getMonth() + 1;
    const seasonalOps = getSeasonalOperations(crop, month, nextWeek);
    operations.push(...seasonalOps);

    return operations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.date - b.date;
    });
  }, [weatherData, moistureData, vegetationData, forecastData, crop]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'error';
      case 'recommended': return 'warning';
      case 'seasonal': return 'primary';
      case 'info': return 'info';
      case 'warning': return 'error';
      case 'not-needed': return 'default';
      default: return 'success';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'urgent': return 'Терміново';
      case 'recommended': return 'Рекомендовано';
      case 'seasonal': return 'Сезонно';
      case 'info': return 'Інформація';
      case 'warning': return 'Попередження';
      case 'not-needed': return 'Не потрібно';
      default: return 'Планово';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default'; // Додано default case
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сьогодні';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('uk-UA', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const todayOperations = calendarData.filter(op => 
    op.date.toDateString() === new Date().toDateString()
  );
  
  const upcomingOperations = calendarData.filter(op => 
    op.date.toDateString() !== new Date().toDateString()
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
            Календар робіт
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={crop} 
              size="small" 
              color="primary"
            />
            <Chip 
              label={`${calendarData.length} операцій`}
              size="small" 
              color="secondary"
            />
          </Box>
        </Box>

        {/* Сьогоднішні операції */}
        {todayOperations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
              <PriorityHigh sx={{ mr: 0.5, fontSize: 16, color: 'error.main' }} />
              Сьогодні ({todayOperations.length}):
            </Typography>
            {todayOperations.map((operation) => (
              <Box key={operation.id} sx={{ 
                mb: 1, 
                p: 1.5, 
                borderRadius: 1, 
                bgcolor: 'background.default',
                border: '2px solid',
                borderColor: `${getPriorityColor(operation.priority)}.main`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {operation.icon}
                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {operation.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={getStatusLabel(operation.status)}
                    color={getStatusColor(operation.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {operation.recommendation}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {todayOperations.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🌟 Сьогодні немає критичних операцій. Хороший день для планового огляду!
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Найближчі операції */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ mr: 0.5, fontSize: 16, color: 'info.main' }} />
            Найближчі дні ({upcomingOperations.length}):
          </Typography>
          <List dense>
            {upcomingOperations.slice(0, 4).map((operation) => (
              <ListItem key={operation.id} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {operation.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {operation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(operation.date)}
                      </Typography>
                    </Box>
                  }
                  secondary={operation.recommendation}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Розширений календар */}
        {upcomingOperations.length > 4 && (
          <Accordion sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Показати всі операції ({upcomingOperations.length - 4} більше)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {upcomingOperations.slice(4).map((operation) => (
                  <ListItem key={operation.id} sx={{ py: 0.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {operation.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {operation.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(operation.date)}
                          </Typography>
                        </Box>
                      }
                      secondary={operation.recommendation}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}        
      </CardContent>
    </Card>
  );
};

export default AgriculturalCalendarCard;