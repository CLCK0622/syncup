"use client";

import dynamic from 'next/dynamic';

// Dynamically import the Map component with ssr: false
const Map = dynamic(() => import('../app/stats/map'), { ssr: false });

interface MarkerData {
    name: string;
    coordinates: [number, number];
    markerOffset: number;
}

interface ClientMapWrapperProps {
    locations: MarkerData[];
}

export default function ClientMapWrapper({ locations }: ClientMapWrapperProps) {
    return (
        <div style={{ width: '100%', height: '500px' }}>
            <Map data={locations} />
        </div>
    );
}
