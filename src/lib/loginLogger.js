
import { v4 as uuidv4 } from 'uuid';

const LOGIN_LOGS_KEY = 'crm_login_logs';

export const logLoginAttempt = ({ username, status, reason }) => {
  const logs = getLoginLogs();
  
  const newLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    username,
    timestamp: new Date().toISOString(),
    status, // 'Success' | 'Failed'
    reason, // e.g., 'Invalid Password', 'User not found'
    ip: '192.168.1.1', // Mock IP as we can't get real IP in client-side only
    device: navigator.userAgent
  };

  // Keep only last 100 logs
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(LOGIN_LOGS_KEY, JSON.stringify(updatedLogs));
  return newLog;
};

export const getLoginLogs = () => {
  const logs = localStorage.getItem(LOGIN_LOGS_KEY);
  return logs ? JSON.parse(logs) : [];
};

export const exportLoginLogsToCSV = () => {
  const logs = getLoginLogs();
  if (!logs.length) return null;

  const headers = ['Timestamp', 'Username', 'Status', 'Reason', 'IP Address', 'Device'];
  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.username}"`,
      `"${log.status}"`,
      `"${log.reason || ''}"`,
      `"${log.ip}"`,
      `"${log.device}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return URL.createObjectURL(blob);
};
