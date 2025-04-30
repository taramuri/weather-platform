import React from 'react';
import { Box, Grid, Typography } from '@mui/material';

function TenDayWeatherDetail({ icon, label, value }) {
  return (
    <Grid item xs={6}>
      <Box display="flex" alignItems="center">
        <Box sx={{ mr: 1 }}>{typeof icon === 'string' ? <Typography variant="h5">{icon}</Typography> : icon}</Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {value}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );
}

export default TenDayWeatherDetail;