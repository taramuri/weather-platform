import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  WbSunny, 
  Grass, 
  Dashboard, 
  LocationOn as LocationIcon 
} from '@mui/icons-material';
import { useTemperature } from '../../context/TemperatureContext';

function Navbar({ onCityChange, loading }) {
  const [inputCity, setInputCity] = useState('Київ');
  const { units, toggleUnits } = useTemperature();

  // Функція для визначення поточного місцезнаходження
  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`http://localhost:5000/api/weather/location?lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data.city) {
              setInputCity(data.city);
              onCityChange(data.city);
            }
          } catch (error) {
            console.error('Помилка отримання міста:', error);
          }
        },
        (error) => {
          console.error('Помилка геолокації:', error);
        }
      );
    }
  };

  const handleSearch = () => {
    onCityChange(inputCity);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a365d' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            АгроМетео Платформа
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              startIcon={<Dashboard />}
            >
              Дашборд
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/weather"
              startIcon={<WbSunny />}
            >
              Погода
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/agricultural"
              startIcon={<Grass />}
            >
              Агродані
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '50%', ml: 3 }}>
          <Tooltip title="Визначити поточне місце">
            <IconButton 
              color="inherit" 
              onClick={detectLocation}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              <LocationIcon />
            </IconButton>
          </Tooltip>
          <TextField
            placeholder="Пошук за назвою міста"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ 
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: 'white',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <Button 
                  variant="contained" 
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Пошук'}
                </Button>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={units === 'fahrenheit'}
                onChange={toggleUnits}
                color="default"
                size="small"
              />
            }
            label={units === 'celsius' ? '°C' : '°F'}
            sx={{ color: 'white' }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;