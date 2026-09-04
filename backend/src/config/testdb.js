const pool = require('./db');

async function testDatabaseConnection() {
    try {
        const [rows] = await pool.query('SELECT DATABASE() AS database_name');

        console.log('Database connected successfully');
        console.log('Database:', rows[0].database_name);
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

testDatabaseConnection();