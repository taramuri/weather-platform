// MoistureRiskMap.jsx - Модифікований без поля пошуку, використовує проп city
import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MoistureRiskMap({ apiUrl = 'http://localhost:5000/api', city, riskZones }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moistureData, setMoistureData] = useState(null);
  const [cityCoordinates, setCityCoordinates] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Очищення шарів карти
  const clearLayers = () => {
    if (!mapInstanceRef.current) return;
    
    // Очищаємо зони вологості
    if (layersRef.current.moistureZones) {
      layersRef.current.moistureZones.forEach(layer => {
        mapInstanceRef.current.removeLayer(layer);
      });
      layersRef.current.moistureZones = null;
    }

    // Очищаємо маркер міста
    if (layersRef.current.cityMarker) {
      mapInstanceRef.current.removeLayer(layersRef.current.cityMarker);
      layersRef.current.cityMarker = null;
    }

    // Очищаємо аналіз
    if (layersRef.current.analysisOverlay) {
      mapInstanceRef.current.removeControl(layersRef.current.analysisOverlay);
      layersRef.current.analysisOverlay = null;
    }
  };

  // Ініціалізація карти
  useEffect(() => {
    const initMap = () => {
      try {
        if (!mapInstanceRef.current && mapRef.current) {
          console.log('Ініціалізація карти');
          
          // Створюємо карту з центром на Україні
          mapInstanceRef.current = L.map(mapRef.current, {
            zoomSnap: 0.25,
            zoomDelta: 0.5,
            wheelDebounceTime: 200,
            zoomControl: false, // Вимикаємо стандартні кнопки масштабування
            attributionControl: false // Вимикаємо напис про attribution
          }).setView([49.0, 31.0], 6);
  
          // Використовуємо чіткий, сучасний шар карти
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(mapInstanceRef.current);
  
          // Додаємо CSS для стилізації компонентів карти
          addCustomMapStyles();
          
          // Позначаємо карту як ініціалізовану
          setMapInitialized(true);
        }
      } catch (error) {
        console.error('Помилка ініціалізації карти:', error);
        setError('Помилка ініціалізації карти. Спробуйте оновити сторінку.');
      }
    };
  
    // Даємо DOM трохи часу для рендеру
    const timer = setTimeout(initMap, 500);
  
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMapInitialized(false);
        } catch (e) {
          console.error('Помилка при видаленні карти:', e);
        }
      }
    };
  }, []);

  // Ефект для оновлення карти при зміні міста
  useEffect(() => {
    if (city && mapInstanceRef.current && mapInitialized) {
      analyzeCity(city);
    }
  }, [city, mapInitialized]);

  // Додавання стилів для карти
  const addCustomMapStyles = () => {
    if (!document.getElementById('moisture-map-styles')) {
      const style = document.createElement('style');
      style.id = 'moisture-map-styles';
      style.innerHTML = `
        /* Стилі для маркера міста */
        .city-marker {
          background-color: transparent;
        }
        .city-marker-container {
          position: relative;
        }
        .city-marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: #e91e63;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        .city-marker-pin:after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 5px 0 0 5px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        .city-marker-pulse {
          background: rgba(233, 30, 99, 0.2);
          border-radius: 50%;
          height: 40px;
          width: 40px;
          position: absolute;
          left: 50%;
          top: 50%;
          margin: -25px 0 0 -20px;
          transform: rotateX(55deg);
          z-index: -1;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.1, 0.1);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.2, 1.2);
            opacity: 0;
          }
        }
        
        /* Стилі для зон вологості */
        .moisture-zone {
          transition: all 0.3s ease;
        }
        .moisture-zone:hover {
          filter: brightness(1.1);
        }
        
        /* Стилі для спливаючих вікон */
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 10px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.2);
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px 15px;
          font-family: 'Arial', sans-serif;
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        .popup-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
          color: #333;
        }
        .popup-value {
          font-size: 13px;
          margin-bottom: 3px;
          color: #555;
        }
        .popup-status {
          font-weight: bold;
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-block;
          margin-top: 2px;
        }
        .popup-status-critical-dry { background: rgba(244, 67, 54, 0.2); color: #d32f2f; }
        .popup-status-dry { background: rgba(255, 152, 0, 0.2); color: #ef6c00; }
        .popup-status-normal { background: rgba(76, 175, 80, 0.2); color: #2e7d32; }
        .popup-status-wet { background: rgba(33, 150, 243, 0.2); color: #1565c0; }
        .popup-status-critical-wet { background: rgba(13, 71, 161, 0.2); color: #0d47a1; }
        
        /* Приховуємо всі елементи керування картою */
        .leaflet-control-container {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Функція для отримання даних вологості для конкретного міста
  const fetchMoistureDataForCity = async (cityName, coordinates) => {
    try {
      // Запит до API для отримання даних вологості конкретного міста
      console.log(`Запит даних про вологість для ${cityName} з API...`);
      const response = await fetch(`${apiUrl}/moisture/moisture?city=${encodeURIComponent(cityName)}&lat=${coordinates[0]}&lon=${coordinates[1]}`);    
      if (!response.ok) {
        throw new Error(`Помилка запиту: ${response.status}`);
      }
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error(result.error || 'Невідома помилка');
      }
  
      console.log('Отримано дані про вологість:', result.data);
      setMoistureData(result.data);
  
      // Відображаємо дані вологості на карті
      renderMoistureData(cityName, coordinates, result.data);
    } catch (error) {
      console.error('Помилка отримання даних вологості:', error);
      
      // Якщо не вдалося отримати дані, використовуємо тестові дані
      console.log('Використання тестових даних вологості для демонстрації');
      
      // Створюємо тестові дані
      const mockData = {
        moisture: 55 + (Math.random() - 0.5) * 20,
        current_moisture: 55 + (Math.random() - 0.5) * 20,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        risk_level: 'normal',
        current_moisture_10_40cm: 50 + (Math.random() - 0.5) * 15,
        current_moisture_40_100cm: 45 + (Math.random() - 0.5) * 20,
        historical_average: 50,
        moisture_difference: 5
      };
      
      // Відображаємо тестові дані
      renderMoistureData(cityName, coordinates, mockData);
      
      if (layersRef.current.cityMarker) {
        layersRef.current.cityMarker.setPopupContent(`
          <div class="popup-title">${cityName}</div>
          <div class="popup-value" style="color: #d32f2f;">Помилка отримання даних вологості</div>
          <div class="popup-value">Використано тестові дані для демонстрації</div>
        `);
      }
      
      setError(`Не вдалося отримати реальні дані вологості з API. Відображено тестові дані для демонстрації.`);
    } finally {
      setLoading(false);
    }
  };

  // Функція аналізу міста
  const analyzeCity = async (cityName) => {
    setLoading(true);
    setError(null);
    
    // Очищаємо всі шари і стан карти
    clearLayers();
    
    try {
      // Спочатку отримуємо координати міста
      console.log(`Пошук координат для міста: ${cityName}...`);
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)},Ukraine&format=json&limit=1`,
        { headers: { 'User-Agent': 'AgroCast Weather App' } }
      );

      const geocodeData = await geocodeResponse.json();

      if (geocodeData && geocodeData.length > 0) {
        const { lat, lon } = geocodeData[0];
        console.log(`Знайдено координати для ${cityName}: ${lat}, ${lon}`);

        const coordinates = [parseFloat(lat), parseFloat(lon)];
        setCityCoordinates(coordinates);

        // Перевіряємо, що карта ініціалізована
        if (!mapInstanceRef.current) {
          throw new Error('Карта не ініціалізована');
        }
        
        // Центруємо карту точно на координати міста
        // і встановлюємо фіксований масштаб
        mapInstanceRef.current.setView(coordinates, 10, { 
          animate: true,
          duration: 1 // Тривалість анімації в секундах
        });
        
        // Забороняємо змінювати масштаб
        mapInstanceRef.current.setMinZoom(10);
        mapInstanceRef.current.setMaxZoom(10);
        
        // Встановлюємо обмеження переміщення, щоб місто завжди було в центрі
        // Це нульове обмеження - карта взагалі не рухається
        const fixedBounds = L.latLngBounds(coordinates, coordinates);
        mapInstanceRef.current.setMaxBounds(fixedBounds);
        
        // Відключаємо всі інтерактивні можливості карти
        mapInstanceRef.current.dragging.disable();
        mapInstanceRef.current.touchZoom.disable();
        mapInstanceRef.current.doubleClickZoom.disable();
        mapInstanceRef.current.scrollWheelZoom.disable();
        mapInstanceRef.current.boxZoom.disable();
        mapInstanceRef.current.keyboard.disable();
        
        // Приховуємо всі контроли
        document.querySelectorAll('.leaflet-control').forEach(el => {
          el.style.display = 'none';
        });
        
        // Додаємо маркер міста
        addCityMarker(cityName, coordinates);
        
        // Отримуємо дані про вологість
        await fetchMoistureDataForCity(cityName, coordinates);
      } else {
        setError(`Не вдалося знайти координати для міста: ${cityName}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Помилка аналізу міста:', error);
      setError(`Помилка геокодування міста: ${error.message}`);
      setLoading(false);
    }
  };

  // Функція для додавання маркера міста
  const addCityMarker = (cityName, coordinates) => {
    if (layersRef.current.cityMarker && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(layersRef.current.cityMarker);
    }

    if (!mapInstanceRef.current) {
      console.error('Карта не ініціалізована при додаванні маркера');
      return;
    }

    // Створюємо стильний маркер для міста
    const customIcon = L.divIcon({
      html: `
        <div class="city-marker-container">
          <div class="city-marker-pin"></div>
          <div class="city-marker-pulse"></div>
        </div>
      `,
      className: 'city-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    // Додаємо маркер з повідомленням про завантаження даних
    try {
      const marker = L.marker(coordinates, { icon: customIcon })
        .addTo(mapInstanceRef.current);

      // Налаштовуємо гарний попап
      const popupOptions = {
        className: 'custom-popup',
        minWidth: 200,
        maxWidth: 300,
        autoPan: true
      };
      
      marker.bindPopup(`
        <div class="popup-title">${cityName}</div>
        <div class="popup-value">Завантаження даних вологості...</div>
      `, popupOptions).openPopup();

      layersRef.current.cityMarker = marker;
    } catch (e) {
      console.error('Помилка при додаванні маркера:', e);
      setError('Не вдалося додати маркер міста на карту');
    }
  };

  // Функція для відображення даних вологості на карті
  const renderMoistureData = (cityName, coordinates, data) => {
    if (!data || (!data.moisture && !data.current_moisture)) {
      setError(`Немає даних про вологість для ${cityName}`);
      return;
    }

    try {
      // Вибираємо поле з даними вологості (в залежності від формату API)
      const moisture = data.moisture || data.current_moisture;
      const timestamp = data.timestamp || data.last_updated;
      
      // Оновлюємо спливаюче вікно маркера з отриманими даними
      if (layersRef.current.cityMarker) {
        const status = getMoistureStatus(moisture);
        const statusClass = getStatusClass(status);
        
        layersRef.current.cityMarker.setPopupContent(`
          <div class="popup-title">${cityName}</div>
          <div class="popup-value">Вологість ґрунту: ${moisture}%</div>
          <div class="popup-status popup-status-${statusClass}">${status}</div>
          <div class="popup-value" style="font-size: 11px; margin-top: 6px;">
            Оновлено: ${new Date(timestamp).toLocaleString('uk-UA')}
          </div>
        `);
      }

      // Створюємо зону вологості навколо міста
      createMoistureZone(cityName, coordinates, moisture);
      
      // Додаємо інформаційне вікно з аналізом
      addMoistureRiskOverlay(cityName, { moisture, timestamp });
    } catch (error) {
      console.error('Помилка відображення даних вологості:', error);
      setError(`Помилка відображення даних вологості: ${error.message}`);
    }
  };

  // Створення зони вологості навколо міста
  const createMoistureZone = (cityName, coordinates, moisture) => {
    if (!mapInstanceRef.current) return;
      
    const color = getMoistureColor(moisture);
    const status = getMoistureStatus(moisture);
    const statusClass = getStatusClass(status);
    
    // Масив для зберігання всіх створених шарів
    const moistureZones = [];
    
    // Створюємо концентричні кола навколо міста
    // Центральне коло (точно в центрі)
    const centerCircle = L.circle(coordinates, {
      radius: 2000, // 2 км радіус
      color: color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.7,
      className: `moisture-zone moisture-zone-${statusClass}`
    }).addTo(mapInstanceRef.current);
    moistureZones.push(centerCircle);
    
    // Внутрішнє коло (5 км)
    const innerCircle = L.circle(coordinates, {
      radius: 5000, // 5 км
      color: color,
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.6,
      className: `moisture-zone moisture-zone-${statusClass}`
    }).addTo(mapInstanceRef.current);
    moistureZones.push(innerCircle);
    
    // Середнє коло (10 км)
    const middleCircle = L.circle(coordinates, {
      radius: 10000, // 10 км
      color: color,
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.4,
      className: `moisture-zone moisture-zone-${statusClass}`
    }).addTo(mapInstanceRef.current);
    moistureZones.push(middleCircle);
    
    // Зовнішнє коло (20 км)
    const outerCircle = L.circle(coordinates, {
      radius: 20000, // 20 км радіус
      color: color,
      weight: 1,
      fillColor: color,
      fillOpacity: 0.2,
      className: `moisture-zone moisture-zone-${statusClass}`
    }).addTo(mapInstanceRef.current);
    moistureZones.push(outerCircle);

    // Додатково створюємо кілька менших кіл рівномірно навколо центру для імітації нерівномірного розподілу вологості
    // Розподіляємо кола по колу з радіусом ~4-8 км від центру
    for (let i = 0; i < 8; i++) {
      // Кут у радіанах (рівномірно розподілені точки по колу)
      const angle = (i / 8) * Math.PI * 2;
      
      // Випадковий радіус від 4 до 8 км
      const radius = 4000 + Math.random() * 4000;
      
      // Розраховуємо координати на колі
      const offsetLat = coordinates[0] + (radius / 111000) * Math.cos(angle);
      const offsetLon = coordinates[1] + (radius / (111000 * Math.cos(coordinates[0] * Math.PI / 180))) * Math.sin(angle);
      
      // Невелика варіація у вологості
      const moistureVariation = moisture + (Math.random() - 0.5) * 10;
      const smallCircleColor = getMoistureColor(moistureVariation);
      const smallCircleStatus = getMoistureStatus(moistureVariation);
      const smallCircleStatusClass = getStatusClass(smallCircleStatus);
      
      // Створюємо маленьке коло
      const smallCircle = L.circle([offsetLat, offsetLon], {
        radius: 2000 + Math.random() * 2000, // 2-4 км
        color: smallCircleColor,
        weight: 1,
        fillColor: smallCircleColor,
        fillOpacity: 0.5,
        className: `moisture-zone moisture-zone-${smallCircleStatusClass}`
      }).addTo(mapInstanceRef.current);
      
      // Додаємо попап з інформацією про вологість
      smallCircle.bindPopup(`
        <div class="popup-title">Зона вологості</div>
        <div class="popup-value">Вологість ґрунту: ${moistureVariation.toFixed(1)}%</div>
        <div class="popup-status popup-status-${smallCircleStatusClass}">
          ${smallCircleStatus}
        </div>
      `, { className: 'custom-popup' });
      
      moistureZones.push(smallCircle);
    }

    // Зберігаємо всі створені шари
    layersRef.current.moistureZones = moistureZones;
  };

  // Додавання інформаційного вікна з аналізом вологості
  const addMoistureRiskOverlay = (cityName, data) => {
    if (!mapInstanceRef.current) return;
      
    if (layersRef.current.analysisOverlay) {
      mapInstanceRef.current.removeControl(layersRef.current.analysisOverlay);
    }
    
    const analysisControl = L.control({ position: 'bottomright' });
    
    analysisControl.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'analysis-overlay');
      const moisture = data.moisture;
      const status = getMoistureStatus(moisture);
      const statusClass = getStatusClass(status);
      
      div.innerHTML = `
        <div style="background-color: rgba(255, 255, 255, 0.95); padding: 15px; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.15); min-width: 250px; max-width: 300px; font-family: Arial, sans-serif; margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            Аналіз вологості ґрунту: ${cityName}
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #555;">Поточний стан:</div>
            <div style="display: inline-block; padding: 4px 10px; border-radius: 4px; background-color: ${getMoistureColor(moisture)}; color: white; font-weight: bold;">
              ${status} (${moisture}%)
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #555;">Рекомендації:</div>
            <div style="font-size: 13px; color: #444; line-height: 1.4;">
              ${getMoistureRecommendation(moisture)}
            </div>
          </div>
          
          <div style="font-size: 11px; color: #777; margin-top: 8px;">
            Останнє оновлення: ${new Date(data.timestamp).toLocaleString('uk-UA')}
          </div>
        </div>
      `;
      
      return div;
    };
    
    analysisControl.addTo(mapInstanceRef.current);
    layersRef.current.analysisOverlay = analysisControl;
  };

  // Отримання кольору вологості
  const getMoistureColor = (moisture) => {
    if (moisture < 30) return '#f44336'; // Критично сухо - червоний
    if (moisture < 45) return '#ff9800'; // Сухо - оранжевий
    if (moisture < 65) return '#4caf50'; // Нормально - зелений
    if (moisture < 80) return '#2196f3'; // Волого - синій
    return '#0d47a1';                    // Критично волого - темно-синій
  };

  // Отримання статусу вологості
  const getMoistureStatus = (moisture) => {
    if (moisture < 30) return 'Критично сухо';
    if (moisture < 45) return 'Сухо';
    if (moisture < 65) return 'Нормальна вологість';
    if (moisture < 80) return 'Волого';
    return 'Критично волого';
  };
  
  // Отримання класу статусу
  const getStatusClass = (status) => {
    if (status === 'Критично сухо') return 'critical-dry';
    if (status === 'Сухо') return 'dry';
    if (status === 'Нормальна вологість') return 'normal';
    if (status === 'Волого') return 'wet';
    return 'critical-wet';
  };
  
  // Отримання рекомендацій в залежності від вологості
  const getMoistureRecommendation = (moisture) => {
    if (moisture < 30) {
      return 'Терміновий полив потрібен. Рекомендується негайне зрошення для запобігання засиханню рослин. Збільшіть частоту поливу в 2-3 рази.';
    }
    if (moisture < 45) {
      return 'Необхідний регулярний полив. Збільшіть кількість води при зрошенні. Рекомендовано мульчування ґрунту для збереження вологи.';
    }
    if (moisture < 65) {
      return 'Оптимальна вологість для більшості культур. Підтримуйте поточний режим зрошення. Проводьте регулярний моніторинг погодних умов.';
    }
    if (moisture < 80) {
      return 'Підвищена вологість. Зменшіть частоту поливу. Рекомендовано покращити дренаж ґрунту та уникати додаткового зрошення найближчі дні.';
    }
    return 'Критично висока вологість. Повністю припиніть полив. Потрібні заходи для покращення дренажу ґрунту. Можливий ризик розвитку грибкових захворювань.';
  };

  return (
    <Box sx={{ width: '100%', position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
      {/* Карта */}
      <Box 
        ref={mapRef} 
        sx={{ 
          width: '100%', 
          height: 500,
          position: 'relative',
          backgroundColor: '#f5f5f5'
        }}
      />

     {/* Індикатор завантаження */}
     {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ mb: 1, color: '#4caf50' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Аналіз вологості ґрунту...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Повідомлення про помилку */}
      {error && (
        <Box sx={{ 
          position: 'absolute', 
          top: 20, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000,
          width: 'calc(100% - 32px)',
          maxWidth: 500
        }}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
          >
            {error}
          </Alert>
        </Box>
      )}
    </Box>
  );
}

export default MoistureRiskMap;