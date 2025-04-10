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

// Мепінг кодів погоди Open-Meteo до іконок
const weatherCodeToIcon = {
  // Ясно
  0: { icon: SunnyIcon, label: 'Ясно' },
  1: { icon: SunnyIcon, label: 'Переважно ясно' },
  
  // Хмарно
  2: { icon: PartlyCloudyIcon, label: 'Мінлива хмарність' },
  3: { icon: CloudyIcon, label: 'Хмарно' },
  
  // Туман
  45: { icon: FogIcon, label: 'Туман' },
  48: { icon: FogIcon, label: 'Іній' },
  
  // Мряка
  51: { icon: DrizzleIcon, label: 'Слабка мряка' },
  53: { icon: DrizzleIcon, label: 'Помірна мряка' },
  55: { icon: DrizzleIcon, label: 'Сильна мряка' },
  56: { icon: DrizzleIcon, label: 'Слабка морозна мряка' },
  57: { icon: DrizzleIcon, label: 'Сильна морозна мряка' },
  
  // Дощ
  61: { icon: DrizzleIcon, label: 'Слабкий дощ' },
  63: { icon: RainIcon, label: 'Помірний дощ' },
  65: { icon: RainIcon, label: 'Сильний дощ' },
  66: { icon: RainIcon, label: 'Слабкий крижаний дощ' },
  67: { icon: RainIcon, label: 'Сильний крижаний дощ' },
  
  // Сніг
  71: { icon: SnowIcon, label: 'Слабкий сніг' },
  73: { icon: SnowIcon, label: 'Помірний сніг' },
  75: { icon: SnowIcon, label: 'Сильний сніг' },
  77: { icon: SnowIcon, label: 'Снігова крупа' },
  
  // Зливи
  80: { icon: RainIcon, label: 'Слабкі зливи' },
  81: { icon: RainIcon, label: 'Помірні зливи' },
  82: { icon: RainIcon, label: 'Сильні зливи' },
  85: { icon: SnowIcon, label: 'Слабкий сніг' },
  86: { icon: SnowIcon, label: 'Сильний сніг' },
  
  // Гроза
  95: { icon: ThunderstormIcon, label: 'Гроза' },
  96: { icon: ThunderstormIcon, label: 'Гроза зі слабким градом' },
  99: { icon: ThunderstormIcon, label: 'Гроза з сильним градом' },
};

// Резервний мепінг на основі текстових описів (на випадок, якщо код погоди недоступний)
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

function getWeatherIcon(conditionData) {
  // Спочатку перевіряємо, чи є conditionData числовим кодом (від Open-Meteo)
  if (typeof conditionData === 'number' && weatherCodeToIcon[conditionData]) {
    return weatherCodeToIcon[conditionData];
  }
  
  // Якщо conditionData - це рядок (текстовий опис)
  if (typeof conditionData === 'string') {
    const lowerDescription = conditionData.toLowerCase();
    
    // Перевіряємо на наявність ключових слів
    for (const [type, config] of Object.entries(weatherIconMap)) {
      if (config.keywords.some(keyword => lowerDescription.includes(keyword))) {
        return { icon: config.icon, label: config.label };
      }
    }
  }
  
  // Якщо це рядок id іконки з Open-Meteo API (sunny, partly_cloudy, тощо)
  if (typeof conditionData === 'string' && weatherIconMap[conditionData]) {
    return {
      icon: weatherIconMap[conditionData].icon,
      label: weatherIconMap[conditionData].label
    };
  }
  
  // За замовчуванням
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
  // Тепер condition може бути або числовим кодом, або текстовим описом
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