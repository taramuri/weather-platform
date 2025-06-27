import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, Typography, Box, Grid, 
  Skeleton, Button, LinearProgress
} from '@mui/material';
import { 
  Grass, ArrowForward
} from '@mui/icons-material';

const VegetationIndicesCard = ({ city, vegetationData, loading }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/agricultural/vegetation');
  };

  const formatIndexValue = (value, type) => {
    if (value === undefined || value === null) return '---';
    
    switch (type) {
      case 'ndvi':
      case 'evi':
      case 'savi':
      case 'ndwi':
        return value.toFixed(3);
      case 'lai':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getIndexColor = (value, type) => {
    if (type === 'ndvi') {
      if (value > 0.6) return '#4caf50';
      if (value > 0.4) return '#8bc34a';
      if (value > 0.2) return '#ff9800';
      return '#f44336';
    }
    if (type === 'evi') {
      if (value > 0.4) return '#4caf50';
      if (value > 0.3) return '#8bc34a';
      if (value > 0.2) return '#ff9800';
      return '#f44336';
    }
    return '#66bb6a';
  };

  const getIndexPercentage = (value, type) => {
    if (type === 'ndvi') return Math.min(100, Math.max(0, value * 100));
    if (type === 'evi') return Math.min(100, Math.max(0, value * 200));
    if (type === 'savi') return Math.min(100, Math.max(0, value * 120));
    return 50;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ mt: 2, borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!vegetationData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }} gutterBottom>
            <Grass sx={{ mr: 1 }} />
            Індекси вегетації
          </Typography>
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            bgcolor: 'background.default',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider'
          }}>
            <Typography variant="body2" color="textSecondary">
              Дані недоступні для {city}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const indices = vegetationData.indices || {};

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }} gutterBottom>
          <Grass sx={{ mr: 1 }} />
          Індекси вегетації
        </Typography>

        {/* Індекси */}
        <Box sx={{ flex: 1 }}>
          <Grid container spacing={2}>
            {Object.entries(indices).slice(0, 3).map(([key, value]) => (
              <Grid item xs={4} key={key}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    {key.toUpperCase()}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: getIndexColor(value, key),
                    mb: 1
                  }}>
                    {formatIndexValue(value, key)}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={getIndexPercentage(value, key)} 
                    sx={{ 
                      height: 4,
                      borderRadius: 2,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getIndexColor(value, key)
                      }
                    }} 
                  />
                  
                  <Typography variant="caption" color="textSecondary" sx={{ 
                    mt: 0.5, 
                    display: 'block'
                  }}>
                    {value > 0.5 ? 'Добре' : value > 0.3 ? 'Помірно' : 'Низько'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={handleViewDetails}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white !important'
              }
            }}
          >
            Детально
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VegetationIndicesCard;