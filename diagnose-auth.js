import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function diagnoseAuth() {
    console.log('🔍 Diagnosing MySQL Authentication Issue...\n');

    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    };

    console.log('Connection Config:');
    console.log('Host:', config.host);
    console.log('User:', config.user);
    console.log('Database:', config.database);
    console.log('Port:', config.port);
    console.log('');

    try {
        // First try without authPlugins option
        console.log('1️⃣ Attempting connection with default auth...');
        const conn1 = await mysql.createConnection(config);
        console.log('✅ Default auth works!');

        // Query the authentication plugin being used
        const [authInfo] = await conn1.query(`
            SELECT User, Host, plugin 
            FROM mysql.user 
            WHERE User = ?
        `, [config.user]);

        console.log('📋 Auth plugin info:', authInfo);
        await conn1.end();

    } catch (err) {
        console.log('❌ Default auth failed:', err.message);
        console.log('');

        // Try with explicit authentication plugins
        console.log('2️⃣ Attempting with explicit auth plugins...');
        try {
            const configWithAuth = {
                ...config,
                authPlugins: {
                    mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password'),
                    caching_sha2_password: () => require('mysql2/lib/auth_plugins/caching_sha2_password')
                }
            };

            const conn2 = await mysql.createConnection(configWithAuth);
            console.log('✅ Connection with explicit auth plugins works!');
            await conn2.end();

        } catch (err2) {
            console.log('❌ Explicit auth also failed:', err2.message);
            console.log('');

            // Try changing authentication plugin
            console.log('3️⃣ Recommendations:');
            console.log('  Run this SQL command to change the user auth plugin:');
            console.log(`  ALTER USER '${config.user}'@'${config.host === '127.0.0.1' ? 'localhost' : config.host}' IDENTIFIED WITH mysql_native_password BY '${config.password}';`);
            console.log('  FLUSH PRIVILEGES;');
        }
    }
}

diagnoseAuth();
