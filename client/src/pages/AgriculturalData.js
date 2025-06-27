import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Paper, Typography, Button } from '@mui/material';
import { 
  WaterDrop as WaterDropIcon, 
  Grass as GrassIcon, 
  CalendarMonth as CalendarIcon, 
  Science as ScienceIcon 
} from '@mui/icons-material';
import { capitalizeFirstLetter } from '../components/utils/weatherUtils';

function AgriculturalData({ city }) {
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={1}>
          Агрономічні дані - {capitalizeFirstLetter(city)}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Аналіз метеоданих та оптимізація сільськогосподарських процесів
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Модуль оцінки зони ризику вологи */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            component={Link} 
            to="/agricultural/moisture-risk" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3
              }
            }}
          >
            <WaterDropIcon color="primary" fontSize="large" sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="medium" mb={1}>
              Оцінка зони ризику вологи
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              Аналіз вологості ґрунту та визначення зон ризику посухи або перезволоження
            </Typography>
            <Button variant="outlined" color="primary" fullWidth>
              Переглянути
            </Button>
          </Paper>
        </Grid>
        
        {/* Модуль Індекси вегетації - тепер активний */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            component={Link} 
            to="/agricultural/vegetation" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3
              }
            }}
          >
            <GrassIcon color="success" fontSize="large" sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="medium" mb={1}>
              Індекси вегетації
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              Оцінка стану рослинності на основі супутникових даних (NDVI, EVI)
            </Typography>
            <Button variant="outlined" color="success" fullWidth>
              Переглянути
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ScienceIcon color="info" fontSize="large" sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="medium" mb={1}>
              Рекомендації по агрооперація
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              Рекомендації щодо посіву, обробки та поливу на основі метеоданих
            </Typography>
            <Button variant="outlined" color="primary" fullWidth disabled>
              Скоро буде доступно
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CalendarIcon color="secondary" fontSize="large" sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight="medium" mb={1}>
              Календар польових робіт
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              Планування сільськогосподарських робіт з урахуванням погодних умов
            </Typography>
            <Button variant="outlined" color="primary" fullWidth disabled>
              Скоро буде доступно
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AgriculturalData;