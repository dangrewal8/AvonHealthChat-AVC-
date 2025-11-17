/**
 * Docker Health Check Script
 *
 * This script is used by Docker's HEALTHCHECK instruction to verify
 * that the backend application is running and responding to requests.
 *
 * Exit codes:
 *   0 - Healthy
 *   1 - Unhealthy
 *
 * Tech Stack: Node.js
 */

const http = require('http');

// Configuration
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const TIMEOUT = 5000; // 5 seconds

// Health check options
const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: TIMEOUT,
};

/**
 * Perform health check
 */
function healthCheck() {
  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      // Check status code
      if (res.statusCode === 200) {
        try {
          const body = JSON.parse(data);

          // Verify response has status field
          if (body.status && (body.status === 'healthy' || body.status === 'ok')) {
            console.log('✓ Health check passed');
            process.exit(0); // Healthy
          } else {
            console.error('✗ Health check failed: Invalid status in response');
            process.exit(1); // Unhealthy
          }
        } catch (error) {
          console.error('✗ Health check failed: Invalid JSON response');
          process.exit(1); // Unhealthy
        }
      } else {
        console.error(`✗ Health check failed: HTTP ${res.statusCode}`);
        process.exit(1); // Unhealthy
      }
    });
  });

  req.on('error', (error) => {
    console.error(`✗ Health check failed: ${error.message}`);
    process.exit(1); // Unhealthy
  });

  req.on('timeout', () => {
    console.error('✗ Health check failed: Request timeout');
    req.destroy();
    process.exit(1); // Unhealthy
  });

  req.end();
}

// Run health check
healthCheck();
