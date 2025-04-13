import React from 'react';
import { Typography, Paper } from '@mui/material';

function TenDayForecast({ city }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        10-денний прогноз погоди для {city}
      </Typography>
      <Typography>
        Тут буде відображено прогноз погоди на 10 днів.
      </Typography>
    </Paper>
  );
}

export default TenDayForecast;