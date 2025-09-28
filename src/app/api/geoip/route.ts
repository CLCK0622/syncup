import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip');

  if (!ip) {
    return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching geolocation data' }, { status: 500 });
  }
}
