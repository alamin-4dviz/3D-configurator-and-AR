import('http').then(({ createServer }) => {
  createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/auth/login') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          console.log('Login attempt:', data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token: 'test', isAdmin: true }));
        } catch (error) {
          console.error('Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  }).listen(5001, '127.0.0.1', () => {
    console.log('Test server listening on http://127.0.0.1:5001');
  });
});
