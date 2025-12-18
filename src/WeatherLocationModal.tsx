import { useState } from "react";

// Better reverse geocoding function
async function reverseGeocodeBetter(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.city && data.principalSubdivisionCode) {
        return `${data.city}, ${data.principalSubdivisionCode}`;
      } else if (data.locality && data.principalSubdivisionCode) {
        return `${data.locality}, ${data.principalSubdivisionCode}`;
      } else if (data.city) {
        return data.city;
      }
    }
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
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      try {
        const locationName = await reverseGeocodeBetter(latitude, longitude);
        onSave({ name: locationName, latitude, longitude });
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
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
      const baseLocation = locationInput.trim();
      const locationVariants = [
        baseLocation,
        baseLocation.replace(', ', ','),
        baseLocation + ', US',
        baseLocation + ', United States',
      ];

      let found = false;

      for (const variant of locationVariants) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(variant)}&limit=1&addressdetails=1`
          );

          if (response.ok) {
            const data = await response.json();

            if (data && data.length > 0) {
              const location = data[0];

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
                  locationName = location.display_name.split(',').slice(0, 2).join(',').trim();
                }
              } else {
                locationName = location.display_name.split(',').slice(0, 2).join(',').trim();
              }

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
        setError(`Location "${locationInput}" not found. Try "City, State" format.`);
      }
    } catch (error) {
      setError('Error finding location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content p-6 w-[420px] max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Weather Location
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set your location for weather forecasts</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Location input */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g., Seattle, WA"
              className="input-field"
              autoFocus
              disabled={isGeocoding}
            />
          </div>

          {/* Current location button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGeocoding}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-emerald-50 dark:bg-emerald-900/20
              border border-emerald-200 dark:border-emerald-800/50
              text-emerald-700 dark:text-emerald-300 font-medium
              hover:bg-emerald-100 dark:hover:bg-emerald-900/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {isGeocoding ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Getting location...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use Current Location
              </>
            )}
          </button>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isGeocoding}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeocoding || !locationInput.trim()}
              className="btn-primary"
            >
              {isGeocoding ? 'Finding...' : 'Save Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
