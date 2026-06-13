const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5151,
  path: '/api/users',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('REQUEST TIMED OUT');
  req.destroy();
  process.exit(2);
});

req.end();
