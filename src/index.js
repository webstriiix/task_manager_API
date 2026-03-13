require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
const clientDistPath = path.resolve(process.cwd(), 'client-dist');
const indexPath = path.join(clientDistPath, 'index.html');

// Debugging logs for startup
const fs = require('fs');
console.log('--- Startup Directory Check ---');
console.log('Current Working Directory:', process.cwd());
console.log('Target Client Dist Path:', clientDistPath);
console.log('Client Dist Exists:', fs.existsSync(clientDistPath));
if (fs.existsSync(clientDistPath)) {
  console.log('Index.html Exists:', fs.existsSync(indexPath));
  console.log('Directory Contents:', fs.readdirSync(clientDistPath));
}
console.log('-------------------------------');

app.use(express.static(clientDistPath));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API is running'
  });
});

app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Frontend files not found. Please ensure the build command was successful.',
      debug: {
        cwd: process.cwd(),
        path: indexPath
      }
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 8080;

let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  const prisma = require('./config/database');
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
