import React, { createContext, useState, useContext } from 'react';

export const TemperatureContext = createContext();

export const TemperatureProvider = ({ children }) => {
  const [units, setUnits] = useState('celsius');

  const celsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
  };

  const fahrenheitToCelsius = (fahrenheit) => {
    return (fahrenheit - 32) * 5/9;
  };

  const formatTemperature = (celsius) => {
    if (units === 'celsius') {
      return Math.round(celsius);
    } else {
      return Math.round(celsiusToFahrenheit(celsius));
    }
  };

  const getUnitSymbol = () => {
    return units === 'celsius' ? '°C' : '°F';
  };

  const toggleUnits = () => {
    setUnits(units === 'celsius' ? 'fahrenheit' : 'celsius');
  };

  return (
    <TemperatureContext.Provider 
      value={{ 
        units, 
        formatTemperature, 
        celsiusToFahrenheit, 
        fahrenheitToCelsius,
        getUnitSymbol,
        toggleUnits 
      }}
    >
      {children}
    </TemperatureContext.Provider>
  );
};

export const useTemperature = () => useContext(TemperatureContext);