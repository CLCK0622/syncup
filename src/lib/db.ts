
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Append ?sslmode=require if it's not already there.
// This is often required for connecting to cloud databases like Neon from serverless environments.
const connectionString = process.env.DATABASE_URL.includes('sslmode')
  ? process.env.DATABASE_URL
  : `${process.env.DATABASE_URL}?sslmode=require`;

const pool = new Pool({
  connectionString: connectionString,
});

export default pool;
