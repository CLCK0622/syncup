import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const ip = req.nextUrl.searchParams.get('ip');
    console.log(`[GeoIP API] Received request for IP: ${ip}`);

    if (!ip) {
        console.error('[GeoIP API] IP address is required but missing.');
        return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    try {
        const externalApiResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await externalApiResponse.json();
        console.log(`[GeoIP API] Response from ip-api.com for ${ip}:`, data);

        if (data.status === 'fail') {
            console.warn(`[GeoIP API] ip-api.com failed for ${ip}: ${data.message}`);
            return NextResponse.json({ error: `Geolocation failed for IP: ${ip}. Message: ${data.message}` }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`[GeoIP API] Error fetching geolocation data for ${ip}:`, error);
        return NextResponse.json({ error: 'Error fetching geolocation data' }, { status: 500 });
    }
}