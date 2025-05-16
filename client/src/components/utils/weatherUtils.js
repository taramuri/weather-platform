import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

/**
 * Maps weather condition codes or descriptions to icon filenames
 * @param {number|string} condition - The weather condition code or description
 * @param {boolean} isNight - Whether to use night icons (optional)
 * @param {Date|string|null} currentTime - Current time (optional)
 * @param {Date|string|null} sunrise - Sunrise time (optional)
 * @param {Date|string|null} sunset - Sunset time (optional)
 * @returns {string} Icon filename without extension
 */
export const getWeatherIcon = (condition, isNight = false, currentTime = null, sunrise = null, sunset = null) => {
  if (currentTime !== null && sunrise !== null && sunset !== null) {
    isNight = isNightTime(currentTime, sunrise, sunset);
  }

  if (typeof condition === 'number') {
    // Детальніше розбиття для точніших іконок за кодами WMO
    if (condition === 0) return isNight ? 'moon' : 'sunny'; // Clear sky
    if (condition === 1) return isNight ? 'moon' : 'sunny'; // Mainly clear
    if (condition === 2) return isNight ? 'partly_cloudy_night' : 'partly_cloudy'; // Partly cloudy
    if (condition === 3) return 'cloudy'; // Overcast
    
    // Туман і серпанок
    if (condition === 45) return 'mist'; // Fog
    if (condition === 48) return 'fog'; // Depositing rime fog
    
    // Дрібний дощ
    if (condition === 51) return 'light_rain'; // Light drizzle
    if (condition === 53 || condition === 55) return 'rainy'; // Moderate/dense drizzle
    
    // Морозний дощ
    if (condition === 56 || condition === 57) return 'freezing_rain'; // Freezing drizzle
    
    // Дощ
    if (condition === 61) return 'light_rain'; // Slight rain
    if (condition === 63) return 'rainy'; // Moderate rain
    if (condition === 65) return 'heavy_rain'; // Heavy rain
    
    // Крижаний дощ
    if (condition === 66 || condition === 67) return 'freezing_rain'; // Freezing rain
    
    // Сніг
    if (condition === 71) return 'light_snow'; // Slight snow
    if (condition === 73) return 'snow'; // Moderate snow
    if (condition === 75) return 'heavy_snow'; // Heavy snow
    if (condition === 77) return 'sleet'; // Snow grains
    
    // Зливи
    if (condition === 80) return 'light_rain'; // Slight rain showers
    if (condition === 81) return 'rainy'; // Moderate rain showers
    if (condition === 82) return 'heavy_rain'; // Violent rain showers
    
    // Снігові зливи
    if (condition === 85) return 'light_snow'; // Slight snow showers
    if (condition === 86) return 'heavy_snow'; // Heavy snow showers
    
    // Гроза
    if (condition === 95) return 'thunderstorm'; // Thunderstorm
    if (condition === 96 || condition === 99) return 'thunderstorm_hail'; // Thunderstorm with hail
    
    return 'cloudy'; // Default
  }
    
  if (!condition) return 'cloudy';
  
  const lowerDescription = condition.toLowerCase();
  
  const conditions = {
    sunny: ['clear', 'sunny', 'sun', 'ясно', 'переважно ясно', 'ясн'],
    partly_cloudy: ['partly cloudy', 'few clouds', 'частково хмарно', 'малохмарно', 'мінлива хмарність'],
    cloudy: ['cloudy', 'cloud', 'overcast', 'хмарно', 'хмарн'],
    mist: ['mist', 'імла', 'серпанок'],
    fog: ['fog', 'foggy', 'туман', 'туманно'],
    frost: ['frost', 'іней', 'заморозки'],
    light_rain: ['light rain', 'slight rain', 'drizzle', 'слабкий дощ', 'мрячка', 'мряка'],
    rainy: ['rain', 'rainy', 'moderate rain', 'дощ', 'дощовий'],
    heavy_rain: ['heavy rain', 'сильний дощ', 'злива'],
    freezing_rain: ['freezing rain', 'icy rain', 'крижаний дощ', 'льодяний дощ'],
    light_snow: ['slight snow', 'light snow', 'слабкий сніг'],
    snow: ['snow', 'snowy', 'moderate snow', 'сніг', 'сніговий'],
    heavy_snow: ['heavy snow', 'сильний сніг', 'хуртовина'],
    sleet: ['sleet', 'сніжна крупа', 'мокрий сніг'],
    rain_snow: ['rain and snow', 'дощ зі снігом'],
    thunderstorm: ['thunder', 'thunderstorm', 'lightning', 'гроза', 'блискавка'],
    thunderstorm_hail: ['hail', 'thunderstorm with hail', 'гроза з градом', 'град'],
    hail: ['hail', 'град'],
    wind: ['wind', 'windy', 'вітер', 'вітряно'],
    tornado: ['tornado', 'торнадо'],
    hurricane: ['hurricane', 'typhoon', 'ураган', 'тайфун']
  };

  for (const [condition, keywords] of Object.entries(conditions)) {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {      
      if (isNight) {
        if (condition === 'sunny') return 'moon';
        if (condition === 'partly_cloudy') return 'partly_cloudy_night';
        if (condition === 'fog') return 'fog_night';
      }
      return condition;
    }
  }
  
  return 'cloudy';
};

export const isNightTime = (currentTime = new Date(), sunrise, sunset) => {
  if (!sunrise || !sunset) return false;
  
  const sunriseTime = sunrise instanceof Date ? sunrise : new Date(sunrise);
  const sunsetTime = sunset instanceof Date ? sunset : new Date(sunset);
  const checkTime = currentTime instanceof Date ? currentTime : new Date();
  
  return checkTime < sunriseTime || checkTime > sunsetTime;
};

export const capitalizeFirstLetter = (string, defaultValue = 'Невідоме місто') => {
  if (!string) return defaultValue;
  
  try {
    return string.charAt(0).toUpperCase() + string.slice(1);
  } catch (error) {
    console.error('Помилка капіталізації тексту:', error);
    return defaultValue;
  }
};

export const formatDateToUkrainianFormat = (date) => {
  return format(date, "EEEE, d MMMM", { locale: uk });
};

export const formatTimeFromISO = (isoString) => {
  if (!isoString || typeof isoString !== 'string') return null;
  
  try {
    const date = new Date(isoString);
    if (isNaN(date)) return null;
    
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Помилка форматування часу:", e);
    return null;
  }
};

export const formatCityName = (city) => {
  const DEFAULT_CITY = "Київ";
  
  if (!city) return DEFAULT_CITY;
  
  try {
    return city.charAt(0).toUpperCase() + city.slice(1);
  } catch (error) {
    console.error('Помилка форматування назви міста:', error);
    return DEFAULT_CITY;
  }
};

export const getSafeCity = (city) => {
  const DEFAULT_CITY = "київ";
  
  if (!city) return DEFAULT_CITY;
  
  try {
    return city.toLowerCase();
  } catch (error) {
    console.error('Помилка отримання безпечного значення міста:', error);
    return DEFAULT_CITY;
  }
};