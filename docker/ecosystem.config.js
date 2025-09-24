// PM2 Ecosystem configuration für event-qr
module.exports = {
  apps: [
    {
      name: 'event-qr-backend',
      script: './backend/index.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_URL: process.env.DB_URL || 'mongodb://mongodb:27017/event-qr',
        JWT_SECRET: process.env.JWT_SECRET || 'your-secure-jwt-secret-here'
      },
      error_file: '/app/logs/backend-error.log',
      out_file: '/app/logs/backend-out.log',
      log_file: '/app/logs/backend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};