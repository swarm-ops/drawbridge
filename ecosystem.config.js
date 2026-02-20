module.exports = {
  apps: [
    {
      name: 'drawbridge',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        DRAWBRIDGE_PORT: 3062,
        DRAWBRIDGE_DATA_DIR: './data'
      },
      env_development: {
        NODE_ENV: 'development',
        DRAWBRIDGE_PORT: 3062,
        DRAWBRIDGE_DATA_DIR: './data'
      },
      instances: 1,
      exec_mode: 'fork', // WebSocket state needs single instance
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Create logs directory if it doesn't exist
      pre_start: 'mkdir -p logs',
      // Graceful shutdown handling
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000
    }
  ]
};