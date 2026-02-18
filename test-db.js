import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing database connection...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'EMPTY');

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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

console.log('\nAttempting to create connection pool...');

try {
    const pool = mysql.createPool(poolConfig);

    console.log('Pool created, testing connection...');

    const connection = await pool.getConnection();
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!');

    // Test a simple query
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);

    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('✅ Tables in database:', tables);

    connection.release();
    await pool.end();

    console.log('\n✅ All tests passed!');
    process.exit(0);
} catch (error) {
    console.error('\n❌ DATABASE CONNECTION ERROR:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error SQL State:', error.sqlState);
    console.error('Full Error:', error);
    process.exit(1);
}
