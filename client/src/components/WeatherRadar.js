import React from 'react';
import { Typography, Paper } from '@mui/material';

function WeatherRadar({ city }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Погодний радар для {city}
      </Typography>
      <Typography>
        Тут буде відображено радарні дані про погоду.
      </Typography>
    </Paper>
  );
}

export default WeatherRadar;