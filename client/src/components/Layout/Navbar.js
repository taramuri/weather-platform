import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Avatar,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  WbSunny, 
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useTemperature } from '../../context/TemperatureContext';

const navbarButtonStyles = {
  borderRadius: '8px',
  color: 'white !important',
  textTransform: 'none',
  '&:hover': { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white !important'
  },
  '&.MuiButton-colorInherit': {
    color: 'white !important',
    '&:hover': {
      color: 'white !important',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  '&&': {
    color: 'white',
    '&:hover': {
      color: 'white',
    },
  },
};

function Navbar({ onCityChange, loading }) {
  const DEFAULT_CITY = 'київ';
  const [inputCity, setInputCity] = useState('');
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const { units, toggleUnits } = useTemperature();
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleApiError = (errorMsg, fallbackToDefault = true) => {
    setError(errorMsg);
    setOpenSnackbar(true);
    
    if (fallbackToDefault) {
      handleFallbackToDefaultCity();
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const response = await fetch('http://localhost:5000/api/weather/cities');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCities(data.data.map(city => ({ 
              id: city._id,
              label: city.displayName || city.originalName || 'Невідоме місто',
              originalName: city.originalName || ''
            })));
          } else {
            throw new Error(data.error || 'Не вдалося отримати список міст');
          }
        } else {
          throw new Error(`Помилка запиту: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Помилка завантаження списку міст:', error);
        setCities([
          { id: '1', label: 'Київ', originalName: 'київ' },
          { id: '2', label: 'Львів', originalName: 'львів' },
          { id: '3', label: 'Одеса', originalName: 'одеса' },
          { id: '4', label: 'Харків', originalName: 'харків' },
          { id: '5', label: 'Дніпро', originalName: 'дніпро' },
          { id: '6', label: 'Вінниця', originalName: 'вінниця' },
          { id: '7', label: 'Рівне', originalName: 'рівне' }
        ]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const handleFallbackToDefaultCity = () => {
    try {
      const lastCity = localStorage.getItem('lastCity') || DEFAULT_CITY;
      setInputCity(lastCity);
      
      setTimeout(() => {
        onCityChange(lastCity);
      }, 1000);
    } catch (error) {
      console.error('Помилка під час повернення до міста за замовчуванням:', error);
      setInputCity(DEFAULT_CITY);
      setTimeout(() => {
        onCityChange(DEFAULT_CITY);
      }, 1000);
    }
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`http://localhost:5000/api/weather/location?lat=${latitude}&lon=${longitude}`);
            
            if (!response.ok) {
              throw new Error(`Помилка запиту: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.city) {
              setInputCity(data.city);
              onCityChange(data.city);
            } else {
              throw new Error(data.error || 'Не вдалося визначити місто за координатами');
            }
          } catch (error) {
            console.error('Помилка отримання міста:', error);
            handleApiError('Не вдалося визначити вашу локацію: ' + error.message);
          }
        },
        (error) => {
          console.error('Помилка геолокації:', error);
          
          let errorMessage = 'Не вдалося отримати дозвіл на геолокацію';
          
          if (error.code === 1) {
            errorMessage = 'Доступ до геолокації заборонено. Перевірте налаштування дозволів браузера.';
          } else if (error.code === 2) {
            errorMessage = 'Не вдалося отримати місцезнаходження. Перевірте з\'єднання з інтернетом.';
          } else if (error.code === 3) {
            errorMessage = 'Вичерпано час очікування геолокації. Спробуйте ще раз.';
          }
          
          handleApiError(errorMessage);
        }
      );
    } else {
      handleApiError('Ваш браузер не підтримує геолокацію');
    }
  };

  const validateAndSearchCity = async (cityValue) => {
    if (!cityValue) {
      handleApiError('Назва міста не може бути порожньою', false);
      return;
    }
    
    let cityToSearch = cityValue;
    
    if (typeof cityValue === 'object' && cityValue !== null) {
      cityToSearch = cityValue.originalName || cityValue.label || '';
    }
    
    if (!cityToSearch.trim()) {
      handleApiError('Назва міста не може бути порожньою', false);
      return;
    }
    
    onCityChange(null, true);
    
    try {
      const safeUrl = `http://localhost:5000/api/weather/validate-city/${encodeURIComponent(cityToSearch.trim())}`;
      
      const response = await fetch(safeUrl);
      
      if (!response.ok) {
        throw new Error(`Помилка HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.data.exists) {
          try {
            localStorage.setItem('lastCity', data.data.city.originalName);
          } catch (storageError) {
            console.warn('Не вдалося зберегти місто в localStorage:', storageError);
          }
          
          onCityChange(data.data.city.originalName);
        } else {
          handleApiError(`Місто "${cityToSearch}" не знайдено. Повертаємось до міста за замовчуванням.`);
          onCityChange(null, false);
        }
      } else {
        handleApiError(data.error || 'Помилка валідації міста. Повертаємось до міста за замовчуванням.');
        onCityChange(null, false);
      }
    } catch (error) {
      console.error('Помилка під час валідації міста:', error);
      handleApiError('Помилка під час пошуку міста: ' + error.message);
      onCityChange(null, false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleSearch = (cityValue) => {
    validateAndSearchCity(cityValue);
  };

  return (
    <>
      <AppBar position="static" sx={{ 
        backgroundColor: '#132a13', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
      }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          {/* Логотип і назва сайту */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                mr: { xs: 1, md: 3 },
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={handleLogoClick}
            >
              <Avatar 
                alt="AgroCast" 
                sx={{ 
                  width: { xs: 32, md: 40 }, 
                  height: { xs: 32, md: 40 }, 
                  mr: { xs: 1, md: 1.5 },
                  backgroundColor: 'transparent',
                  '& img': { 
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%'
                  }
                }}
              >
                <img 
                  src="/icons/main-icon.svg" 
                  alt="AgroCast Logo"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Avatar>
              <Typography 
                variant={isMobile ? "h6" : "h5"}
                component="div" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#ecf39e'
                }}
              >
                AgroCast
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/weather"
                  startIcon={<WbSunny />}
                  sx={navbarButtonStyles}
                >
                  Прогноз погоди
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Пошук і налаштування */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, md: 1 },
            ml: { xs: 1, md: 2 },
            flexGrow: 1, 
            maxWidth: { xs: 'auto', sm: '50%' } 
          }}>
            <Tooltip title="Визначити поточне місце">
              <IconButton 
                color="inherit" 
                onClick={detectLocation}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <LocationIcon />
              </IconButton>
            </Tooltip>
            
            {!isMobile ? (
              <Autocomplete
                freeSolo
                options={cities}
                loading={loadingCities}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option || '';
                  }
                  return option.label || '';
                }}
                onChange={(event, newValue) => {
                  handleSearch(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setInputCity(newInputValue || '');
                }}
                sx={{ 
                  flexGrow: 1
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Пошук за назвою міста"
                    variant="outlined"
                    size="small"
                    fullWidth
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(inputCity);
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {loadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                          <Button 
                            variant="contained" 
                            onClick={() => handleSearch(inputCity)}
                            disabled={loading || !inputCity?.trim()} 
                            sx={{ 
                              ml: 1,
                              bgcolor: '#31572c',
                              '&:hover': {
                                bgcolor: '#4f772d',
                              }
                            }}
                          >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Пошук'}
                          </Button>
                        </React.Fragment>
                      ),
                    }}
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
                  />
                )}
              />
            ) : (
              <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <TextField
                  placeholder="Місто"
                  variant="outlined"
                  size="small"
                  value={inputCity}
                  onChange={(e) => setInputCity(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(inputCity);
                    }
                  }}
                  sx={{ 
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                    },
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={() => handleSearch(inputCity)}
                  disabled={loading || !inputCity?.trim()}
                  size="small"
                  sx={{ 
                    ml: 0.5,
                    minWidth: 'auto',
                    px: { xs: 1, sm: 2 },
                    bgcolor: '#31572c',
                  }}
                >
                  {loading ? <CircularProgress size={16} color="inherit" /> : 'OK'}
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Перемикач одиниць вимірювання */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0.5, sm: 2 } }}>
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
              sx={{ 
                color: 'white',
                mr: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '1rem' }
                }
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Snackbar для відображення помилок */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;