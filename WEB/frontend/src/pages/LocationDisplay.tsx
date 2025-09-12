import React from 'react';

interface LocationDisplayProps {
  // It now receives the location name as a prop
  locationName?: string; 
}

const LocationDisplay = ({ locationName }: LocationDisplayProps) => {
  // If the name exists, display it. Otherwise, show a loading or fallback message.
  const displayText = locationName || 'Loading location...';
  
  return <span className="font-medium text-gray-800">{displayText}</span>;
};

export default LocationDisplay;