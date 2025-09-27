
import { useState } from 'react';
import ICAL from 'ical.js';
import { setEvents } from '@/lib/store';
import LoadingAnimation from './loading-animation';

interface LandingPageProps {
  onUploadComplete: () => void;
}

export default function LandingPage({ onUploadComplete }: LandingPageProps) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const jcalData = ICAL.parse(content);
          const vcalendar = new ICAL.Component(jcalData);
          const vevents = vcalendar.getAllSubcomponents('vevent');
          setEvents(vevents);
          onUploadComplete();
        } catch (error) {
          console.error('Error parsing .ics file:', error);
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 text-center">
        <h1 className="text-4xl font-bold mb-8">Upload your calendar</h1>
        <div className="flex flex-col items-center">
          {loading ? (
            <LoadingAnimation />
          ) : (
            <label
              htmlFor="file-upload"
              className="px-4 py-2 text-white bg-blue-500 rounded-md cursor-pointer hover:bg-blue-600"
            >
              Select .ics file
            </label>
          )}
          <input
            id="file-upload"
            type="file"
            accept=".ics"
            className="hidden"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
