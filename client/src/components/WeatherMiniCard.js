import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  WbCloudy as PartlyCloudyIcon,
  Thunderstorm as ThunderstormIcon,
  AcUnit as SnowIcon,
  BeachAccess as RainIcon,
  WaterDrop as DrizzleIcon,
  Opacity as HumidIcon,
  FilterDrama as FogIcon
} from '@mui/icons-material';

// Enhanced and more comprehensive mapping of weather conditions to icons
const weatherIconMap = {
  'sunny': {
    keywords: ['clear', 'sunny', 'sun', 'fair', 'bright', 'ясно', 'сонячно'],
    icon: SunnyIcon,
    label: 'Сонячно'
  },
  'partly_cloudy': {
    keywords: ['partly cloudy', 'few clouds', 'mostly sunny', 'some clouds', 'невелика хмарність'],
    icon: PartlyCloudyIcon,
    label: 'Мінлива хмарність'
  },
  'cloudy': {
    keywords: ['cloudy', 'cloud', 'overcast', 'grey', 'mostly cloudy', 'covered', 'хмарно', 'хмарність'],
    icon: CloudyIcon,
    label: 'Хмарно'
  },
  'thunderstorm': {
    keywords: ['thunder', 'thunderstorm', 'lightning', 'storm', 'electric', 'гроза', 'блискавка'],
    icon: ThunderstormIcon,
    label: 'Гроза'
  },
  'snow': {
    keywords: ['snow', 'snowy', 'sleet', 'freezing', 'wintery', 'blizzard', 'сніг', 'снігопад'],
    icon: SnowIcon,
    label: 'Сніг'
  },
  'rain': {
    keywords: ['rain', 'rainy', 'shower', 'precipitation', 'downpour', 'rainfall', 'дощ', 'місцями дощ'],
    icon: RainIcon,
    label: 'Дощ'
  },
  'drizzle': {
    keywords: ['drizzle', 'light rain', 'sprinkle', 'mizzle', 'невеликий дощ'],
    icon: DrizzleIcon,
    label: 'Невеликий дощ'
  },
  'fog': {
    keywords: ['mist', 'fog', 'haze', 'misty', 'foggy', 'туман', 'мряка'],
    icon: FogIcon,
    label: 'Туман'
  }
};

function getWeatherIcon(description) {
  if (!description) return { icon: CloudyIcon, label: 'Хмарно' };
  
  // Convert description to lowercase for case-insensitive matching
  const lowerDescription = description.toLowerCase();
 
  // Detailed matching process
  for (const [type, config] of Object.entries(weatherIconMap)) {
    // Check for exact matches first
    if (lowerDescription === type) {
      return { icon: config.icon, label: config.label };
    }
    
    // Then check for keyword matches
    if (config.keywords.some(keyword => lowerDescription.includes(keyword))) {
      return { icon: config.icon, label: config.label };
    }
  }
 
  // Default to cloudy if no match found
  return { icon: CloudyIcon, label: 'Хмарно' };
}

function WeatherMiniCard({
  date,
  minTemp,
  maxTemp,
  condition,
  onClick,
  selected
}) {
  const { icon: WeatherIcon, label } = getWeatherIcon(condition);
  
  return (
    <Card
      sx={{
        minWidth: 150,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        border: selected ? '2px solid primary.main' : 'none',
        '&:hover': { transform: 'scale(1.05)' }
      }}
      onClick={onClick}
    >
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1
      }}>
        <Typography variant="subtitle1">{date}</Typography>
        <WeatherIcon color={selected ? 'primary' : 'action'} sx={{ fontSize: 40 }} />
        <Box display="flex" gap={1}>
          <Typography color="text.secondary">{minTemp}°</Typography>
          <Typography color="text.primary">{maxTemp}°</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default WeatherMiniCard;