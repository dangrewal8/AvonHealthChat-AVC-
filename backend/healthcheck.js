/**
 * Docker Health Check Script
 * Simple Node.js health check for container monitoring
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Healthy
  } else {
    console.error(`Health check failed with status code: ${res.statusCode}`);
    process.exit(1); // Unhealthy
  }
});

req.on('error', (err) => {
  console.error('Health check request failed:', err.message);
  process.exit(1); // Unhealthy
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1); // Unhealthy
});

req.end();
