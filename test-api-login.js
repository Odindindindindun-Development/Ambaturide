import fetch from 'node-fetch';

async function testLogin() {
    console.log('🧪 Testing passenger login...\n');

    const loginData = {
        email: 'jomm21212@gmail.com',
        password: 'testpassword123' // You'll need to use the actual password
    };

    try {
        const response = await fetch('http://localhost:3001/api/passenger/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Login successful!');
        } else {
            console.log('\n❌ Login failed:', data.message);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testLogin();
