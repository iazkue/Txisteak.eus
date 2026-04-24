import 'dotenv/config';
import pg from 'pg';

async function run() {
    const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('&channel_binding=')[0].replace('sslmode=require', 'uselibpqcompat=true&sslmode=require') : undefined;
    const pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const jokes = await pool.query('SELECT id, submitter_ip FROM jokes ORDER BY id DESC LIMIT 5');
        console.log('JOKES:', jokes.rows);

        const votes = await pool.query('SELECT * FROM votes ORDER BY id DESC LIMIT 5');
        console.log('VOTES:', votes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
