import React, { useState } from 'react';
import {
  Card, CardContent, Typography, Box, 
  Alert, AlertTitle, Collapse, IconButton,
  Chip, Button
} from '@mui/material';
import {
  CheckCircle,
  ExpandMore, ExpandLess, Close,
  Notifications, NotificationsOff
} from '@mui/icons-material';

const AlertsPanel = ({ alerts = [], onDismiss, onDismissAll }) => {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState('all'); 
  
  const getAlertSeverity = (type) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Високий';
      case 'medium':
        return 'Середній';
      case 'low':
        return 'Низький';
      default:
        return 'Невідомо';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.priority === filter;
  });

  const alertCounts = {
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (alerts.length === 0) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'success.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6" color="success.main">
              🎉 Немає активних сповіщень
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Всі системи працюють в нормальному режимі
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ border: '1px solid', borderColor: 'warning.light' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications color="warning" />
            <Typography variant="h6">
              🚨 Активні сповіщення ({alerts.length})
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {onDismissAll && alerts.length > 1 && (
              <Button
                size="small"
                variant="outlined"
                onClick={onDismissAll}
                startIcon={<NotificationsOff />}
              >
                Закрити всі
              </Button>
            )}
            
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Priority Filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Всі (${alerts.length})`}
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            size="small"
          />
          <Chip
            label={`Високий (${alertCounts.high})`}
            onClick={() => setFilter('high')}
            color={filter === 'high' ? 'error' : 'default'}
            size="small"
            disabled={alertCounts.high === 0}
          />
          <Chip
            label={`Середній (${alertCounts.medium})`}
            onClick={() => setFilter('medium')}
            color={filter === 'medium' ? 'warning' : 'default'}
            size="small"
            disabled={alertCounts.medium === 0}
          />
          <Chip
            label={`Низький (${alertCounts.low})`}
            onClick={() => setFilter('low')}
            color={filter === 'low' ? 'info' : 'default'}
            size="small"
            disabled={alertCounts.low === 0}
          />
        </Box>

        {/* Alerts List */}
        <Collapse in={expanded}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredAlerts.map((alert, index) => (
              <Alert
                key={alert.id || index}
                severity={getAlertSeverity(alert.type)}
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getPriorityLabel(alert.priority)}
                      size="small"
                      color={getPriorityColor(alert.priority)}
                    />
                    {onDismiss && (
                      <IconButton
                        size="small"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <AlertTitle>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {alert.title}
                    </Typography>
                    {alert.timestamp && (
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(alert.timestamp)}
                      </Typography>
                    )}
                  </Box>
                </AlertTitle>
                
                <Typography variant="body2">
                  {alert.message}
                </Typography>

                {/* Additional alert details */}
                {alert.details && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Деталі: {alert.details}
                    </Typography>
                  </Box>
                )}

                {/* Action buttons */}
                {alert.actions && alert.actions.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {alert.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        size="small"
                        variant="outlined"
                        onClick={action.onClick}
                        color={action.color || 'primary'}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                )}
              </Alert>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;