import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Box,
  Alert, List, ListItem, ListItemIcon, ListItemText, Divider,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import { 
  Cloud, WbSunny, AcUnit, Thunderstorm, 
  Agriculture, CheckCircle, Schedule, ExpandMore
} from '@mui/icons-material';

const WeatherBasedRecommendationCard = ({ weatherData, forecastData, city }) => {
  const recommendations = useMemo(() => {
    if (!weatherData) {
      return {
        immediate: [],
        upcoming: [],
        alerts: [],
        workWindow: 'Дані недоступні',
        priority: 'low'
      };
    }

    const temp = weatherData.temperature;
    const humidity = weatherData.humidity;
    const windSpeed = weatherData.windSpeed;
    
    let immediate = [];
    let upcoming = [];
    let alerts = [];
    let workWindow = 'Сприятливі умови для робіт';
    let priority = 'low';

    if (temp < 0) {
      alerts.push('Заморозки! Ризик пошкодження рослин');
      immediate.push('Застосуйте захисні заходи від заморозків');
      workWindow = 'Обмежені можливості для польових робіт';
      priority = 'high';
    } else if (temp > 32) {
      alerts.push('Спека! Уникайте робіт у денний час');
      immediate.push('Роботи тільки вранці (до 9:00) та ввечері (після 18:00)');
      workWindow = 'Роботи тільки вранці та ввечері';
      priority = 'medium';
    } else if (temp > 25) {
      immediate.push('Оптимальні умови для польових робіт');
      upcoming.push('Моніторьте рослини на ознаки теплового стресу');
    }

    if (humidity > 85) {
      alerts.push('Високий ризик грибкових захворювань');
      immediate.push('Застосуйте профілактичні фунгіциди');
      immediate.push('Відкладіть полив до зниження вологості');
      priority = Math.max(priority, 'medium');
    } else if (humidity < 40) {
      immediate.push('Низька вологість - збільшіть полив');
      upcoming.push('Застосуйте мульчування для збереження вологи');
    }

    if (windSpeed > 15) {
      alerts.push('Сильний вітер! Припиніть польові роботи');
      immediate.push('Зупиніть обприскування та точні роботи');
      workWindow = 'Небезпечно для польових робіт';
      priority = 'high';
    } else if (windSpeed > 10) {
      immediate.push('Сильний вітер - уникайте обприскування');
      upcoming.push('Перевірте підв\'язування рослин');
    } else if (windSpeed < 3) {
      immediate.push('Штиль - ідеальні умови для обприскування');
    }

    if (forecastData && forecastData.length > 0) {
      const todayRain = forecastData[0]?.precipProbability || 0;
      const tomorrowRain = forecastData[1]?.precipProbability || 0;

      if (todayRain > 70) {
        alerts.push('Сьогодні очікується дощ');
        immediate.push('Завершіть терміново необхідні роботи');
        workWindow = 'Обмежені можливості через дощ';
      } else if (tomorrowRain > 70) {
        immediate.push('Завтра очікується дощ - завершіть роботи сьогодні');
        upcoming.push('Підготуйте обладнання для роботи після дощу');
      }

      const weekRain = forecastData.filter(day => (day.precipProbability || 0) > 40).length;
      if (weekRain >= 4) {
        upcoming.push('Дощовий тиждень - підготуйте дренажні системи');
      } else if (weekRain === 0) {
        upcoming.push('Суха погода - перевірте системи поливу');
      }
    }

    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) { 
      if (temp > 5 && temp < 25) {
        upcoming.push('Сприятливі умови для весняних посівів');
      }
    } else if (month >= 6 && month <= 8) { 
      if (temp > 25) {
        immediate.push('Забезпечте полив у прохолодні години');
      }
      upcoming.push('Контролюйте вологість та стан рослин');
    } else if (month >= 9 && month <= 11) { 
      upcoming.push('Час збору врожаю та підготовки до зими');
    } else { 
      upcoming.push('Час планування та технічного обслуговування');
    }

    if (immediate.length === 0) {
      immediate.push('Сприятливі умови для планових робіт');
    }

    return {
      immediate,
      upcoming,
      alerts,
      workWindow,
      priority
    };
  }, [weatherData, forecastData]);

  const getWeatherIcon = (temp, condition) => {
    if (temp < 0) return <AcUnit sx={{ color: '#2196f3' }} />;
    if (temp > 30) return <WbSunny sx={{ color: '#ff9800' }} />;
    if (condition?.includes('дощ')) return <Thunderstorm sx={{ color: '#607d8b' }} />;
    return <Cloud sx={{ color: '#9e9e9e' }} />;
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {getWeatherIcon(weatherData?.temperature, weatherData?.description)}
            <Box sx={{ ml: 1 }}>Погодні рекомендації</Box>
          </Typography>
          <Chip 
            label={recommendations.priority === 'high' ? 'Високий' : 
                  recommendations.priority === 'medium' ? 'Середній' : 'Низький'}
            color={getPriorityColor(recommendations.priority)}
            size="small"
          />
        </Box>

        {/* Робоче вікно */}
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 1, 
          bgcolor: recommendations.priority === 'high' ? 'error.light' : 
                   recommendations.priority === 'medium' ? 'warning.light' : 'success.light',
          mb: 2
        }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold',
            color: recommendations.priority === 'high' ? 'error.dark' : 
                   recommendations.priority === 'medium' ? 'warning.dark' : 'success.dark'
          }}>
            🕐 {recommendations.workWindow}
          </Typography>
        </Box>

        {/* Алерти */}
        {recommendations.alerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="body2">
              {recommendations.alerts.slice(0, 2).join('. ')}
              {recommendations.alerts.length > 2 && ` (+${recommendations.alerts.length - 2})`}
            </Typography>
          </Alert>
        )}
       
        {/* Негайні дії */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 0.5, fontSize: 16, color: 'success.main' }} />
            Зараз ({recommendations.immediate.length}):
          </Typography>
          <List dense>
            {recommendations.immediate.slice(0, 3).map((rec, index) => (
              <ListItem key={index} sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Agriculture sx={{ fontSize: 14, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={rec}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Найближчі дії */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ mr: 0.5, fontSize: 16, color: 'info.main' }} />
            Найближчі дні ({recommendations.upcoming.length}):
          </Typography>
          <List dense>
            {recommendations.upcoming.slice(0, 2).map((rec, index) => (
              <ListItem key={index} sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Agriculture sx={{ fontSize: 14, color: 'info.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={rec}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Додаткові рекомендації */}
        {(recommendations.immediate.length > 3 || recommendations.upcoming.length > 2) && (
          <Accordion sx={{ mt: 'auto' }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Показати всі рекомендації
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recommendations.immediate.length > 3 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Додаткові негайні дії:
                  </Typography>
                  <List dense>
                    {recommendations.immediate.slice(3).map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Agriculture sx={{ fontSize: 14, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={rec}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {recommendations.upcoming.length > 2 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Додаткові майбутні дії:
                  </Typography>
                  <List dense>
                    {recommendations.upcoming.slice(2).map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Agriculture sx={{ fontSize: 14, color: 'info.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={rec}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}       
      </CardContent>
    </Card>
  );
};

export default WeatherBasedRecommendationCard;