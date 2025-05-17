import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

function MoistureForecastChart({ forecastData }) {
  if (!forecastData || forecastData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          Немає даних про прогноз вологості
        </Typography>
      </Box>
    );
  }

  // Форматування дати для відображення на осі X
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  // Підготовка даних для графіка
  const chartData = forecastData.map(day => ({
    date: formatDate(day.date),
    moisture: day.soil_moisture,
    precipitation: day.precipitation,
    probability: day.probability,
    optimal_min: day.optimal_min,
    optimal_max: day.optimal_max
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Перевірка перед доступом до властивостей
      const moisture = payload[0]?.value !== undefined ? payload[0].value : 'N/A';
      const precipitation = payload[1]?.value !== undefined ? payload[1].value : 'N/A';
      const probability = payload[2]?.value !== undefined ? payload[2].value : 'N/A';
      
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 1.5, 
            bgcolor: 'background.paper', 
            borderRadius: 1 
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>
            {label}
          </Typography>
          <Box>
            {moisture !== 'N/A' && (
              <Typography variant="body2" color="primary.main">
                Вологість ґрунту: {moisture}%
              </Typography>
            )}
            {precipitation !== 'N/A' && (
              <Typography variant="body2" color="#8884d8">
                Опади: {precipitation} мм
              </Typography>
            )}
            {probability !== 'N/A' && (
              <Typography variant="body2" color="#82ca9d">
                Ймовірність опадів: {probability}%
              </Typography>
            )}
          </Box>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            label={{ 
              value: 'Дата', 
              position: 'insideBottomRight', 
              offset: -10 
            }} 
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            domain={[0, 100]}
            label={{ 
              value: 'Вологість ґрунту, %', 
              angle: -90, 
              position: 'insideLeft' 
            }} 
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={[0, 30]}
            label={{ 
              value: 'Опади, мм', 
              angle: 90, 
              position: 'insideRight' 
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Оптимальний діапазон вологості */}
          <ReferenceLine 
            yAxisId="left" 
            y={chartData[0].optimal_min} 
            stroke="#ff9800" 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Мін. оптимум', 
              position: 'insideBottomLeft', 
              fill: '#ff9800', 
              fontSize: 12 
            }} 
          />
          <ReferenceLine 
            yAxisId="left" 
            y={chartData[0].optimal_max} 
            stroke="#ff9800" 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Макс. оптимум', 
              position: 'insideTopLeft', 
              fill: '#ff9800', 
              fontSize: 12 
            }} 
          />
          
          {/* Графік вологості */}
          <defs>
            <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#2196f3" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="moisture" 
            name="Вологість ґрунту" 
            stroke="#2196f3" 
            fill="url(#moistureGradient)" 
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          
          {/* Графік опадів */}
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="precipitation" 
            name="Опади" 
            stroke="#8884d8" 
            fill="#8884d8"
            fillOpacity={0.3}
          />
          
          {/* Графік ймовірності опадів */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="probability" 
            name="Ймовірність опадів" 
            stroke="#82ca9d"
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default MoistureForecastChart;