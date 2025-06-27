import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import AgriculturalData from './pages/AgriculturalData';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { TemperatureProvider } from './context/TemperatureContext';
import VegetationIndicesPage from './pages/VegetationIndicesPage';
import AirQualityDetails from './components/details/AirQualityDetails';
import customTheme from './theme'

function App() {
  const [city, setCity] = useState('Київ');
  const [loading, setLoading] = useState(false);

  const handleCityChange = (newCity) => {
    setLoading(true);
    setCity(newCity);
  };

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <TemperatureProvider>
      <Router>
        <div className="app">
          <Navbar onCityChange={handleCityChange} loading={loading} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard city={city} setLoading={setLoading} />} />
              <Route path="/weather" element={<Weather city={city} setLoading={setLoading}/>} />
              <Route path="/agricultural" element={<AgriculturalData city={city} setLoading={setLoading} />} />
              <Route path="/agricultural/vegetation" element={<VegetationIndicesPage city={city} />} />
              <Route path="/air-quality" element={<AirQualityDetails city={city} />} />
            </Routes>
          </main>
        </div>
      </Router>
      </TemperatureProvider>
    </ThemeProvider>
  );
}

export default App;