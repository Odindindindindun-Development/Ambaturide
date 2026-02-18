import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
};

async function testLogin() {
    try {
        const pool = mysql.createPool(poolConfig);

        // First, check if passengers table exists and has data
        console.log('\n1️⃣ Checking passengers table...');
        const [passengers] = await pool.query('SELECT PassengerID, Email, FirstName, LastName FROM passengers LIMIT 5');
        console.log(`Found ${passengers.length} passengers:`, passengers);

        if (passengers.length === 0) {
            console.log('\n⚠️  No passengers found in database. Need to sign up first.');
            await pool.end();
            return;
        }

        // Try to simulate the login query
        const testEmail = passengers[0].Email;
        console.log(`\n2️⃣ Testing login query for: ${testEmail}`);

        const sql = `SELECT * FROM passengers WHERE Email = ?`;
        const [results] = await pool.query(sql, [testEmail]);

        if (results.length > 0) {
            console.log('✅ Login query successful!');
            console.log('Passenger found:', {
                PassengerID: results[0].PassengerID,
                Email: results[0].Email,
                FirstName: results[0].FirstName,
                LastName: results[0].LastName,
                hasPassword: !!results[0].Password
            });
        } else {
            console.log('❌ No passenger found with that email');
        }

        await pool.end();
        console.log('\n✅ Test completed successfully!');

    } catch (err) {
        console.error('\n❌ Error during test:', err.message);
        console.error('Full error:', err);
    }
}

testLogin();
