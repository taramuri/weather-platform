import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

function WeatherDetailCard({ icon, title, value }) {
  return (
    <Paper sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        {icon}
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      <Typography variant="h6" sx={{ ml: 4, fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default WeatherDetailCard;