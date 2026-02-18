// Database connection configuration for Vercel serverless and production
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Add SSL configuration for cloud providers (PlanetScale, Railway, AWS RDS)
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'true',
  };
}

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Test connection and handle errors
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Pool Connected!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Pool Connection Error:', err.message);
  });

export default pool;
