import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export default pool;

export interface VoteData {
  ip: string;
  vote: 'up' | 'down';
  timestamp: string;
}

export async function saveVote(voteData: VoteData): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO votes (ip, vote, timestamp) VALUES ($1, $2, $3)',
      [voteData.ip, voteData.vote, voteData.timestamp]
    );
  } finally {
    client.release();
  }
}

export async function getVotes(): Promise<VoteData[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT ip, vote, timestamp FROM votes ORDER BY timestamp DESC');
    return rows.map(row => ({
      ip: row.ip,
      vote: row.vote,
      timestamp: new Date(row.timestamp).toISOString(),
    }));
  } finally {
    client.release();
  }
}
