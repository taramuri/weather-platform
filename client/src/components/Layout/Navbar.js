import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { WbSunny, Grass, Dashboard } from '@mui/icons-material';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          АгроМетео Платформа
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<Dashboard />}
          >
            Дашборд
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/weather"
            startIcon={<WbSunny />}
          >
            Погода
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/agricultural"
            startIcon={<Grass />}
          >
            Агродані
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;