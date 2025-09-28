import { readDb, VoteData } from '@/lib/db';
import Map from './map';

async function getStats() {
  const db = await readDb();
  const stats = {
    total: db.length,
    up: db.filter((v) => v.vote === 'up').length,
    down: db.filter((v) => v.vote === 'down').length,
    byIp: db.reduce((acc, vote) => {
      if (!acc[vote.ip]) {
        acc[vote.ip] = { up: 0, down: 0 };
      }
      acc[vote.ip][vote.vote]++;
      return acc;
    }, {} as Record<string, { up: number; down: number }>),
  };

  const locations = await Promise.all(
    Object.keys(stats.byIp).map(async (ip) => {
      try {
        const response = await fetch(`http://localhost:3000/api/geoip?ip=${ip}`);
        const data = await response.json();
        if (data.lat && data.lon) {
          return {
            name: data.city || ip,
            coordinates: [data.lon, data.lat],
            markerOffset: -15,
          };
        }
      } catch (error) {
        console.error(`Error fetching geoip for ${ip}`, error);
      }
      return null;
    })
  );

  return { db, stats, locations: locations.filter(Boolean) };
}

export default async function Stats() {
  const { db, stats, locations } = await getStats();

  return (
    <div className="main-container">
      <main>
        <h1>Statistics</h1>

        <div className="text-center mb-2">
          <p>Total Votes: {stats.total}</p>
          <p>Upvotes: {stats.up}</p>
          <p>Downvotes: {stats.down}</p>
        </div>

        <div>
          <h2>Votes by IP Address</h2>
          <div className="stats-grid">
            {Object.entries(stats.byIp).map(([ip, votes]) => (
              <div key={ip} className="stat-card">
                <p className="ip-address">{ip}</p>
                <p>Up: {votes.up}</p>
                <p>Down: {votes.down}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <h2>Vote Map</h2>
          <div className="map-container">
            <Map data={locations} />
          </div>
        </div>

        <div className="mt-2">
          <h2>Detailed Vote Data</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Vote</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {db.map((vote, index) => (
                <tr key={index}>
                  <td>{vote.ip}</td>
                  <td>{vote.vote}</td>
                  <td>{new Date(vote.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
