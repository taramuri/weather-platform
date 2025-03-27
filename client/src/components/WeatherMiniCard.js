import React from 'react';
import { SunIcon, CloudIcon } from 'lucide-react';

const WeatherMiniCard = ({ 
  date, 
  minTemp, 
  maxTemp, 
  condition = 'cloudy' 
}) => {
  const getWeatherIcon = () => {
    switch(condition) {
      case 'sunny': 
        return <SunIcon size={40} color="#FFC107" />;
      case 'cloudy': 
      default: 
        return <CloudIcon size={40} color="#9E9E9E" />;
    }
  };

  return (
    <div className="w-[200px] border rounded-lg shadow-md bg-gray-100">
      <div className="flex flex-col items-center p-1.5">
        <h2 className="text-sm font-bold mb-1">
          {date}
        </h2>
        
        <div className="my-1">
          {getWeatherIcon()}
        </div>
        
        <div className="flex justify-center items-center gap-1">
          <span className="text-xs text-gray-500">
            Мін. {minTemp}°
          </span>
          <span className="text-xs font-bold">
            Макс. {maxTemp}°
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherMiniCard;