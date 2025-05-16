import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  WaterDrop, 
  WbSunny, 
  Grass, 
  CalendarMonth, 
  Info as InfoIcon,
  Opacity, 
  Thermostat,
  Warning
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Імітація даних для візуалізації
const mockSoilMoistureData = [
  { name: '1 Тра', value: 45 },
  { name: '2 Тра', value: 42 },
  { name: '3 Тра', value: 41 },
  { name: '4 Тра', value: 38 },
  { name: '5 Тра', value: 35 },
  { name: '6 Тра', value: 32 },
  { name: '7 Тра', value: 30 },
  { name: '8 Тра', value: 65 },
  { name: '9 Тра', value: 62 },
  { name: '10 Тра', value: 58 },
  { name: '11 Тра', value: 55 },
  { name: '12 Тра', value: 52 },
  { name: '13 Тра', value: 49 },
  { name: '14 Тра', value: 45 },
];

const mockRainPrediction = [
  { date: '16 Тра', chance: 85, amount: 12 },
  { date: '17 Тра', chance: 40, amount: 5 },
  { date: '18 Тра', chance: 20, amount: 2 },
  { date: '19 Тра', chance: 5, amount: 0 },
  { date: '20 Тра', chance: 0, amount: 0 },
  { date: '21 Тра', chance: 0, amount: 0 },
  { date: '22 Тра', chance: 10, amount: 1 },
];

const fieldOperations = [
  { id: 1, name: 'Посів кукурудзи', dueDate: '18 Тра', status: 'pending', recommendation: 'Оптимальні умови для посіву 20-22 Тра' },
  { id: 2, name: 'Обробка пшениці', dueDate: '17 Тра', status: 'high-risk', recommendation: 'Високий ризик дощу, перенесіть на 19-20 Тра' },
  { id: 3, name: 'Підживлення ріпаку', dueDate: '23 Тра', status: 'optimal', recommendation: 'Оптимальні умови для підживлення' },
  { id: 4, name: 'Полив картоплі', dueDate: '19 Тра', status: 'not-needed', recommendation: 'Достатньо вологи в ґрунті, полив не потрібен' },
];

const cropsData = [
  { id: 1, name: 'Пшениця', fields: 3, status: 'good', nextOperation: 'Фунгіцидна обробка', recommendedDate: '19-20 Тра' },
  { id: 2, name: 'Кукурудза', fields: 2, status: 'pending', nextOperation: 'Посів', recommendedDate: '20-22 Тра' },
  { id: 3, name: 'Ріпак', fields: 1, status: 'warning', nextOperation: 'Підживлення', recommendedDate: '23 Тра' },
  { id: 4, name: 'Картопля', fields: 2, status: 'good', nextOperation: 'Моніторинг', recommendedDate: '25 Тра' },
];

const soilMoistureZones = {
  dry: [
    { lat: 50.45, lng: 30.5, radius: 1000, value: 20 },
    { lat: 50.43, lng: 30.53, radius: 800, value: 25 },
  ],
  normal: [
    { lat: 50.44, lng: 30.52, radius: 1200, value: 40 },
    { lat: 50.46, lng: 30.51, radius: 900, value: 45 },
  ],
  wet: [
    { lat: 50.44, lng: 30.54, radius: 700, value: 75 },
    { lat: 50.42, lng: 30.52, radius: 600, value: 80 },
  ]
};

// Головний компонент дашборду
const AgriculturalDashboard = () => {
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [loading, setLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState('medium'); // Імітація рівня ризику посухи

  // Імітація завантаження даних
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [selectedCrop]);

  const handleCropChange = (event) => {
    setSelectedCrop(event.target.value);
  };

  const renderMoistureStatus = () => {
    const levels = {
      low: { color: '#f44336', text: 'Критично низька вологість' },
      medium: { color: '#ff9800', text: 'Помірна вологість' },
      high: { color: '#4caf50', text: 'Оптимальна вологість' },
    };
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: levels[riskLevel].color,
            mr: 1,
          }}
        />
        <Typography variant="body2">{levels[riskLevel].text}</Typography>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Заголовок та селектор культур */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
          Агрономічний дашборд
        </Typography>
        <FormControl variant="outlined" sx={{ minWidth: 180 }}>
          <InputLabel>Вибір культури</InputLabel>
          <Select
            value={selectedCrop}
            onChange={handleCropChange}
            label="Вибір культури"
          >
            <MenuItem value="all">Всі культури</MenuItem>
            <MenuItem value="wheat">Пшениця</MenuItem>
            <MenuItem value="corn">Кукурудза</MenuItem>
            <MenuItem value="rapeseed">Ріпак</MenuItem>
            <MenuItem value="potato">Картопля</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Оцінка зони ризику вологи */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WaterDrop sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Оцінка зони ризику вологи
                </Typography>
                <Tooltip title="Аналіз фактичних опадів порівняно з багаторічними даними">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ display: 'flex', height: 300, border: '1px solid #eee', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Зони зволоження ґрунту</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%', mr: 1 }} />
                    <Typography variant="caption">Сухі ділянки</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%', mr: 1 }} />
                    <Typography variant="caption">Нормальне зволоження</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#2196f3', borderRadius: '50%', mr: 1 }} />
                    <Typography variant="caption">Перезволожені ділянки</Typography>
                  </Box>
                </Box>
                
                {/* Тут буде карта з зонами, поки заглушка */}
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: '#f5f5f5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundImage: 'url("https://via.placeholder.com/800x400?text=Карта+вологості+ґрунту")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity={riskLevel === 'low' ? 'error' : riskLevel === 'medium' ? 'warning' : 'success'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {riskLevel === 'low' 
                      ? 'Ризик посухи: рекомендується додатковий полив!' 
                      : riskLevel === 'medium' 
                        ? 'Помірний ризик нестачі вологи на деяких ділянках'
                        : 'Оптимальна вологість ґрунту для більшості культур'
                    }
                  </Typography>
                </Alert>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Остання діагностика
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      16 травня 2025, 08:30
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    Детальніше
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Графік вологості ґрунту */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Opacity sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Динаміка вологості ґрунту
                </Typography>
              </Box>
              
              <Box sx={{ height: 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mockSoilMoistureData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2196f3" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      domain={[0, 100]} 
                      label={{ 
                        value: '% вологості', 
                        angle: -90, 
                        position: 'insideLeft', 
                        style: { textAnchor: 'middle' } 
                      }}
                    />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196f3" 
                      fillOpacity={1} 
                      fill="url(#colorMoisture)" 
                    />
                    <Legend formatter={() => 'Вологість ґрунту'} verticalAlign="top" height={36} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 1 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Середня вологість
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      47.5%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Мінімальна
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: mockSoilMoistureData[6].value < 35 ? '#f44336' : 'inherit' }}>
                      {Math.min(...mockSoilMoistureData.map(item => item.value))}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Максимальна
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {Math.max(...mockSoilMoistureData.map(item => item.value))}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Прогноз опадів */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WbSunny sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Прогноз опадів на 7 днів
                </Typography>
              </Box>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mockRainPrediction}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3f51b5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" label={{ value: 'Ймовірність, %', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Кількість, мм', angle: -90, position: 'insideRight' }} />
                    <RechartsTooltip />
                    <Area yAxisId="left" type="monotone" dataKey="chance" stroke="#3f51b5" fill="url(#colorRain)" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#ff9800" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Рекомендації на основі прогнозу:
              </Typography>
              
              <Alert severity="info" sx={{ mb: 1 }}>
                Високий рівень опадів прогнозується на 16 травня. Рекомендуємо відкласти польові роботи.
              </Alert>
              
              <Alert severity="success">
                Сприятливі умови для посіву очікуються з 19 по 22 травня.
              </Alert>
            </Paper>
          </Grid>

          {/* Календар польових робіт */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonth sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Календар польових робіт
                </Typography>
              </Box>
              
              {fieldOperations.map((operation) => (
                <Box 
                  key={operation.id}
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid #eee',
                    borderLeft: `4px solid ${
                      operation.status === 'optimal' ? '#4caf50' : 
                      operation.status === 'high-risk' ? '#f44336' : 
                      operation.status === 'not-needed' ? '#9e9e9e' : '#ff9800'
                    }`,
                    borderRadius: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {operation.name}
                    </Typography>
                    <Box sx={{ 
                      bgcolor: operation.status === 'high-risk' ? '#ffebee' : 
                               operation.status === 'optimal' ? '#e8f5e9' : 
                               operation.status === 'not-needed' ? '#f5f5f5' : '#fff8e1',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {operation.status === 'high-risk' && <Warning fontSize="small" sx={{ color: '#f44336', mr: 0.5 }} />}
                      <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                        {operation.dueDate}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {operation.recommendation}
                  </Typography>
                </Box>
              ))}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" color="primary">
                  Переглянути всі заплановані роботи
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Стан культур */}
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Grass sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Моніторинг стану культур
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {cropsData.map((crop) => (
                  <Grid item xs={12} sm={6} md={3} key={crop.id}>
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        border: `1px solid ${
                          crop.status === 'good' ? '#4caf50' : 
                          crop.status === 'warning' ? '#ff9800' : '#e0e0e0'
                        }`,
                      }}
                    >
                      <CardHeader
                        title={crop.name}
                        subheader={`${crop.fields} поля`}
                        titleTypographyProps={{ variant: 'h6' }}
                        subheaderTypographyProps={{ variant: 'body2' }}
                        sx={{ 
                          backgroundColor: crop.status === 'good' ? '#e8f5e9' : 
                                         crop.status === 'warning' ? '#fff8e1' : 
                                         crop.status === 'pending' ? '#e3f2fd' : '#f5f5f5',
                          pb: 1
                        }}
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Наступна операція:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          {crop.nextOperation}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Рекомендований термін:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {crop.recommendedDate}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AgriculturalDashboard;