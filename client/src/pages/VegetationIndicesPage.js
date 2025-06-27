import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress, 
  Alert, 
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Grass as GrassIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { capitalizeFirstLetter } from '../components/utils/weatherUtils';

function VegetationIndicesPage({ city }) {
  const [vegetationData, setVegetationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchVegetationData = async () => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/vegetation/${encodeURIComponent(city)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося отримати дані індексів вегетації');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setVegetationData(result.data);
      } else {
        throw new Error(result.error || 'Помилка отримання даних вегетації');
      }
    } catch (err) {
      console.error('Помилка:', err);
      setError(err.message || 'Не вдалося отримати дані вегетації');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVegetationData();
  }, [city]);

  // Функція для визначення статусу індексу
  const getIndexStatus = (value, type) => {
    if (value === undefined || value === null) return { status: 'Невідомо', color: '#757575' };
    
    switch (type) {
      case 'ndvi':
        if (value < 0.1) return { status: 'Відсутність рослинності', color: '#d32f2f' };
        if (value < 0.3) return { status: 'Дуже низька вегетація', color: '#ff5722' };
        if (value < 0.5) return { status: 'Низька вегетація', color: '#ffc107' };
        if (value < 0.7) return { status: 'Середня вегетація', color: '#8bc34a' };
        if (value < 0.9) return { status: 'Висока вегетація', color: '#4caf50' };
        return { status: 'Дуже висока вегетація', color: '#2e7d32' };
      
      case 'evi':
        if (value < 0.2) return { status: 'Дуже низька вегетація', color: '#ff5722' };
        if (value < 0.4) return { status: 'Низька вегетація', color: '#ffc107' };
        if (value < 0.6) return { status: 'Середня вегетація', color: '#8bc34a' };
        if (value < 0.8) return { status: 'Висока вегетація', color: '#4caf50' };
        return { status: 'Дуже висока вегетація', color: '#2e7d32' };
      
      case 'savi':
        if (value < 0.2) return { status: 'Дуже низька вегетація', color: '#ff5722' };
        if (value < 0.4) return { status: 'Низька вегетація', color: '#ffc107' };
        if (value < 0.6) return { status: 'Середня вегетація', color: '#8bc34a' };
        if (value < 0.8) return { status: 'Висока вегетація', color: '#4caf50' };
        return { status: 'Дуже висока вегетація', color: '#2e7d32' };
      
      default:
        return { status: 'Невідомо', color: '#757575' };
    }
  };

  // Дані про індекси та їх норми (тільки NDVI, EVI, SAVI)
  const vegetationIndices = [
    {
      name: 'NDVI (Normalized Difference Vegetation Index)',
      description: 'Нормалізований різницевий індекс рослинності для оцінки густоти і стану рослинності.',
      ranges: [
        { range: '-1.0 - 0.1', status: 'Відсутність рослинності', color: '#d32f2f' },
        { range: '0.1 - 0.3', status: 'Дуже низька вегетація', color: '#ff5722' },
        { range: '0.3 - 0.5', status: 'Низька вегетація', color: '#ffc107' },
        { range: '0.5 - 0.7', status: 'Середня вегетація', color: '#8bc34a' },
        { range: '0.7 - 0.9', status: 'Висока вегетація', color: '#4caf50' },
        { range: '0.9 - 1.0', status: 'Дуже висока вегетація', color: '#2e7d32' }
      ]
    },
    {
      name: 'EVI (Enhanced Vegetation Index)',
      description: 'Покращений індекс вегетації з меншою чутливістю до атмосферних впливів і ґрунтового фону.',
      ranges: [
        { range: '0 - 0.2', status: 'Дуже низька вегетація', color: '#ff5722' },
        { range: '0.2 - 0.4', status: 'Низька вегетація', color: '#ffc107' },
        { range: '0.4 - 0.6', status: 'Середня вегетація', color: '#8bc34a' },
        { range: '0.6 - 0.8', status: 'Висока вегетація', color: '#4caf50' },
        { range: '> 0.8', status: 'Дуже висока вегетація', color: '#2e7d32' }
      ]
    },
    {
      name: 'SAVI (Soil Adjusted Vegetation Index)',
      description: 'Індекс вегетації з корекцією впливу ґрунту для аналізу регіонів з розрідженою рослинністю.',
      ranges: [
        { range: '0 - 0.2', status: 'Дуже низька вегетація', color: '#ff5722' },
        { range: '0.2 - 0.4', status: 'Низька вегетація', color: '#ffc107' },
        { range: '0.4 - 0.6', status: 'Середня вегетація', color: '#8bc34a' },
        { range: '0.6 - 0.8', status: 'Висока вегетація', color: '#4caf50' },
        { range: '> 0.8', status: 'Дуже висока вегетація', color: '#2e7d32' }
      ]
    }
  ];

  const renderCurrentAnalysis = () => {
    if (!vegetationData) return null;

    const { indices, health, historical, source, realSatelliteData, weatherAdjusted } = vegetationData;

    return (
      <Grid container spacing={3}>    

        {/* Поточні індекси */}
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Поточні показники індексів вегетації
          </Typography>
          <Grid container spacing={2}>
            {indices && Object.entries(indices)
              .filter(([key]) => !['ndwi', 'lai'].includes(key))
              .map(([key, value]) => {
              const status = getIndexStatus(value, key);
              const percentage = Math.max(0, value * 100);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {key.toUpperCase()}
                      </Typography>
                      <Typography variant="h4" color={status.color} gutterBottom>
                        {typeof value === 'number' ? value.toFixed(3) : 'N/A'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, percentage))}
                        sx={{
                          mb: 1,
                          height: 8,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: status.color
                          }
                        }}
                      />
                      <Chip 
                        label={status.status}
                        size="small"
                        sx={{ 
                          backgroundColor: status.color, 
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        {/* Загальний стан рослинності */}
        {health && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Загальний стан рослинності
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      {health.score}/100
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Загальна оцінка
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Статус:</strong> {
                        health.status === 'excellent' ? 'Відмінно' :
                        health.status === 'good' ? 'Добре' :
                        health.status === 'moderate' ? 'Помірно' :
                        health.status === 'poor' ? 'Погано' : health.status
                      }
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Рівень стресу:</strong> {
                        health.stress_level === 'very_low' ? 'Дуже низький' :
                        health.stress_level === 'low' ? 'Низький' :
                        health.stress_level === 'medium' ? 'Середній' :
                        health.stress_level === 'high' ? 'Високий' : health.stress_level
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {health.description}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Історичний тренд - використовуємо дані з сервісу */}
        {historical && historical.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Тренд індексів вегетації за рік
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historical}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip 
                      labelFormatter={(label) => `Місяць: ${label}`}
                      formatter={(value, name) => [value.toFixed(3), name.toUpperCase()]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ndvi"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="NDVI"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="evi"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="EVI"
                      dot={{ r: 4 }}
                    />
                    {historical[0].savi !== undefined && (
                      <Line
                        type="monotone"
                        dataKey="savi"
                        stroke="#ffc658"
                        strokeWidth={2}
                        name="SAVI"
                        dot={{ r: 4 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      {/* Заголовок */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <GrassIcon fontSize="large" color="success" sx={{ mr: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Індекси вегетації - {capitalizeFirstLetter(city)}
          </Typography>
        </Box>
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
          {/* Вкладки для перемикання між різними видами даних */}
          <Paper elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth" 
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Аналіз поточних даних" icon={<GrassIcon />} iconPosition="start" />
              <Tab label="Довідник норм" icon={<InfoIcon />} iconPosition="start" />
            </Tabs>
            
            {/* Контент вкладок */}
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && renderCurrentAnalysis()}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Довідник індексів вегетації та їх норм
                  </Typography>
                  
                  {vegetationIndices.map((index, i) => (
                    <Paper 
                      key={i} 
                      elevation={2} 
                      sx={{ p: 3, mb: 3, borderRadius: 2 }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        {index.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {index.description}
                      </Typography>
                      
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'background.default' }}>
                              <TableCell>Діапазон значень</TableCell>
                              <TableCell>Статус рослинності</TableCell>
                              <TableCell align="center" sx={{ width: '20%' }}>Індикатор</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {index.ranges.map((range, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{range.range}</TableCell>
                                <TableCell>{range.status}</TableCell>
                                <TableCell align="center">
                                  <Box 
                                    sx={{ 
                                      width: '100%', 
                                      height: '20px', 
                                      backgroundColor: range.color,
                                      borderRadius: 1
                                    }} 
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
          
          {/* Блок з поясненнями та рекомендаціями */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Пояснення індексів вегетації
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    NDVI (Normalized Difference Vegetation Index)
                  </Typography>
                  <Typography variant="body2">
                    Нормалізований різницевий індекс рослинності. Найпоширеніший індекс для оцінки густоти і стану рослинності. Значення варіюються від -1 до 1, де високі значення (0.6-0.9) вказують на густу і здорову рослинність.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    EVI (Enhanced Vegetation Index)
                  </Typography>
                  <Typography variant="body2">
                    Покращений індекс рослинності. Розроблений для зменшення впливу атмосферних умов і ґрунтового фону. Більш чутливий до змін у насичених рослинністю регіонах, де NDVI може досягати насичення.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    SAVI (Soil Adjusted Vegetation Index)
                  </Typography>
                  <Typography variant="body2">
                    Індекс рослинності з корекцією впливу ґрунту. Враховує вплив відкритого ґрунту при низькому покритті рослинності. Особливо корисний для аналізу регіонів з розрідженою рослинністю.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Рекомендації на основі індексів вегетації
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    При низьких значеннях індексів (0.1-0.3)
                  </Typography>
                  <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                    <li>Перевірте стан зрошення та рівень вологості ґрунту</li>
                    <li>Проведіть аналіз ґрунту на вміст поживних речовин</li>
                    <li>Розгляньте можливість внесення добрив для стимуляції росту рослин</li>
                    <li>Оцініть необхідність захисту рослин від хвороб та шкідників</li>
                  </ul>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    При оптимальних значеннях індексів (0.4-0.8)
                  </Typography>
                  <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                    <li>Підтримуйте поточний режим агротехнічних заходів</li>
                    <li>Проводьте регулярний моніторинг індексів для відстеження динаміки</li>
                    <li>Плануйте збирання врожаю на основі динаміки індексів вегетації</li>
                    <li>Використовуйте дані для прогнозування врожайності</li>
                  </ul>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}

export default VegetationIndicesPage;