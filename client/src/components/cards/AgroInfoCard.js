import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';

function AgroInfoCard() {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Агрометеорологічна інформація
      </Typography>
      
      <Typography variant="body1" paragraph>
        На основі поточного прогнозу, сьогодні сприятливі умови для польових робіт. Вологість ґрунту оптимальна для вегетації більшості сільськогосподарських культур.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: 4 }}
        >
          Детальніше про агропрогноз
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary"
          sx={{ borderRadius: 4 }}
        >
          Історичні дані
        </Button>
      </Box>
    </Paper>
  );
}

export default AgroInfoCard;