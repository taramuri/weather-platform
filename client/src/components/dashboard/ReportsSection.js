import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Button, Box, Alert 
} from '@mui/material';
import { 
  PictureAsPdf, FileDownload 
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportsSection = ({ 
  city, selectedCrop, onExportData, lastUpdated, 
  realTimeUpdates, alerts, weatherData, moistureData, 
  vegetationData, trendsData, yieldPrediction, airQualityData 
}) => {
  
  const generatePDFReport = async () => {
    try {
      const reportContent = createReportHTML();
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm'; 
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(tempDiv);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Agrocast_Report_${city}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Помилка генерації PDF:', error);
      alert('Помилка при створенні PDF файлу. Спробуйте ще раз.');
    }
  };
  
  const createReportHTML = () => {
    const currentDate = new Date();
    const formatDate = (date) => date.toLocaleDateString('uk-UA');
    const formatTime = (date) => date.toLocaleTimeString('uk-UA');
    
    return `
      <div style="max-width: 180mm; margin: 0 auto; font-family: Arial, sans-serif;">
        <!-- Заголовок -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #2c5aa0;">ЗВІТ З АГРОМЕТЕОРОЛОГІЧНОГО МОНІТОРИНГУ</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Створено автоматично системою аграрного моніторингу
          </p>
        </div>
        
        <!-- Основна інформація -->
        <div style="margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">Загальна інформація</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Місто:</td>
              <td style="padding: 5px 0;">${city}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Дата створення:</td>
              <td style="padding: 5px 0;">${formatDate(currentDate)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Час створення:</td>
              <td style="padding: 5px 0;">${formatTime(currentDate)}</td>
            </tr>
          </table>
        </div>
        
        ${weatherData ? `
        <!-- Поточні погодні умови -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            1. ПОТОЧНІ ПОГОДНІ УМОВИ
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Температура:</td>
              <td style="padding: 5px 0;">${Math.round(weatherData.temperature)}°C</td>
            </tr>
            ${weatherData.humidity ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Вологість повітря:</td>
              <td style="padding: 5px 0;">${weatherData.humidity}%</td>
            </tr>
            ` : ''}
            ${weatherData.windSpeed ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Швидкість вітру:</td>
              <td style="padding: 5px 0;">${weatherData.windSpeed} км/год</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Опис:</td>
              <td style="padding: 5px 0;">${weatherData.description || 'Н/Д'}</td>
            </tr>
            ${weatherData.maxTemperature !== undefined ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Максимальна температура:</td>
              <td style="padding: 5px 0;">${Math.round(weatherData.maxTemperature)}°C</td>
            </tr>
            ` : ''}
            ${weatherData.minTemperature !== undefined ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Мінімальна температура:</td>
              <td style="padding: 5px 0;">${Math.round(weatherData.minTemperature)}°C</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}
        
        ${airQualityData ? `
        <!-- Якість повітря -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            2. ЯКІСТЬ ПОВІТРЯ
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Індекс якості:</td>
              <td style="padding: 5px 0;">${airQualityData.index || 'Н/Д'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Оцінка:</td>
              <td style="padding: 5px 0;">${airQualityData.quality || 'Н/Д'}</td>
            </tr>
            ${airQualityData.description ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold; vertical-align: top;">Опис:</td>
              <td style="padding: 5px 0;">${airQualityData.description}</td>
            </tr>
            ` : ''}
            ${airQualityData.details ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold; vertical-align: top;">Деталі забруднення:</td>
              <td style="padding: 5px 0;">
                ${airQualityData.details.pm2_5 ? `PM2.5: ${Math.round(airQualityData.details.pm2_5)} μg/m³<br>` : ''}
                ${airQualityData.details.pm10 ? `PM10: ${Math.round(airQualityData.details.pm10)} μg/m³<br>` : ''}
                ${airQualityData.details.ozone ? `Озон: ${Math.round(airQualityData.details.ozone)} μg/m³` : ''}
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}
        
        ${moistureData ? `
        <!-- Вологість ґрунту -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            3. АНАЛІЗ ВОЛОГОСТІ ҐРУНТУ
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Поточна вологість:</td>
              <td style="padding: 5px 0;">${Math.round(moistureData.current_moisture)}%</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Історичне середнє:</td>
              <td style="padding: 5px 0;">${Math.round(moistureData.historical_average)}%</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Різниця:</td>
              <td style="padding: 5px 0;">${moistureData.moisture_difference > 0 ? '+' : ''}${Math.round(moistureData.moisture_difference)}%</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Рівень ризику:</td>
              <td style="padding: 5px 0;">${moistureData.risk_level || 'Н/Д'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Опади за 30 днів:</td>
              <td style="padding: 5px 0;">${Math.round(moistureData.precipitation_last_30_days || 0)} мм</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Випаровування за 30 днів:</td>
              <td style="padding: 5px 0;">${Math.round(moistureData.evapotranspiration_last_30_days || 0)} мм</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Водний баланс:</td>
              <td style="padding: 5px 0;">${moistureData.moisture_balance > 0 ? '+' : ''}${Math.round(moistureData.moisture_balance || 0)} мм</td>
            </tr>
          </table>
        </div>
        ` : ''}
        
        ${vegetationData ? `
        <!-- Стан рослинності -->
        <div style="margin-bottom: 25px; page-break-before: always; page-break-inside: avoid;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            4. СТАН РОСЛИННОСТІ
          </h2>
          
          ${vegetationData.indices ? `
          <div style="margin-bottom: 15px; page-break-inside: avoid;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Індекси рослинності:</h3>
            <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">NDVI (Нормалізований індекс рослинності):</td>
                <td style="padding: 3px 0;">${vegetationData.indices.ndvi || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">EVI (Покращений індекс рослинності):</td>
                <td style="padding: 3px 0;">${vegetationData.indices.evi || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">SAVI (Індекс рослинності з поправкою на ґрунт):</td>
                <td style="padding: 3px 0;">${vegetationData.indices.savi || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">NDWI (Індекс водного стресу):</td>
                <td style="padding: 3px 0;">${vegetationData.indices.ndwi || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">LAI (Індекс листової поверхні):</td>
                <td style="padding: 3px 0;">${vegetationData.indices.lai || 'Н/Д'}</td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          ${vegetationData.health ? `
          <div style="page-break-inside: avoid;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Оцінка здоров'я рослинності:</h3>
            <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">Статус:</td>
                <td style="padding: 3px 0;">${vegetationData.health.status || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">Рівень стресу:</td>
                <td style="padding: 3px 0;">${vegetationData.health.stress_level || 'Н/Д'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; font-weight: bold;">Оцінка:</td>
                <td style="padding: 3px 0;">${vegetationData.health.score || 'Н/Д'}/100</td>
              </tr>
              ${vegetationData.health.description ? `
              <tr>
                <td style="padding: 3px 0; font-weight: bold; vertical-align: top;">Опис:</td>
                <td style="padding: 3px 0;">${vegetationData.health.description}</td>
              </tr>
              ` : ''}
              ${vegetationData.health.recommendations ? `
              <tr>
                <td style="padding: 3px 0; font-weight: bold; vertical-align: top;">Рекомендації:</td>
                <td style="padding: 3px 0;">
                  ${vegetationData.health.recommendations.map(rec => `• ${rec}`).join('<br>')}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${trendsData ? `
        <!-- Аналіз трендів -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            5. АНАЛІЗ ПОГОДНИХ ТРЕНДІВ
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Період аналізу:</td>
              <td style="padding: 5px 0;">${trendsData.timeRange || 'Н/Д'} (${trendsData.period ? `${formatDate(new Date(trendsData.period.start))} - ${formatDate(new Date(trendsData.period.end))}` : 'Н/Д'})</td>
            </tr>
            ${trendsData.analysis ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Температурний тренд:</td>
              <td style="padding: 5px 0;">${trendsData.analysis.temperature_trend?.description || 'Н/Д'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Тренд опадів:</td>
              <td style="padding: 5px 0;">${trendsData.analysis.precipitation_trend?.description || 'Н/Д'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Тренд вологості:</td>
              <td style="padding: 5px 0;">${trendsData.analysis.humidity_trend?.description || 'Н/Д'}</td>
            </tr>
            ${trendsData.analysis.anomalies && trendsData.analysis.anomalies.length > 0 ? `            
            ` : ''}
            ${trendsData.analysis.summary ? `
            <tr>
              <td style="padding: 5px 0; font-weight: bold; vertical-align: top;">Загальний висновок:</td>
              <td style="padding: 5px 0;">${trendsData.analysis.summary}</td>
            </tr>
            ` : ''}
            ` : ''}
          </table>
        </div>
        ` : ''}
               
        ${alerts && alerts.length > 0 ? `
        <!-- Активні попередження -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            7. АКТИВНІ ПОПЕРЕДЖЕННЯ
          </h2>
          ${alerts.map((alert, index) => `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${alert.type === 'error' ? '#f44336' : alert.type === 'warning' ? '#ff9800' : '#2196f3'}; background: #f9f9f9;">
              <h3 style="margin: 0 0 5px 0; font-size: 14px;">${index + 1}. ${alert.title || 'Попередження'}</h3>
              <p style="margin: 0; font-size: 12px;"><strong>Пріоритет:</strong> ${alert.priority || 'Н/Д'}</p>
              <p style="margin: 0; font-size: 12px;"><strong>Тип:</strong> ${alert.type || 'Н/Д'}</p>
              ${alert.message ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${alert.message}</p>` : ''}
              ${alert.timestamp ? `<p style="margin: 5px 0 0 0; font-size: 10px; color: #666;"><strong>Час:</strong> ${formatTime(new Date(alert.timestamp))}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Детальні рекомендації -->
        <div style="margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            6. ДЕТАЛЬНІ РЕКОМЕНДАЦІЇ
          </h2>
          
          <!-- Рекомендації щодо поливу -->
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Рекомендації щодо зрошення:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              ${moistureData ? `
                ${moistureData.current_moisture < 30 ? '<li><strong>ТЕРМІНОВО:</strong> Негайний полив через критично низьку вологість ґрунту</li>' : ''}
                ${moistureData.current_moisture < 50 && moistureData.current_moisture >= 30 ? '<li>Рекомендується полив у найближчі 2-3 дні</li>' : ''}
                ${moistureData.current_moisture > 80 ? '<li>Припинити полив на 5-7 днів через надлишок вологи</li>' : ''}
                ${moistureData.risk_level === 'high-dry' ? '<li>Впровадити інтенсивний режим зрошення</li>' : ''}
                ${moistureData.risk_level === 'high-wet' ? '<li>Забезпечити дренаж ділянок</li>' : ''}
              ` : ''}
              <li>Оптимальний час поливу: ранкові години (6:00-9:00) або вечірні (18:00-21:00)</li>
              <li>Контролювати глибину зволоження (мінімум 20-30 см для культури ${selectedCrop})</li>
            </ul>
          </div>
          
          <!-- Рекомендації щодо захисту рослин -->
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Рекомендації щодо захисту рослин:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              ${weatherData ? `
                ${weatherData.temperature > 30 ? '<li><strong>Високі температури:</strong> Посилений моніторинг на ознаки теплового стресу</li>' : ''}
                ${weatherData.temperature < 5 ? '<li><strong>Низькі температури:</strong> Вжити заходів захисту від заморозків</li>' : ''}
                ${weatherData.windSpeed > 10 ? '<li><strong>Сильний вітер:</strong> Перевірити стійкість рослин та опор</li>' : ''}
              ` : ''}
              ${vegetationData?.health?.status === 'poor' ? '<li><strong>УВАГА:</strong> Виявлено стрес рослинності - провести детальний огляд посівів</li>' : ''}
              ${airQualityData?.index > 80 ? '<li><strong>Погана якість повітря:</strong> Обмежити польові роботи та обприскування</li>' : ''}
              <li>Регулярний огляд посівів на наявність шкідників та хвороб</li>
              <li>Дотримання графіка профілактичних обробок</li>
            </ul>
          </div>
          
          <!-- Рекомендації щодо агротехнічних операцій -->
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Агротехнічні операції:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              ${yieldPrediction?.recommendations ? `
                ${yieldPrediction.recommendations.map(rec => `<li><strong>${rec.priority === 'high' ? 'ПРІОРИТЕТ:' : ''}</strong> ${rec.description}</li>`).join('')}
              ` : ''}
              <li>Моніторинг фаз розвитку культури ${selectedCrop}</li>
              <li>Корегування схеми живлення відповідно до погодних умов</li>
              <li>Планування збиральних робіт з урахуванням прогнозу погоди</li>
            </ul>
          </div>
          
          <!-- Загальні рекомендації -->
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Загальні рекомендації:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Щоденний моніторинг погодних умов та стану посівів</li>
              <li>Ведення детального журналу польових робіт</li>
              <li>Підготовка до можливих екстремальних погодних явищ</li>
              <li>Регулярне калібрування систем зрошення</li>
              <li>Консультації з агрономами при виявленні проблем</li>
            </ul>
          </div>
        </div>
        
        <!-- Підпис -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 10px;">
          <p style="margin: 0;">Автоматично згенеровано системою агрометеорологічного моніторингу</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} AgroCast</p>
          <p style="margin: 5px 0 0 0;">Звіт створено на основі актуальних даних станом на ${formatDate(currentDate)} ${formatTime(currentDate)}</p>
        </div>
      </div>
    `;
  };
  
  // JSON експорт як резервний варіант
  const exportJSONData = () => {
    const exportData = {
      city,
      crop: selectedCrop,
      timestamp: new Date().toISOString(),
      weather: weatherData,
      airQuality: airQualityData,
      moisture: moistureData,
      vegetation: vegetationData,
      trends: trendsData,
      yieldPrediction,
      alerts
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agrocast-data-${city}-${selectedCrop}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Функція для експорту CSV даних
  const exportCSVData = () => {
    const csvData = [];
    
    // Заголовки
    csvData.push([
      'Параметр', 'Значення', 'Одиниці', 'Час оновлення'
    ]);
    
    // Погодні дані
    if (weatherData) {
      csvData.push(['Температура', weatherData.temperature, '°C', new Date().toISOString()]);
      csvData.push(['Вологість повітря', weatherData.humidity, '%', new Date().toISOString()]);
      csvData.push(['Швидкість вітру', weatherData.windSpeed, 'км/год', new Date().toISOString()]);
      csvData.push(['Опис погоди', weatherData.description, '-', new Date().toISOString()]);
    }
    
    // Дані вологості ґрунту
    if (moistureData) {
      csvData.push(['Вологість ґрунту (поточна)', moistureData.current_moisture, '%', new Date().toISOString()]);
      csvData.push(['Вологість ґрунту (історична)', moistureData.historical_average, '%', new Date().toISOString()]);
      csvData.push(['Рівень ризику вологості', moistureData.risk_level, '-', new Date().toISOString()]);
    }
    
    // Дані якості повітря
    if (airQualityData) {
      csvData.push(['Індекс якості повітря', airQualityData.index, '-', new Date().toISOString()]);
      csvData.push(['Оцінка якості повітря', airQualityData.quality, '-', new Date().toISOString()]);
    }
    
    // Конвертуємо в CSV формат
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Створюємо та завантажуємо файл
    const dataBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agrocast-data-${city}-${selectedCrop}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Генерація звітів
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Створюйте детальні звіти на основі зібраних агрометеорологічних даних
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              PDF звіт містить всі зібрані дані в читабельному форматі для аналізу та архівування
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={generatePDFReport}
                startIcon={<PictureAsPdf />}
                sx={{ backgroundColor: '#d32f2f' }}
              >
                Генерувати PDF звіт
              </Button>
              <Button 
                variant="outlined" 
                onClick={exportJSONData} 
                startIcon={<FileDownload />}
              >
                Експорт даних (JSON)
              </Button>
              <Button 
                variant="outlined" 
                onClick={exportCSVData} 
                startIcon={<FileDownload />}
              >
                Експорт даних (CSV)
              </Button>              
            </Box>
          </CardContent>
        </Card>
      </Grid>      
    </Grid>
  );
};

export default ReportsSection;