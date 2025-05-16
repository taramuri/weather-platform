import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import AgriculturalData from './pages/AgriculturalData';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { TemperatureProvider } from './context/TemperatureContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', 
    },
    secondary: {
      main: '#1976d2', 
    },
  },
});

function App() {
  const [city, setCity] = useState('Київ');
  const [loading, setLoading] = useState(false);

  const handleCityChange = (newCity) => {
    setLoading(true);
    setCity(newCity);
    // Завантаження закінчиться в компоненті Dashboard після отримання даних
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TemperatureProvider>
      <Router>
        <div className="app">
          <Navbar onCityChange={handleCityChange} loading={loading} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard city={city} setLoading={setLoading} />} />
              <Route path="/weather" element={<Weather city={city} setLoading={setLoading}/>} />
              <Route path="/agricultural" element={<AgriculturalData />} />
            </Routes>
          </main>
        </div>
      </Router>
      </TemperatureProvider>
    </ThemeProvider>
  );
}

export default App;