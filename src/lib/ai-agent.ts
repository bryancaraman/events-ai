import { ChatRequest, ChatResponse, PlannedActivity, PlaceDetails, Message } from '@/types';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface NvidiaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GooglePlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photos?: Array<{ photo_reference: string }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export class EventPlanningAgent {
  private tools: AgentTool[] = [];

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    this.tools = [
      {
        name: 'search_places',
        description: 'Search for places and venues',
        execute: this.searchGooglePlaces.bind(this)
      },
      {
        name: 'get_weather',
        description: 'Get weather information for event planning',
        execute: this.getWeather.bind(this)
      },
      {
        name: 'check_availability',
        description: 'Check venue availability',
        execute: this.checkAvailability.bind(this)
      }
    ];
  }

  private async getWeather(params: {location: string, date: string}): Promise<any> {
    // Add weather API integration
    return { weather: 'sunny', temperature: 75 };
  }

  private async checkAvailability(params: {venue: string, date: string}): Promise<any> {
    // Add venue availability checking
    return { available: true, timeSlots: ['10:00 AM', '2:00 PM', '6:00 PM'] };
  }

  private async callNvidiaAPI(messages: NvidiaMessage[]): Promise<string> {
    if (!NVIDIA_API_KEY || !NVIDIA_BASE_URL) {
      throw new Error('NVIDIA API configuration missing');
    }

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  }

  private async searchGooglePlaces(query: string, location?: string): Promise<GooglePlaceSearchResult[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key missing');
    }

    const searchQuery = location ? `${query} in ${location}` : query;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  private async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,price_level,photos,geometry,types&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const place = data.result;

    if (!place) return null;

    let photoUrl;
    if (place.photos && place.photos.length > 0) {
      const photoReference = place.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
    }

    return {
      placeId,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      priceLevel: place.price_level,
      photoUrl,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      types: place.types || [],
    };
  }

  private formatMessagesForAI(messages: Message[]): NvidiaMessage[] {
    return messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  private extractLocationFromMessages(messages: Message[]): string | null {
    // Simple extraction - look for city names or locations mentioned
    const locationKeywords = ['in ', 'at ', 'near ', 'around '];
    
    for (const message of messages.reverse()) {
      const content = message.content.toLowerCase();
      for (const keyword of locationKeywords) {
        const index = content.indexOf(keyword);
        if (index !== -1) {
          const locationPart = content.substring(index + keyword.length);
          const location = locationPart.split(/[,.!?]/)[0].trim();
          if (location.length > 2) {
            return location;
          }
        }
      }
    }
    return null;
  }

  private async extractPlacesFromResponse(aiResponse: string, location?: string): Promise<PlaceDetails[]> {
    // Extract potential place types and search for them
    const placeTypes = [
      'restaurant', 'cafe', 'bar', 'museum', 'park', 'theater', 'cinema',
      'hotel', 'attraction', 'shopping', 'market', 'gallery', 'club'
    ];

    const foundPlaces: PlaceDetails[] = [];
    const response = aiResponse.toLowerCase();

    for (const placeType of placeTypes) {
      if (response.includes(placeType)) {
        try {
          const searchResults = await this.searchGooglePlaces(placeType, location);
          for (const result of searchResults.slice(0, 2)) { // Limit to 2 per type
            const details = await this.getPlaceDetails(result.place_id);
            if (details) {
              foundPlaces.push(details);
            }
          }
        } catch (error) {
          console.error(`Error searching for ${placeType}:`, error);
        }
      }
    }

    return foundPlaces.slice(0, 5); // Limit total suggestions
  }

  private parseScheduleFromResponse(aiResponse: string): PlannedActivity[] {
    // Simple schedule parsing - this could be enhanced with more sophisticated NLP
    const schedulePattern = /(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))/gi;
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const activities: PlannedActivity[] = [];

    for (const line of lines) {
      const timeMatch = line.match(schedulePattern);
      if (timeMatch) {
        const timeStr = timeMatch[0];
        const activityText = line.replace(timeMatch[0], '').replace(/[-:]/g, '').trim();
        
        if (activityText.length > 3) {
          // Create a basic activity
          const activity: PlannedActivity = {
            id: Math.random().toString(36).substr(2, 9),
            title: activityText,
            description: activityText,
            startTime: this.parseTime(timeStr),
            endTime: this.parseTime(timeStr, 60), // Add 1 hour
            type: this.inferActivityType(activityText),
          };
          activities.push(activity);
        }
      }
    }

    return activities;
  }

  private parseTime(timeStr: string, addMinutes: number = 0): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    // Simple time parsing - assumes format like "2:00" or "2 pm"
    const cleanTime = timeStr.toLowerCase().replace(/\s/g, '');
    let hours = 12;
    let minutes = 0;
    
    if (cleanTime.includes(':')) {
      const [h, m] = cleanTime.split(':');
      hours = parseInt(h);
      minutes = parseInt(m) || 0;
    } else {
      hours = parseInt(cleanTime.replace(/\D/g, '')) || 12;
    }
    
    if (cleanTime.includes('pm') && hours !== 12) {
      hours += 12;
    } else if (cleanTime.includes('am') && hours === 12) {
      hours = 0;
    }
    
    tomorrow.setHours(hours, minutes + addMinutes, 0, 0);
    return tomorrow;
  }

  private inferActivityType(text: string): PlannedActivity['type'] {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('eat') || lowerText.includes('dinner') || lowerText.includes('lunch')) {
      return 'restaurant';
    }
    if (lowerText.includes('hotel') || lowerText.includes('stay') || lowerText.includes('accommodation')) {
      return 'accommodation';
    }
    if (lowerText.includes('drive') || lowerText.includes('transport') || lowerText.includes('travel')) {
      return 'transportation';
    }
    return 'attraction';
  }

  private async executeToolsIfNeeded(response: string, location?: string): Promise<string> {
    // Simple tool detection - in a real agent system, you'd use function calling
    const toolCalls = this.detectToolCalls(response);
    
    if (toolCalls.length === 0) {
      return response;
    }

    let updatedResponse = response;
    
    for (const toolCall of toolCalls) {
      try {
        const tool = this.tools.find(t => t.name === toolCall.name);
        if (tool) {
          const result = await tool.execute(toolCall.params);
          updatedResponse = this.integrateToolResult(updatedResponse, toolCall, result);
        }
      } catch (error) {
        console.error(`Tool execution error for ${toolCall.name}:`, error);
      }
    }

    return updatedResponse;
  }

  private detectToolCalls(response: string): Array<{name: string, params: any}> {
    const toolCalls: Array<{name: string, params: any}> = [];
    
    // Simple heuristic-based detection (in production, use proper function calling)
    if (response.toLowerCase().includes('weather') || response.toLowerCase().includes('temperature')) {
      toolCalls.push({
        name: 'get_weather',
        params: { location: 'default', date: new Date().toISOString().split('T')[0] }
      });
    }
    
    if (response.toLowerCase().includes('availability') || response.toLowerCase().includes('book')) {
      toolCalls.push({
        name: 'check_availability',
        params: { venue: 'default', date: new Date().toISOString().split('T')[0] }
      });
    }

    return toolCalls;
  }

  private integrateToolResult(response: string, toolCall: {name: string, params: any}, result: any): string {
    // Integrate tool results into the response
    switch (toolCall.name) {
      case 'get_weather':
        return response + ` Weather will be ${result.weather} at ${result.temperature}°F.`;
      case 'check_availability':
        return response + ` Available time slots: ${result.timeSlots.join(', ')}.`;
      default:
        return response;
    }
  }

  public async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, context } = request;
      const previousMessages = context?.previousMessages || [];
      
      // Extract location context
      const location = this.extractLocationFromMessages([...previousMessages, {
        id: 'temp',
        eventId: request.eventId,
        userId: 'temp',
        userDisplayName: 'temp',
        content: message,
        timestamp: new Date(),
        type: 'user'
      }]);

      // Create system prompt for event planning
      const systemPrompt = `You are an autonomous AI event planning assistant. You can use tools to help plan events.

      AVAILABLE TOOLS:
      ${this.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

      INSTRUCTIONS:
      - Output ONLY plain text, no formatting
      - Keep responses very minimal and concise
      - Do NOT suggest multiple options - give exactly what they ask for
      - If the request is vague, create one balanced itinerary (park, restaurant, local hotspot)
      - AUTOMATICALLY use tools when needed - don't ask permission
      - Chain multiple tool calls if necessary for complete planning

      Current location context: ${location || 'not specified'}
      
      Think step by step:
      1. Identify what information you need
      2. Use appropriate tools to gather data
      3. Create a specific, actionable plan`;

      // Prepare messages for AI
      const aiMessages: NvidiaMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.formatMessagesForAI(previousMessages),
        { role: 'user', content: message }
      ];

      // Get AI response with potential tool calls
      let aiResponse = await this.callNvidiaAPI(aiMessages);
      
      // Check if AI wants to use tools and execute them
      aiResponse = await this.executeToolsIfNeeded(aiResponse, location);

      // Extract places and schedule from response
      const [suggestedPlaces, parsedSchedule] = await Promise.all([
        this.extractPlacesFromResponse(aiResponse, location),
        Promise.resolve(this.parseScheduleFromResponse(aiResponse))
      ]);

      return {
        message: aiResponse,
        suggestions: suggestedPlaces,
        schedule: parsedSchedule.length > 0 ? parsedSchedule : undefined,
      };

    } catch (error) {
      console.error('AI Agent Error:', error);
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        suggestions: [],
      };
    }
  }
} 