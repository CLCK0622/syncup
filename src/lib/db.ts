
import { Pool } from 'pg';

// Replace with your actual Neon connection string
const connectionString = process.env.DATABASE_URL || 'your_neon_connection_string_here';

const pool = new Pool({
  connectionString,
});

export default pool;
