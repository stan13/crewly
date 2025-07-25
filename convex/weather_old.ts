import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getWeatherBatch = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    locationName: v.string(),
    dates: v.array(v.string()),
    temperatureUnit: v.optional(v.union(v.literal("fahrenheit"), v.literal("celsius"))),
  },
  handler: async (ctx, { latitude, longitude, locationName, dates, temperatureUnit = "fahrenheit" }) => {
    console.log('🌤️ Weather batch request started:', { latitude, longitude, locationName, dates });
    
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('❌ OpenWeather API key not configured');
      throw new Error("OpenWeather API key not configured");
    }
    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');

    try {
      // Use the provided coordinates directly - no geocoding needed!
      const lat = latitude;
      const lon = longitude;
      console.log('📍 Using coordinates:', { lat, lon });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('📅 Today date:', today.toISOString().split('T')[0]);
      
      const results: Record<string, any> = {};
      console.log('🔄 Processing dates:', dates);
      
      // Check if any dates are today for current weather
      const todayString = today.toISOString().split('T')[0];
      const needsCurrentWeather = dates.includes(todayString);
      console.log('🌡️ Needs current weather for today?', { todayString, needsCurrentWeather });
      
      // Get current weather if needed
      if (needsCurrentWeather) {
        console.log('🌤️ Fetching current weather for today...');
        const units = temperatureUnit === 'celsius' ? 'metric' : 'imperial';
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
        console.log('🔗 Current weather URL:', currentWeatherUrl);
        
        const weatherResponse = await fetch(currentWeatherUrl);
        console.log('📡 Current weather response status:', weatherResponse.status);
        
        if (weatherResponse.ok) {
          const currentWeather = await weatherResponse.json();
          console.log('📊 Current weather data received:', !!currentWeather);
          
          results[todayString] = {
            high: Math.round(currentWeather.main.temp_max),
            low: Math.round(currentWeather.main.temp_min),
            condition: currentWeather.weather[0].description,
            icon: getWeatherIcon(currentWeather.weather[0].main),
            location: locationName,
            date: todayString,
          };
          console.log('✅ Added current weather to results for:', todayString);
        } else {
          const errorText = await weatherResponse.text();
          console.error('❌ Current weather API failed:', weatherResponse.status, errorText);
        }
      }
      
      // Get 5-day forecast for future dates
      const futureDates = dates.filter(date => {
        const targetDate = new Date(date + 'T00:00:00');
        return targetDate > today && targetDate <= new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      });
      
      if (futureDates.length > 0) {
        console.log('🔮 Future dates to fetch:', futureDates);
        console.log('📡 Fetching 5-day forecast...');
        const units = temperatureUnit === 'celsius' ? 'metric' : 'imperial';
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
        console.log('🔗 Forecast URL:', forecastUrl);
        
        const forecastResponse = await fetch(forecastUrl);
        console.log('📡 Forecast response status:', forecastResponse.status);
        
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          
          // Process each future date
          futureDates.forEach(date => {
            const dayForecasts = forecastData.list.filter((item: any) => 
              item.dt_txt.startsWith(date)
            );
            
            if (dayForecasts.length > 0) {
              const temps = dayForecasts.map((f: any) => f.main.temp);
              const high = Math.round(Math.max(...temps));
              const low = Math.round(Math.min(...temps));
              
              const middayForecast = dayForecasts.find((f: any) => 
                f.dt_txt.includes('12:00:00')
              ) || dayForecasts[Math.floor(dayForecasts.length / 2)];
              
              results[date] = {
                high,
                low,
                condition: middayForecast.weather[0].description,
                icon: getWeatherIcon(middayForecast.weather[0].main),
                location: locationName,
                date,
              };
            }
          });
        }
      }
      
      // Don't fill in fallback data - just return what we have
      const availableDates = Object.keys(results);
      const missingDates = dates.filter(date => !results[date]);
      console.log(`📊 Weather available for ${availableDates.length}/${dates.length} dates`);
      if (missingDates.length > 0) {
        console.log('⚠️ No weather data for dates:', missingDates);
      }
      
      console.log('✅ Final results object keys:', Object.keys(results));
      console.log('📋 Returning results for', Object.keys(results).length, 'dates');
      return results;
    } catch (error) {
      console.error('Weather API error:', error);
      // Return fallback data for all dates
      const fallbackResults: Record<string, any> = {};
      dates.forEach(date => {
        fallbackResults[date] = {
          high: 75,
          low: 60,
          condition: 'Data unavailable',
          icon: '❓',
          location: locationName,
          date,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      });
      return fallbackResults;
    }
  },
});


export const updateUserLocation = mutation({
  args: {
    locationName: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, { locationName, latitude, longitude }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Check if user settings record exists
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, { locationName, latitude, longitude });
    } else {
      // Create new settings record
      await ctx.db.insert("userSettings", {
        userId,
        locationName,
        latitude,
        longitude,
      });
    }
    
    return { success: true };
  },
});

export const updateUserTemperatureUnit = mutation({
  args: {
    temperatureUnit: v.union(v.literal("fahrenheit"), v.literal("celsius")),
  },
  handler: async (ctx, { temperatureUnit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Check if user settings record exists
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, { temperatureUnit });
    } else {
      // Create new settings record
      await ctx.db.insert("userSettings", {
        userId,
        temperatureUnit,
      });
    }
    
    return { success: true };
  },
});

export const getUserTemperatureUnit = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return "fahrenheit"; // default
    }

    const userId = identity.subject;
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    return settings?.temperatureUnit || "fahrenheit";
  },
});

export const getUserLocation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!settings || !settings.locationName || !settings.latitude || !settings.longitude) {
      return null;
    }
    
    return {
      name: settings.locationName,
      latitude: settings.latitude,
      longitude: settings.longitude,
    };
  },
});

function getWeatherIcon(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'clear':
      return '☀️';
    case 'clouds':
      return '☁️';
    case 'rain':
    case 'drizzle':
      return '🌧️';
    case 'thunderstorm':
      return '⛈️';
    case 'snow':
      return '❄️';
    case 'mist':
    case 'fog':
      return '🌫️';
    default:
      return '⛅';
  }
}