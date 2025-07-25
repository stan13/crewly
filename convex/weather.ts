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
    
    const apiKey = process.env.GOOGLE_WEATHER_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Weather API key not configured');
      throw new Error("Google Weather API key not configured");
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
      
      // Use Google Weather API - provides current conditions + 10-day forecast
      const unitsSystem = temperatureUnit === 'celsius' ? 'METRIC' : 'IMPERIAL';
      
      // Get daily forecast (request up to 10 days) - includes today's data
      const forecastUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&unitsSystem=${unitsSystem}&days=10&pageSize=10`;
      console.log('🔗 Google Forecast URL:', forecastUrl);
      
      // Fetch forecast data
      console.log('🌤️ Fetching weather data with Google Weather API...');
      const forecastResponse = await fetch(forecastUrl);
      
      console.log('📡 Google API response status:', {
        forecast: forecastResponse.status
      });
      
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        console.error('❌ Google Forecast API failed:', forecastResponse.status, errorText);
        throw new Error(`Google Forecast API error: ${forecastResponse.status}`);
      }
      
      const forecastData = await forecastResponse.json();
      
      console.log('📊 Google Weather API data received:', {
        forecastDays: forecastData.forecastDays?.length || 0
      });
      
      // COMPREHENSIVE DEBUG: Log entire response structure
      console.log('🔍 FULL FORECAST DATA STRUCTURE:', JSON.stringify(forecastData, null, 2));
      
      if (forecastData.forecastDays?.length > 0) {
        console.log('📅 Forecast data sample (first day):', {
          maxTemp: forecastData.forecastDays[0].maxTemperature,
          minTemp: forecastData.forecastDays[0].minTemperature,
          condition: forecastData.forecastDays[0].daytimeForecast?.weatherCondition?.type,
          description: forecastData.forecastDays[0].daytimeForecast?.weatherCondition?.description?.text,
          fullStructure: Object.keys(forecastData.forecastDays[0])
        });
      }
      
      // Process dates from Google Weather API data
      const todayString = today.toISOString().split('T')[0];
      
      // Only process dates that are today or in the future (within 10 days)
      const relevantDates = dates.filter(dateString => {
        const targetDate = new Date(dateString + 'T00:00:00');
        const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        return daysDiff >= 0 && daysDiff < 10; // Today through 9 days out
      });
      
      console.log(`🎯 Processing ${relevantDates.length} relevant dates (today +9 days):`, relevantDates);
      
      relevantDates.forEach((dateString) => {
        const targetDate = new Date(dateString + 'T00:00:00');
        const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        console.log(`🔄 Processing date ${dateString} (day +${daysDiff})`);
        
        if (forecastData.forecastDays && forecastData.forecastDays.length > 0) {
          // Find the forecast day by matching the display date
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth() + 1; // JavaScript months are 0-indexed
          const targetDay = targetDate.getDate();
          
          const forecastDay = forecastData.forecastDays.find((day: any) => 
            day.displayDate?.year === targetYear &&
            day.displayDate?.month === targetMonth &&
            day.displayDate?.day === targetDay
          );
          
          if (forecastDay) {
            // Use the daytime forecast weather condition as primary, fallback to nighttime
            const weatherCondition = forecastDay.daytimeForecast?.weatherCondition || forecastDay.nighttimeForecast?.weatherCondition;
            
            results[dateString] = {
              high: Math.round(forecastDay.maxTemperature?.degrees || 0),
              low: Math.round(forecastDay.minTemperature?.degrees || 0),
              condition: weatherCondition?.description?.text || 'Unknown',
              icon: getGoogleWeatherIcon(weatherCondition?.type),
              location: locationName,
              date: dateString,
            };
            console.log(`✅ Added weather for ${dateString} (day +${daysDiff}):`, results[dateString]);
          } else {
            console.log(`⚠️ No forecast data for ${dateString} (day +${daysDiff})`);
          }
        } else {
          console.log(`⚠️ No forecast data for ${dateString} (day +${daysDiff})`);
        }
      });
      
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
      console.error('❌ Weather API error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
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
      console.log('🔄 Returning fallback results for', Object.keys(fallbackResults).length, 'dates');
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

function getGoogleWeatherIcon(condition?: string): string {
  if (!condition) return '⛅';
  
  switch (condition.toUpperCase()) {
    case 'CLEAR':
    case 'SUNNY':
      return '☀️';
    case 'CLOUDY':
    case 'MOSTLY_CLOUDY':
      return '☁️';
    case 'PARTLY_CLOUDY':
      return '⛅';
    case 'RAIN':
    case 'LIGHT_RAIN':
    case 'HEAVY_RAIN':
    case 'SHOWERS':
      return '🌧️';
    case 'THUNDERSTORM':
    case 'SEVERE_THUNDERSTORM':
      return '⛈️';
    case 'SNOW':
    case 'LIGHT_SNOW':
    case 'HEAVY_SNOW':
    case 'BLIZZARD':
      return '❄️';
    case 'FOG':
    case 'MIST':
    case 'HAZE':
      return '🌫️';
    case 'WINDY':
      return '💨';
    default:
      return '⛅';
  }
}

// Keep old function for backward compatibility
function getWeatherIcon(condition: string): string {
  return getGoogleWeatherIcon(condition);
}