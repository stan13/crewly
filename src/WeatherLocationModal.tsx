import { useState } from "react";

// Better reverse geocoding function
async function reverseGeocodeBetter(lat: number, lon: number): Promise<string> {
  try {
    // Use a free geocoding service that doesn't require API keys
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Reverse geocoding result:', data);
      
      if (data.city && data.principalSubdivisionCode) {
        return `${data.city}, ${data.principalSubdivisionCode}`;
      } else if (data.locality && data.principalSubdivisionCode) {
        return `${data.locality}, ${data.principalSubdivisionCode}`;
      } else if (data.city) {
        return data.city;
      }
    }
    
    // Fallback to coordinates if service fails
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

interface WeatherLocationModalProps {
  isOpen: boolean;
  currentLocation: LocationData | null;
  onSave: (location: LocationData) => void;
  onClose: () => void;
}

export function WeatherLocationModal({ 
  isOpen, 
  currentLocation, 
  onSave, 
  onClose 
}: WeatherLocationModalProps) {
  const [locationInput, setLocationInput] = useState(currentLocation?.name || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsGeocoding(true);
    setError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('Got coordinates:', { latitude, longitude });
      
      // Use browser's built-in reverse geocoding (more accurate)
      try {
        // Try using browser's built-in reverse geocoding if available
        if ('geolocation' in navigator && 'geocoder' in window) {
          // This would use Google's geocoding, but it's not always available
        }
        
        // For now, let's use a more accurate free service or just use coordinates
        // You could also create a Convex action for reverse geocoding
        
        // Try using a different geocoding service or create a simple city lookup
        const locationName = await reverseGeocodeBetter(latitude, longitude);
        onSave({ name: locationName, latitude, longitude });
        
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        // Fallback to coordinates
        onSave({ 
          name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 
          latitude, 
          longitude 
        });
      }
    } catch (error) {
      setError('Unable to get your location. Please enter it manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;

    setIsGeocoding(true);
    setError('');

    try {
      // Try different location formats for better success
      const baseLocation = locationInput.trim();
      const locationVariants = [
        baseLocation,
        baseLocation.replace(', ', ','), // Remove spaces after commas
        baseLocation + ', US', // Add country
        baseLocation + ', United States',
        baseLocation + ', WA, US', // Add state if it's a city
        baseLocation + ', Washington, US',
        baseLocation + ', CA, US', // Common states
        baseLocation + ', California, US',
        baseLocation + ', NY, US',
        baseLocation + ', New York, US',
      ];
      
      console.log('Trying location variants:', locationVariants);

      // Try using a free geocoding service first
      let found = false;
      
      for (const variant of locationVariants) {
        try {
          // Use OpenStreetMap Nominatim (free, no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=1&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Geocoding response for', variant, ':', data);
            
            if (data && data.length > 0) {
              const location = data[0];
              
              // Better location name formatting
              let locationName = '';
              if (location.address) {
                const addr = location.address;
                const city = addr.city || addr.town || addr.village || addr.hamlet;
                const state = addr.state;
                const country = addr.country;
                
                if (city && state) {
                  locationName = `${city}, ${state}`;
                } else if (city && country) {
                  locationName = `${city}, ${country}`;
                } else {
                  // Fallback to display name parsing
                  locationName = location.display_name.split(',').slice(0, 2).join(',').trim();
                }
              } else {
                locationName = location.display_name.split(',').slice(0, 2).join(',').trim();
              }
              
              console.log('Formatted location name:', locationName);
              
              onSave({ 
                name: locationName, 
                latitude: parseFloat(location.lat), 
                longitude: parseFloat(location.lon) 
              });
              found = true;
              break;
            }
          }
        } catch (error) {
          console.error('Geocoding error for', variant, error);
          continue;
        }
      }
      
      if (!found) {
        setError(`Location "${locationInput}" not found. Try formats like:\n• "Seattle, WA"\n• "Miami, FL"\n• "New York, NY"\n• "123 Main St, Seattle, WA"`);
      }
    } catch (error) {
      setError('Error finding location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Set Weather Location</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter city, state, or address (e.g., Seattle, WA)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            disabled={isGeocoding}
          />
          
          <div className="mb-4">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isGeocoding}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeocoding ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Getting location...
                </>
              ) : (
                <>
                  📍 Use Current Location
                </>
              )}
            </button>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isGeocoding}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeocoding || !locationInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeocoding ? 'Finding...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}