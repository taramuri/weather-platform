import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function WeatherDetailModal({ open, onClose, dayDetails }) {
  if (!dayDetails) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {new Date(dayDetails.date).toLocaleDateString('uk-UA', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="h4">
            {Math.round(dayDetails.minTemperature)}°C - {Math.round(dayDetails.maxTemperature)}°C
          </Typography>
          <Typography variant="body1">
            {dayDetails.description}
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Typography>Вологість: {dayDetails.humidity}%</Typography>
            <Typography>Макс. вітер: {dayDetails.windSpeed} км/год</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default WeatherDetailModal;