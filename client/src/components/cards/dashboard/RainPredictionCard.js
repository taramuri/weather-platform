import React from 'react';
import { 
  Card, CardContent, Typography, Box, Grid, LinearProgress
} from '@mui/material';
import { CloudQueue, WaterDrop } from '@mui/icons-material';

const RainPredictionCard = ({ city, forecastData }) => {  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }} gutterBottom> 
          <CloudQueue sx={{ mr: 1 }} />
          Прогноз дощу
        </Typography>      

        {/* Прогноз по днях */}
        <Box sx={{ flex: 1 }}>
          {forecastData && forecastData.length > 0 ? (
            <Grid container spacing={2}>
              {forecastData.slice(0, 3).map((day, index) => (
                <Grid item xs={4} key={index}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      {index === 0 ? 'Сьогодні' : index === 1 ? 'Завтра' : 'Післязавтра'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                      <WaterDrop 
                        sx={{ 
                          color: day.precipProbability > 60 ? '#2196f3' : day.precipProbability > 30 ? '#ff9800' : '#9e9e9e',
                          fontSize: 16 
                        }} 
                      />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {Math.round(day.precipProbability || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={day.precipProbability || 0} 
                      sx={{ 
                        height: 4,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: day.precipProbability > 60 ? '#2196f3' : 
                                         day.precipProbability > 30 ? '#ff9800' : '#4caf50'
                        }
                      }} 
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                      {day.precipProbability > 60 ? 'Ймовірний дощ' : 
                       day.precipProbability > 30 ? 'Можливий дощ' : 'Без дощу'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>            
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CloudQueue sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                Дані недоступні
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RainPredictionCard;