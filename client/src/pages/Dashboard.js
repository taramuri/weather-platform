import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Tabs, Tab,
  IconButton, Tooltip, Paper, Typography,
  Alert, CircularProgress, Chip, Grid, CardContent
} from '@mui/material';
import {
  Analytics, TrendingUp, WbSunny, Download,
  Refresh, Recommend
} from '@mui/icons-material';

import WeatherDetailsCard from '../components/cards/WeatherDetailsCard';
import TenDayForecastPreview from '../components/forecast/tenday/TenDayForecastPreview';
import HourlyForecastPreview from '../components/forecast/hourly/HourlyForecastPreview';

import SoilMoistureCard from '../components/cards/dashboard/SoilMoistureCard';
import RainPredictionCard from '../components/cards/dashboard/RainPredictionCard';
import FieldOperationsCard from '../components/cards/dashboard/AgriculturalCalendarCard';

import IrrigationRecommendationCard from '../components/dashboard/recommendations/IrrigationRecommendationCard';
import CropHealthRecommendationCard from '../components/dashboard/recommendations/CropHealthRecommendationCard';
import WeatherBasedRecommendationCard from '../components/dashboard/recommendations/WeatherBasedRecommendationCard';

import VegetationIndicesCard from '../components/agricultural/VegetationIndicesCard';
import ReportsSection from '../components/dashboard/ReportsSection';

import AlertsPanel from '../components/alerts/AlertsPanel';
import AirQualityCard from '../components/cards/AirQualityCard';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';

import { capitalizeFirstLetter, UkrainianWeekday } from '../components/utils/weatherUtils';
import { WEATHER_TABS } from '../components/utils/urlUtils';

const Dashboard = ({ city = 'Київ', setLoading }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeUpdates] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('пшениця'); 
  
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [hourlyForecastData, setHourlyForecastData] = useState(null);
  const [extendedForecastData, setExtendedForecastData] = useState(null);
  const [monthlyForecastData, setMonthlyForecastData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [moistureData, setMoistureData] = useState(null);
  const [vegetationData, setVegetationData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [yieldPrediction, setYieldPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [coordinates, setCoordinates] = useState({
    lat: 50.45466,
    lon: 30.5238
  });

  const tabLabels = [
    { label: 'Огляд', icon: <Analytics /> },
    { label: 'Аналітика', icon: <TrendingUp /> },
    { label: 'Рекомендації', icon: <Recommend /> },
    { label: 'Прогнози', icon: <WbSunny /> },
    { label: 'Звіти', icon: <Download /> }
  ];

  const generateAlerts = useCallback(() => {
    const newAlerts = [];
    
    if (weatherData?.temperature > 30) {
      newAlerts.push({
        id: 'high-temp',
        type: 'warning',
        title: 'Висока температура',
        message: `Температура ${Math.round(weatherData.temperature)}°C може вплинути на розвиток рослин`,
        timestamp: new Date(),
        priority: 'medium'
      });
    }

    if (weatherData?.temperature < 0) {
      newAlerts.push({
        id: 'frost-warning',
        type: 'error',
        title: 'Попередження про заморозки',
        message: `Температура ${Math.round(weatherData.temperature)}°C. Ризик пошкодження рослин`,
        timestamp: new Date(),
        priority: 'high'
      });
    }

    if (moistureData?.current_moisture < 30) {
      newAlerts.push({
        id: 'low-moisture',
        type: 'error',
        title: 'Низька вологість ґрунту',
        message: `Вологість ґрунту ${Math.round(moistureData.current_moisture)}% потребує поливу`,
        timestamp: new Date(),
        priority: 'high'
      });
    }

    if (vegetationData?.health?.status === 'poor') {
      newAlerts.push({
        id: 'vegetation-stress',
        type: 'error',
        title: 'Стрес рослинності',
        message: 'Виявлено погіршення стану рослинності',
        timestamp: new Date(),
        priority: 'high'
      });
    }

    if (airQualityData?.index > 80) {
      newAlerts.push({
        id: 'poor-air-quality',
        type: 'warning',
        title: 'Погана якість повітря',
        message: `Індекс якості повітря: ${airQualityData.index}. Рекомендується обмежити роботи на відкритому повітрі`,
        timestamp: new Date(),
        priority: 'medium'
      });
    }

    setAlerts(newAlerts);
  }, [weatherData, moistureData, vegetationData, airQualityData]);

  const fetchAllData = useCallback(async () => {
    if (!city) return;
    
    setLocalLoading(true);
    setError(null);
    
    try {
      const weatherResponse = await fetch(`http://localhost:5000/api/weather/current/${encodeURIComponent(city)}`);
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        setWeatherData(weatherData);
        
        if (weatherData.coordinates) {
          setCoordinates(weatherData.coordinates);
        } else {
          setCoordinates({ lat: 50.45466, lon: 30.5238 });
        }
      } else {
        console.warn('Weather data unavailable');
      }

      try {
        const forecastResponse = await fetch(`http://localhost:5000/api/weather/forecast/${encodeURIComponent(city)}`);
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          setForecastData(forecastData);
        }
      } catch (err) {
        console.warn('Forecast data unavailable:', err.message);
      }

      try {
        const hourlyResponse = await fetch(`http://localhost:5000/api/weather/hourly/${encodeURIComponent(city)}`);
        if (hourlyResponse.ok) {
          const hourlyData = await hourlyResponse.json();
          setHourlyForecastData(hourlyData);
        }
      } catch (err) {
        console.warn('Hourly forecast data unavailable:', err.message);
      }

      try {
        const extendedResponse = await fetch(`http://localhost:5000/api/weather/extended-forecast/${encodeURIComponent(city)}`);
        if (extendedResponse.ok) {
          const extendedData = await extendedResponse.json();
          setExtendedForecastData(extendedData);
        }
      } catch (err) {
        console.warn('Extended forecast data unavailable:', err.message);
      }

      try {
        const monthlyResponse = await fetch(`http://localhost:5000/api/weather/monthly-forecast/${encodeURIComponent(city)}`);
        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json();
          setMonthlyForecastData(monthlyData);
        }
      } catch (err) {
        console.warn('Monthly forecast data unavailable:', err.message);
      }
      
      try {
        const airQualityResponse = await fetch(`http://localhost:5000/api/weather/air-quality/${encodeURIComponent(city)}`);
        if (airQualityResponse.ok) {
          const airQualityData = await airQualityResponse.json();
          setAirQualityData(airQualityData);
        }
      } catch (err) {
        console.warn('Air quality data unavailable:', err.message);
      }

      try {
        const moistureResponse = await fetch(`http://localhost:5000/api/weather/moisture?city=${encodeURIComponent(city)}`);
        if (moistureResponse.ok) {
          const moistureResult = await moistureResponse.json();
          if (moistureResult.success && moistureResult.data) {
            setMoistureData(moistureResult.data);
          }
        }
      } catch (err) {
        console.warn('Moisture data unavailable:', err.message);
      }

      try {
        const vegetationResponse = await fetch(`http://localhost:5000/api/vegetation/${encodeURIComponent(city)}`);
        if (vegetationResponse.ok) {
          const vegetationResult = await vegetationResponse.json();
          if (vegetationResult.success && vegetationResult.data) {
            setVegetationData(vegetationResult.data);
          }
        }
      } catch (err) {
        console.warn('Vegetation data unavailable:', err.message);
      }

      try {
        const trendsResponse = await fetch(`http://localhost:5000/api/analytics/trends/${encodeURIComponent(city)}?timeRange=month`);
        if (trendsResponse.ok) {
          const trendsResult = await trendsResponse.json();
          if (trendsResult.success && trendsResult.data) {
            setTrendsData(trendsResult.data);
          }
        }
      } catch (err) {
        console.warn('Trends data unavailable:', err.message);
      }

      try {
        const yieldResponse = await fetch(`http://localhost:5000/api/analytics/yield-prediction/${encodeURIComponent(city)}?crop=${selectedCrop}`);
        if (yieldResponse.ok) {
          const yieldResult = await yieldResponse.json();
          if (yieldResult.success && yieldResult.data) {
            setYieldPrediction(yieldResult.data);
          }
        }
      } catch (err) {
        console.warn('Yield prediction unavailable:', err.message);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Помилка завантаження даних: " + err.message);
    } finally {
      setLocalLoading(false);
      if (typeof setLoading === 'function') {
        setLoading(false);
      }
    }
  }, [city, selectedCrop, setLoading]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    generateAlerts();
  }, [generateAlerts]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleExportData = () => {
    const exportData = {
      city,
      crop: selectedCrop,
      timestamp: new Date().toISOString(),
      weather: weatherData,
      airQuality: airQualityData,
      moisture: moistureData,
      vegetation: vegetationData,
      trends: trendsData,
      yieldPrediction,
      alerts
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agrocast-data-${city}-${selectedCrop}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    const commonProps = {
      city,
      weatherData,
      forecastData,
      hourlyForecastData,
      extendedForecastData,
      monthlyForecastData,
      airQualityData,
      moistureData,
      vegetationData,
      trendsData,
      yieldPrediction,
      coordinates,
      loading,
      selectedCrop,
      setSelectedCrop
    };

    switch(activeTab) {
      case 0: // Огляд
        return <OverviewTab {...commonProps} alerts={alerts} setAlerts={setAlerts} />;
      case 1: // Аналітика
        return <AnalyticsTab {...commonProps} />;
      case 2: // Рекомендації
        return <UpdatedRecommendationsTab {...commonProps} />;
      case 3: // Прогнози
        return <ForecastsTab {...commonProps} navigate={navigate} />;
      case 4: // Звіти
        return <ReportsTab {...commonProps} onExportData={handleExportData} lastUpdated={lastUpdated} realTimeUpdates={realTimeUpdates} alerts={alerts} />;

      default:
        return <Typography>Контент для табу {activeTab}</Typography>;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 8 }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #31572c 0%, #4f772d 50%, #90a955 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <img 
                src="/icons/agriculture.svg" 
                alt="Agriculture Icon"
                style={{ 
                  width: '48px', 
                  height: '48px',
                  objectFit: 'contain',
                  marginRight: '16px'
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
              AgroCast — метеодані для аграрних рішень
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {capitalizeFirstLetter(city)} • {UkrainianWeekday(capitalizeFirstLetter(new Date().toLocaleDateString('uk-UA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })))}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Оновити дані">
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading}
                sx={{ color: 'white' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          {tabLabels.map((tab, index) => (
            <Tab 
              key={index} 
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Main Content */}
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          gap: 3
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="textSecondary">
            Завантаження даних...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Отримуємо актуальну інформацію для міста {capitalizeFirstLetter(city)}
          </Typography>
        </Box>
      ) : (
        renderTabContent()
      )}

      {/* Status Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 1, 
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1000
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Останнє оновлення: {lastUpdated.toLocaleString('uk-UA')}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                       
              {coordinates && (
                <Typography variant="caption" color="textSecondary">
                  {coordinates.lat.toFixed(3)}°, {coordinates.lon.toFixed(3)}°
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Paper>
    </Container>
  );
};

const OverviewTab = ({ 
  city, weatherData, forecastData, airQualityData, moistureData, vegetationData, 
  coordinates, loading, alerts, setAlerts, selectedCrop 
}) => {
  return (
    <Grid container spacing={3}>
      {alerts.length > 0 && (
        <Grid item xs={12}>
          <AlertsPanel 
            alerts={alerts} 
            onDismiss={(id) => setAlerts(alerts.filter(a => a.id !== id))}
            onDismissAll={() => setAlerts([])}
          />
        </Grid>
      )}
      
      {/* Основні картки для огляду */}
      <Grid item xs={12} md={6} lg={4}>
        <WeatherDetailsCard 
          city={city} 
          currentWeather={weatherData}
        />
      </Grid>
      
      <Grid item xs={12} md={6} lg={4}>
        <AirQualityCard 
          airQuality={airQualityData}
        />
      </Grid>
      
      <Grid item xs={12} md={6} lg={4}>
        <SoilMoistureCard
          city={city}
          lat={coordinates.lat}
          lon={coordinates.lon}
          moistureData={moistureData}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <VegetationIndicesCard
          city={city}
          vegetationData={vegetationData}
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <RainPredictionCard 
          city={city} 
          forecastData={forecastData}
        />
      </Grid>      
    </Grid>
  );
};

const UpdatedRecommendationsTab = ({ 
  city, weatherData, moistureData, vegetationData, forecastData,
  selectedCrop, setSelectedCrop
}) => {
  const cropOptions = ['пшениця', 'кукурудза', 'соняшник', 'ріпак', 'соя', 'картопля'];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Заголовок секції з вибором культури */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              <Recommend color="primary" />
              Рекомендації для сільськогосподарських робіт — {capitalizeFirstLetter(city)}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {cropOptions.map((crop) => (
                <Chip
                  key={crop}
                  label={crop}
                  variant={selectedCrop === crop ? 'filled' : 'outlined'}
                  color={selectedCrop === crop ? 'primary' : 'default'}
                  onClick={() => setSelectedCrop(crop)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        </Grid>
               
        
        {/* Другий рядок - специфічні рекомендації */}
        <Grid item xs={12} md={6} lg={4}>
          <IrrigationRecommendationCard
            city={city}
            crop={selectedCrop}
            moistureData={moistureData}
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <CropHealthRecommendationCard
            vegetationData={vegetationData}
            weatherData={weatherData}
            crop={selectedCrop}
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <WeatherBasedRecommendationCard
            weatherData={weatherData}
            forecastData={forecastData}
            city={city}
          />
        </Grid>
                     
        <Grid item xs={12} md={12}>
          <FieldOperationsCard
            city={city}
            weatherData={weatherData}
            crop={selectedCrop}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const AnalyticsTab = ({ 
  weatherData, moistureData, vegetationData, trendsData,
  city, forecastData, hourlyForecastData, extendedForecastData, 
  monthlyForecastData, loading
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <AnalyticsOverview
          weatherData={weatherData}
          moistureData={moistureData}
          vegetationData={vegetationData}
          trendsData={trendsData}
          city={city}
          forecastData={forecastData}
          hourlyForecastData={hourlyForecastData}
          extendedForecastData={extendedForecastData}
          monthlyForecastData={monthlyForecastData}
          loading={loading}
        />
      </Grid>    
    </Grid>
  );
};

const ForecastsTab = ({ 
  city, forecastData, hourlyForecastData, extendedForecastData, monthlyForecastData, loading, navigate 
}) => {
  const handleViewHourly = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('city', city);
    searchParams.set('tab', WEATHER_TABS.HOURLY.toString());
    
    navigate(`/weather?${searchParams.toString()}`);
  };

  const handleViewTenDay = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('city', city);
    searchParams.set('tab', WEATHER_TABS.TEN_DAY.toString());
    
    navigate(`/weather?${searchParams.toString()}`);
  };

  const getTodayHourlyData = () => {
    if (!hourlyForecastData || !Array.isArray(hourlyForecastData)) return [];
    
    const today = new Date();
    const todayString = today.toDateString();
    
    return hourlyForecastData
      .filter(hour => {
        const hourDate = new Date(hour.time);
        return hourDate.toDateString() === todayString && hourDate >= today;
      })
      .slice(0, 12);
  };

  const todayHourlyData = getTodayHourlyData();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <HourlyForecastPreview
                hourlyData={todayHourlyData}
                hourlyLoading={loading}
                hourlyError={hourlyForecastData === null ? "Не вдалося завантажити погодинний прогноз" : null}
                onViewHourly={handleViewHourly}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <TenDayForecastPreview
                extendedData={extendedForecastData}
                loading={loading}
                error={extendedForecastData === null ? "Не вдалося завантажити 10-денний прогноз" : null}
                onViewTenDay={handleViewTenDay}
              />
            </Box>            
          </CardContent>
      </Grid>
    </Grid>
  );
};

const ReportsTab = ({ 
  city, onExportData, lastUpdated, 
  realTimeUpdates, alerts, weatherData, moistureData,
  vegetationData, trendsData, yieldPrediction, airQualityData
}) => {
  return (
    <ReportsSection
      city={city}
      onExportData={onExportData}
      lastUpdated={lastUpdated}
      realTimeUpdates={realTimeUpdates}
      alerts={alerts}
      weatherData={weatherData}
      moistureData={moistureData}
      vegetationData={vegetationData}
      trendsData={trendsData}
      yieldPrediction={yieldPrediction}
      airQualityData={airQualityData}
    />
  );
};

export default Dashboard;