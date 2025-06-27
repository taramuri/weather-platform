import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Brightness2 as NewMoonIcon,
  Brightness3 as CrescentMoonIcon,
  Brightness4 as QuarterMoonIcon,
  Brightness5 as GibbousMoonIcon,
  Brightness7 as FullMoonIcon
} from '@mui/icons-material';

function MoonPhaseDisplay({ phase }) {
  const getMoonIcon = () => {
    switch (phase) {
      case "Новий місяць":
        return <NewMoonIcon />;
      case "Молодий місяць":
      case "Старий місяць":
        return <CrescentMoonIcon />;
      case "Перша чверть":
      case "Остання чверть":
        return <QuarterMoonIcon />;
      case "Зростаючий місяць":
      case "Спадаючий місяць":
        return <GibbousMoonIcon />;
      case "Повний місяць":
        return <FullMoonIcon />;
      default:
        return <CrescentMoonIcon />;
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {getMoonIcon()}
      <Typography variant="body2">{phase}</Typography>
    </Box>
  );
}

export default MoonPhaseDisplay;