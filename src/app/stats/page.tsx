import { getVotes, VoteData } from '@/lib/db';
import Map from './map';

interface GeoIpResponse {
  lat: number;
  lon: number;
  city: string;
  // Add other properties from ip-api.com if needed, e.g., country, regionName
}

interface MarkerData {
  name: string;
  coordinates: [number, number];
  markerOffset: number;
}

async function getStats() {
  // Ensure data is always fresh by setting cache: 'no-store'
  const db = await getVotes(); // getVotes internally uses the pool, which doesn't have fetch, so this is fine.

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
        // Ensure geoip data is always fresh
        const response = await fetch(`http://localhost:3000/api/geoip?ip=${ip}`, { cache: 'no-store' });
        const data: GeoIpResponse = await response.json();
        if (data.lat && data.lon) {
          return {
            name: data.city || ip,
            coordinates: [data.lon, data.lat],
            markerOffset: -15,
          } as MarkerData;
        }
      } catch (error) {
        console.error(`Error fetching geoip for ${ip}`, error);
      }
      return null;
    })
  );

  return { db, stats, locations: locations.filter((loc): loc is MarkerData => loc !== null) };
}

export default async function Stats() {
  const { db, stats, locations } = await getStats();

  return (
    <div className="main-container">
      <main>
        <h1>Statistics</h1>

        {db.length === 0 ? (
          <p className="text-center mt-4 text-lg text-muted-foreground">No vote data available yet. Cast some votes on the /preview page!</p>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-2xl font-semibold">Total Votes: {stats.total}</p>
              <p className="text-xl">Upvotes: {stats.up}</p>
              <p className="text-xl">Downvotes: {stats.down}</p>
            </div>

            <div className="mb-8">
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

            <div className="mb-8">
              <h2>Vote Map</h2>
              {/* Added explicit dimensions for the map container */}
              <div className="map-container" style={{ width: '100%', height: '500px' }}>
                <Map data={locations} />
              </div>
            </div>

            <div>
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
          </>
        )}
      </main>
    </div>
  );
}
