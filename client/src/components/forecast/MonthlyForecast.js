import React from 'react';
import { Typography, Paper } from '@mui/material';

function MonthlyForecast({ city }) {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Щомісячний прогноз погоди для {city}
      </Typography>
      <Typography>
        Тут буде відображено прогноз погоди на місяць.
      </Typography>
    </Paper>
  );
}

export default MonthlyForecast;