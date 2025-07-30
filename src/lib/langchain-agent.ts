import { Tool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatRequest, ChatResponse, PlaceDetails, PlannedActivity, Message } from '@/types';

// Simplified agent interface for our custom implementation
interface SimpleAgent {
  invoke(input: { input: string, chat_history?: any[] }): Promise<{ output: string, toolResults: any[] }>;
}

// Custom LLM wrapper for NVIDIA API
class NvidiaLLM {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY!;
    this.baseUrl = process.env.NVIDIA_BASE_URL!;
  }

  async call(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated.';
  }

  async invoke(input: { input: string }): Promise<{ content: string }> {
    const content = await this.call(input.input);
    return { content };
  }

  // Required for LangChain compatibility
  _llmType(): string {
    return 'nvidia';
  }
}

// Google Places Tool
class GooglePlacesTool extends Tool {
  name = 'google_places_search';
  description = 'Search for places, restaurants, attractions, and venues. Input should be a search query like "restaurants in downtown" or "museums near central park".';

  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  }

  async _call(query: string): Promise<string> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return `Error searching places: ${response.statusText}`;
      }

      const data = await response.json();
      const results = data.results?.slice(0, 5) || [];
      
      if (results.length === 0) {
        return `No places found for "${query}".`;
      }

      const placesInfo = results.map((place: any) => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 'No rating',
        priceLevel: place.price_level ? '$'.repeat(place.price_level) : 'Price not available',
        types: place.types?.slice(0, 3).join(', ') || 'No categories'
      }));

      return JSON.stringify(placesInfo, null, 2);
    } catch (error) {
      return `Error searching places: ${error}`;
    }
  }
}



// Event Planning Tool
class EventPlannerTool extends Tool {
  name = 'plan_itinerary';
  description = 'Create a detailed time-based itinerary for an event. Input should include the event type, duration, and preferences.';

  async _call(input: string): Promise<string> {
    try {
      // Parse the input to understand the planning request
      const planData = {
        eventType: this.extractEventType(input),
        duration: this.extractDuration(input),
        preferences: this.extractPreferences(input)
      };

      // Create a sample itinerary based on the request
      const itinerary = this.generateItinerary(planData);
      
      return JSON.stringify(itinerary, null, 2);
    } catch (error) {
      return `Error planning itinerary: ${error}`;
    }
  }

  private extractEventType(input: string): string {
    const eventTypes = ['birthday', 'date', 'meeting', 'party', 'outing', 'celebration'];
    for (const type of eventTypes) {
      if (input.toLowerCase().includes(type)) {
        return type;
      }
    }
    return 'general event';
  }

  private extractDuration(input: string): string {
    if (input.includes('all day') || input.includes('full day')) return 'full day';
    if (input.includes('evening')) return 'evening';
    if (input.includes('afternoon')) return 'afternoon';
    if (input.includes('morning')) return 'morning';
    return 'few hours';
  }

  private extractPreferences(input: string): string[] {
    const prefs = [];
    if (input.includes('food') || input.includes('restaurant')) prefs.push('dining');
    if (input.includes('fun') || input.includes('entertainment')) prefs.push('entertainment');
    if (input.includes('outdoor') || input.includes('park')) prefs.push('outdoor');
    if (input.includes('cultural') || input.includes('museum')) prefs.push('cultural');
    return prefs;
  }

  private generateItinerary(planData: any): any {
    const baseTime = new Date();
    baseTime.setHours(10, 0, 0, 0); // Start at 10 AM

    const activities = [];
    let currentTime = new Date(baseTime);

    // Generate activities based on event type and preferences
    if (planData.eventType === 'date') {
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Coffee and conversation at a cozy café',
        duration: '1 hour',
        type: 'dining'
      });
      
      currentTime.setHours(currentTime.getHours() + 2);
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Visit local park or attraction',
        duration: '2 hours',
        type: 'outdoor'
      });
      
      currentTime.setHours(currentTime.getHours() + 3);
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Dinner at a nice restaurant',
        duration: '2 hours',
        type: 'dining'
      });
    } else {
      // Generic itinerary
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Meet and greet',
        duration: '30 minutes',
        type: 'social'
      });
      
      currentTime.setHours(currentTime.getHours() + 1);
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Main activity or attraction',
        duration: '2 hours',
        type: 'entertainment'
      });
      
      currentTime.setHours(currentTime.getHours() + 2.5);
      activities.push({
        time: this.formatTime(currentTime),
        activity: 'Food and refreshments',
        duration: '1 hour',
        type: 'dining'
      });
    }

    return {
      eventType: planData.eventType,
      totalDuration: planData.duration,
      activities,
      tips: [
        'Check weather before the event',
        'Make reservations if needed',
        'Plan transportation between venues',
        'Have backup indoor options ready'
      ]
    };
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
}



export class LangChainEventAgent {
  private agent: SimpleAgent | null = null;
  private llm: NvidiaLLM;
  private tools: Tool[];

  constructor() {
    this.llm = new NvidiaLLM();
    this.tools = [
      new GooglePlacesTool(),
      new EventPlannerTool()
    ];
    
    this.initializeAgent();
  }

  private async initializeAgent() {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a concise AI event planning assistant with access to powerful tools.

RESPONSE STYLE RULES:
- ALWAYS keep responses very short and focused
- Determine user intent: BRAINSTORMING vs FOCUSED planning
- For BRAINSTORMING: Give 3-4 quick options with brief details
- For FOCUSED requests: Give 1 specific itinerary with times and venues
- Use tools automatically but don't mention using them
- Output plain text only, no formatting

BRAINSTORMING indicators: "ideas", "options", "what should we", "suggestions", vague location/time
FOCUSED indicators: specific location, specific time, clear activity type, detailed requirements

EXAMPLES:
Brainstorming: "What should we do in downtown?"
→ "Here are 3 options: 1) Food tour hitting 3 top restaurants 2) Art crawl with 2 galleries + rooftop bar 3) Outdoor market + riverside park picnic"

Focused: "Plan a 3-hour date in downtown starting at 2pm"  
→ "2:00pm - Coffee at Blue Bottle (15min) → 2:30pm - Walk through Union Square → 3:00pm - SFMOMA visit (90min) → 4:45pm - Drinks at rooftop bar"

Keep ALL responses under 7 sentences for brainstorming, under 10 sentences for focused plans.`],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ]);

    // For now, we'll use a simple approach since we're using NVIDIA API
    // In production, you'd use createOpenAIFunctionsAgent with OpenAI
    this.agent = await this.createSimpleAgent(prompt);
  }

  private async ensureAgentInitialized(): Promise<SimpleAgent> {
    if (!this.agent) {
      await this.initializeAgent();
    }
    return this.agent!;
  }

  private async createSimpleAgent(prompt: any): Promise<SimpleAgent> {
    // Create a simplified agent executor that can use our tools
    return {
      invoke: async (input: { input: string, chat_history?: any[] }) => {
        const userInput = input.input;
        
        // Analyze the input to determine which tools to use
        const toolsToUse = this.selectTools(userInput);
        
        // Execute tools and gather information
        const toolResults = await this.executeTools(toolsToUse, userInput);
        
        // Generate final response with LLM using tool results
        const finalPrompt = this.buildFinalPrompt(userInput, toolResults);
        const response = await this.llm.call(finalPrompt);
        
        return {
          output: response,
          toolResults: toolResults
        };
      }
    };
  }

  private selectTools(input: string): string[] {
    const selectedTools = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('place') || lowerInput.includes('restaurant') || 
        lowerInput.includes('venue') || lowerInput.includes('attraction') ||
        lowerInput.includes('where')) {
      selectedTools.push('google_places_search');
    }
    
    if (lowerInput.includes('plan') || lowerInput.includes('itinerary') ||
        lowerInput.includes('schedule') || lowerInput.includes('timeline')) {
      selectedTools.push('plan_itinerary');
    }
    
    // If no specific tools selected, use places and planning as defaults
    if (selectedTools.length === 0) {
      selectedTools.push('google_places_search', 'plan_itinerary');
    }
    
    return selectedTools;
  }

  private async executeTools(toolNames: string[], input: string): Promise<any[]> {
    const results = [];
    
    for (const toolName of toolNames) {
      const tool = this.tools.find(t => t.name === toolName);
      if (tool) {
        try {
          const result = await tool.call(input);
          results.push({
            tool: toolName,
            result: result
          });
        } catch (error) {
          results.push({
            tool: toolName,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    return results;
  }

  private buildFinalPrompt(userInput: string, toolResults: any[]): string {
    let prompt = `User Request: ${userInput}\n\n`;
    
    prompt += "Tool Results:\n";
    for (const result of toolResults) {
      prompt += `${result.tool}:\n${result.result || result.error}\n\n`;
    }
    
    prompt += `Based on the user's request and tool results, provide a CONCISE response following these rules:

BRAINSTORMING REQUEST (vague/exploring): Give 3-4 quick options, each in 1 line. Total: 3 sentences max.
FOCUSED REQUEST (specific details): Give 1 clear itinerary with times and venues. Total: 5 sentences max.

Use tool data but be brief. NO explanations about using tools. Just actionable recommendations.`;
    
    return prompt;
  }

  public async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, context } = request;
      const previousMessages = context?.previousMessages || [];
      
      // Extract location context from conversation
      const location = this.extractLocationFromMessages([...previousMessages, {
        id: 'temp',
        eventId: request.eventId,
        userId: 'temp',
        userDisplayName: 'temp',
        content: message,
        timestamp: new Date(),
        type: 'user'
      }]);

      // Enhance the message with location context if available
      const enhancedMessage = location ? `${message} (Context: near ${location})` : message;

      // Process with the agent
      const agent = await this.ensureAgentInitialized();
      const response = await agent.invoke({
        input: enhancedMessage,
        chat_history: this.formatChatHistory(previousMessages)
      });

      // Extract places and schedule from the response
      const suggestedPlaces = await this.extractPlacesFromResponse(response.output, response.toolResults);
      const parsedSchedule = this.extractScheduleFromResponse(response.output);

      return {
        message: response.output,
        suggestions: suggestedPlaces,
        schedule: parsedSchedule.length > 0 ? parsedSchedule : undefined,
      };

    } catch (error) {
      console.error('LangChain Agent Error:', error);
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        suggestions: [],
      };
    }
  }

  private formatChatHistory(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.type === 'user' ? 'human' : 'ai',
      content: msg.content
    }));
  }

  private extractLocationFromMessages(messages: Message[]): string | null {
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

  private async extractPlacesFromResponse(response: string, toolResults?: any[]): Promise<PlaceDetails[]> {
    const places: PlaceDetails[] = [];
    
    // Extract places from Google Places tool results
    const placesResult = toolResults?.find(r => r.tool === 'google_places_search');
    if (placesResult && !placesResult.error) {
      try {
        const placesData = JSON.parse(placesResult.result);
        for (const place of placesData.slice(0, 5)) {
          places.push({
            placeId: Math.random().toString(36).substr(2, 9),
            name: place.name,
            address: place.address,
            rating: typeof place.rating === 'number' ? place.rating : undefined,
            priceLevel: place.priceLevel?.length || undefined,
            photoUrl: undefined, // Would need to fetch from Places API
            location: { lat: 0, lng: 0 }, // Would need from Places API
            types: place.types ? [place.types] : []
          });
        }
      } catch (e) {
        console.error('Error parsing places data:', e);
      }
    }
    
    return places;
  }

  private extractScheduleFromResponse(response: string): PlannedActivity[] {
    const activities: PlannedActivity[] = [];
    
    // Extract time-based activities from the response
    const timePattern = /(\d{1,2}:\d{2}\s*(AM|PM))/gi;
    const lines = response.split('\n');
    
    for (const line of lines) {
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        const timeStr = timeMatch[0];
        const activityText = line.replace(timeMatch[0], '').replace(/[-:]/g, '').trim();
        
        if (activityText.length > 3) {
          activities.push({
            id: Math.random().toString(36).substr(2, 9),
            title: activityText,
            description: activityText,
            startTime: this.parseTime(timeStr),
            endTime: this.parseTime(timeStr, 60),
            type: this.inferActivityType(activityText),
          });
        }
      }
    }
    
    return activities;
  }

  private parseTime(timeStr: string, addMinutes: number = 0): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
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
}