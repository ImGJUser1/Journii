import { useQuery } from '@tanstack/react-query';

interface RouteRequest {
  from: string;
  to: string;
  preferences: {
    prioritize: 'time' | 'cost' | 'safety' | 'comfort';
    avoidCrowds: boolean;
    accessibilityNeeds: boolean;
    transportModes: string[];
  };
  departureTime?: string;
}

interface OptimizedRoute {
  id: string;
  duration: string;
  cost: string;
  safetyScore: number;
  crowdLevel: 'low' | 'medium' | 'high';
  steps: RouteStep[];
  alternatives: RouteAlternative[];
  realTimeUpdates: boolean;
}

interface RouteStep {
  mode: string;
  instruction: string;
  duration: string;
  distance?: string;
  line?: string;
  platform?: string;
}

interface RouteAlternative {
  reason: string;
  timeDifference: string;
  costDifference: string;
}

const generateOptimizedRoute = async (request: RouteRequest): Promise<OptimizedRoute[]> => {
  const prompt = `Generate optimized public transit routes from ${request.from} to ${request.to}.
  
  User preferences:
  - Priority: ${request.preferences.prioritize}
  - Avoid crowds: ${request.preferences.avoidCrowds}
  - Transport modes: ${request.preferences.transportModes.join(', ')}
  - Departure: ${request.departureTime || 'now'}
  
  Provide 3 route options with:
  - Step-by-step directions
  - Duration and cost estimates
  - Safety and crowd level assessments
  - Real-time considerations
  - Alternative suggestions
  
  Consider local transit systems, walking connections, and cultural points of interest along the way.`;

  try {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a transit optimization expert who provides detailed, practical route planning with real-time considerations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    
    // Mock structured response
    const mockRoutes: OptimizedRoute[] = [
      {
        id: '1',
        duration: '23 min',
        cost: '$3.50',
        safetyScore: 9.2,
        crowdLevel: 'low',
        realTimeUpdates: true,
        steps: [
          {
            mode: 'walk',
            instruction: 'Walk to Bus Stop A',
            duration: '3 min',
            distance: '0.2 km',
          },
          {
            mode: 'bus',
            instruction: 'Take Bus Line 42 towards Downtown',
            duration: '15 min',
            line: '42',
            platform: 'Platform B',
          },
          {
            mode: 'walk',
            instruction: 'Walk to destination',
            duration: '5 min',
            distance: '0.3 km',
          },
        ],
        alternatives: [
          {
            reason: 'Less walking',
            timeDifference: '+5 min',
            costDifference: '+$1.25',
          },
        ],
      },
    ];

    return mockRoutes;
  } catch (error) {
    console.error('Route optimization error:', error);
    throw error;
  }
};

export const useRouteOptimization = (request: RouteRequest) => {
  return useQuery({
    queryKey: ['route-optimization', request],
    queryFn: () => generateOptimizedRoute(request),
    enabled: !!request.from && !!request.to,
    staleTime: 1000 * 60 * 5, // 5 minutes for real-time data
  });
};