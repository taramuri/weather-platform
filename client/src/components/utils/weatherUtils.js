import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export const getWeatherCondition = (code) => {
    if (typeof code === 'number') {
      if (code === 0 || code === 1) return 'sunny'; 
      if (code === 2 || code === 3) return 'partly_cloudy'; 
      if (code >= 45 && code <= 48) return 'cloudy'; 
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'; 
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
      if (code >= 95 && code <= 99) return 'thunderstorm'; 
      return 'cloudy'; 
    } 
      
    if (!code) return 'cloudy';
    
    const lowerDescription = code.toLowerCase();
    
    const conditions = {
      sunny: ['clear', 'sunny', 'sun', 'ясно'],
      cloudy: ['cloudy', 'cloud', 'overcast', 'хмарно'],
      rainy: ['rain', 'rainy', 'shower', 'drizzle', 'дощ'],
      thunderstorm: ['thunder', 'thunderstorm', 'lightning', 'гроза'],
      snow: ['snow', 'snowy', 'sleet', 'сніг'],
      partly_cloudy: ['partly cloudy', 'few clouds', 'частково хмарно']
    };
  
    for (const [condition, keywords] of Object.entries(conditions)) {
      if (keywords.some(keyword => lowerDescription.includes(keyword))) {
        return condition;
      }
    }
    
    return 'cloudy';
  };
  
  export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
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