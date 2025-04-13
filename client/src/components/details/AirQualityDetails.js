import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  LinearProgress
} from '@mui/material';

function AirQualityDetails({ city, airQuality: initialAirQuality }) {
  const [airQuality, setAirQuality] = useState(initialAirQuality);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialAirQuality && city) {
      setLoading(true);
      fetch(`http://localhost:5000/api/weather/air-quality/${city}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Не вдалося отримати дані про якість повітря');
          }
          return response.json();
        })
        .then(data => {
          setAirQuality(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Помилка при отриманні даних про якість повітря:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [city, initialAirQuality]);

  const getProgressColor = (value, max) => {
    const percent = (value / max) * 100;
    if (percent <= 20) return '#50F0E6'; // Блакитний - відмінно
    if (percent <= 40) return '#50CCAA'; // Зелений - добре
    if (percent <= 60) return '#F0E641'; // Жовтий - помірно
    if (percent <= 80) return '#FF5050'; // Оранжевий - посередньо
    if (percent <= 100) return '#960032'; // Червоний - погано
    return '#7D2181'; // Фіолетовий - дуже погано
  };

  // Функція для отримання опису показника
  const getPollutantDescription = (pollutant) => {
    const descriptions = {
      pm10: {
        name: 'PM10',
        fullName: 'Тверді частинки розміром до 10 мкм',
        description: 'Це тверді мікрочастинки розміром до 10 мікрометрів, які можуть потрапляти до дихальних шляхів і викликати проблеми з диханням.',
        limit: 50, // мкг/м³
        source: 'Будівництво, дорожній пил, промисловість, спалювання палива',
        impact: 'Подразнення дихальних шляхів, загострення астми, бронхіту, серцево-судинні захворювання'
      },
      pm2_5: {
        name: 'PM2.5',
        fullName: 'Тверді частинки розміром до 2.5 мкм',
        description: 'Це дрібні тверді частинки розміром до 2.5 мікрометрів, які можуть глибоко проникати в легені та потрапляти в кровоносну систему.',
        limit: 25, // мкг/м³
        source: 'Вихлопні гази, спалювання біомаси, промислові викиди',
        impact: 'Серцево-судинні захворювання, проблеми з диханням, зниження функції легень, пошкодження нервової системи'
      },
      carbon_monoxide: {
        name: 'CO',
        fullName: 'Чадний газ (монооксид вуглецю)',
        description: 'Безбарвний газ без запаху, який утворюється внаслідок неповного згоряння вуглецевмісних матеріалів.',
        limit: 10000, // мкг/м³
        source: 'Автомобільні вихлопи, опалювальні прилади, промислові процеси',
        impact: 'Зменшує здатність крові переносити кисень, головний біль, запаморочення, при високих концентраціях смертельно небезпечний'
      },
      nitrogen_dioxide: {
        name: 'NO₂',
        fullName: 'Діоксид азоту',
        description: 'Червонувато-коричневий газ з гострим запахом, є одним з основних забруднювачів повітря.',
        limit: 200, // мкг/м³
        source: 'Вихлопні гази, електростанції, промисловість',
        impact: 'Подразнення дихальних шляхів, загострення астми та інших респіраторних захворювань'
      },
      sulphur_dioxide: {
        name: 'SO₂',
        fullName: 'Діоксид сірки',
        description: 'Безбарвний газ з гострим запахом, утворюється при спалюванні палива, що містить сірку.',
        limit: 350, // мкг/м³
        source: 'Спалювання вугілля, нафтопереробка, виробництво металів',
        impact: 'Подразнення очей, горла, легенів, загострення астми та бронхіту'
      },
      ozone: {
        name: 'O₃',
        fullName: 'Озон (приземний)',
        description: 'Газ з різким запахом, який на рівні землі є забруднювачем і складовою смогу.',
        limit: 120, // мкг/м³
        source: 'Утворюється в результаті хімічних реакцій між оксидами азоту та VOC під дією сонячного світла',
        impact: 'Подразнення дихальних шляхів, зниження функції легень, загострення астми та інших хронічних захворювань легень'
      }
    };

    return descriptions[pollutant] || { 
      name: pollutant, 
      fullName: 'Невідомий показник',
      description: 'Інформація не доступна' 
    };
  };

  // Відображення стану завантаження
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Завантаження даних про якість повітря...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Відображення помилки
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Помилка: {error}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Не вдалося отримати дані про якість повітря для {city}.
        </Typography>
      </Box>
    );
  }

  // Відображення, коли немає даних
  if (!airQuality) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">
          Дані про якість повітря для {city} відсутні
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          На жаль, ми не можемо отримати дані про якість повітря для цього міста.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Заголовок та загальна інформація */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Якість повітря у місті {city}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: airQuality.color, 
                color: '#fff', 
                textAlign: 'center'
              }}
            >
              <Typography variant="h3">{airQuality.index}</Typography>
              <Typography variant="h6">Індекс якості повітря (EAQI)</Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>{airQuality.quality}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph>
              {airQuality.description}
            </Typography>
            
            <Typography variant="body2">
              Європейський індекс якості повітря (EAQI) класифікує якість повітря від 0 (найкраща) до 100+ (найгірша).
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Пояснення індексу EAQI */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Як визначається індекс якості повітря?
        </Typography>
        
        <Typography variant="body1" paragraph>
          Європейський індекс якості повітря (EAQI) розраховується на основі концентрації п'яти основних забруднювачів:
          PM10, PM2.5, озону (O₃), діоксиду азоту (NO₂) та діоксиду сірки (SO₂).
          Чим нижче значення індексу, тим краща якість повітря.
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Індекс</TableCell>
                <TableCell>Якість</TableCell>
                <TableCell>Колір</TableCell>
                <TableCell>Рекомендації</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>0-20</TableCell>
                <TableCell>Відмінна</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#50F0E6' }}></Box></TableCell>
                <TableCell>Ідеальні умови для активностей на відкритому повітрі</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>21-40</TableCell>
                <TableCell>Добра</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#50CCAA' }}></Box></TableCell>
                <TableCell>Безпечно для більшості активностей на відкритому повітрі</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>41-60</TableCell>
                <TableCell>Помірна</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#F0E641' }}></Box></TableCell>
                <TableCell>Чутливим групам слід обмежити тривалі навантаження на відкритому повітрі</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>61-80</TableCell>
                <TableCell>Посередня</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#FF5050' }}></Box></TableCell>
                <TableCell>Чутливим групам слід уникати перебування на відкритому повітрі</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>81-100</TableCell>
                <TableCell>Погана</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#960032' }}></Box></TableCell>
                <TableCell>Всім слід обмежити фізичну активність на відкритому повітрі</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>101+</TableCell>
                <TableCell>Дуже погана</TableCell>
                <TableCell><Box sx={{ width: 20, height: 20, bgcolor: '#7D2181' }}></Box></TableCell>
                <TableCell>Всім слід уникати перебування на відкритому повітрі</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Детальна інформація про забруднювачі */}
      <Typography variant="h6" gutterBottom>
        Детальна інформація про забруднювачі повітря
      </Typography>

      <Grid container spacing={3}>
        {airQuality.details && Object.entries(airQuality.details).map(([pollutant, value]) => {
          const info = getPollutantDescription(pollutant);
          const progressColor = getProgressColor(value, info.limit);
          const percentage = Math.min((value / info.limit) * 100, 100);
          
          return (
            <Grid item xs={12} md={6} key={pollutant}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {info.name} ({info.fullName})
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      {value} мкг/м³
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: progressColor
                          }
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                      {percentage.toFixed(0)}%
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {info.description}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Граничне значення:</strong> {info.limit} мкг/м³
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Джерела:</strong> {info.source}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Вплив на здоров'я:</strong> {info.impact}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default AirQualityDetails;