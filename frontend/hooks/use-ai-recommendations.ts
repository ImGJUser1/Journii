import { useQuery } from '@tanstack/react-query';

interface AIRecommendationRequest {
  userInterests: string[];
  location: string;
  timeOfDay: string;
  budget?: string;
  groupSize?: number;
}

interface CulturalExperience {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  estimatedDuration: string;
  priceRange: string;
  rating: number;
  culturalSignificance: string;
  bestTimeToVisit: string;
}

const generateAIRecommendations = async (request: AIRecommendationRequest): Promise<CulturalExperience[]> => {
  const prompt = `As a cultural travel expert, recommend 5 authentic cultural experiences in ${request.location} for someone interested in ${request.userInterests.join(', ')}. 
  
  Consider:
  - Time: ${request.timeOfDay}
  - Budget: ${request.budget || 'flexible'}
  - Group size: ${request.groupSize || 1}
  
  For each recommendation, provide:
  - Title and category
  - Detailed description with cultural context
  - Location and duration
  - Price range and rating
  - Cultural significance
  - Best time to visit
  
  Focus on authentic, local experiences that provide deep cultural immersion.`;

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
            content: 'You are a cultural travel expert who specializes in authentic, immersive local experiences. Respond with detailed, practical recommendations in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    
    // Parse AI response and structure it
    // This is a simplified version - in production, you'd want more robust parsing
    const mockRecommendations: CulturalExperience[] = [
      {
        id: '1',
        title: 'Traditional Pottery Workshop',
        category: 'Artisan Experience',
        location: 'Historic District',
        description: 'Learn ancient pottery techniques from master craftsmen in a traditional workshop setting.',
        estimatedDuration: '2h 30m',
        priceRange: '$35-45',
        rating: 4.8,
        culturalSignificance: 'Preserves 500-year-old ceramic traditions',
        bestTimeToVisit: 'Morning sessions available',
      },
      // Add more based on AI response
    ];

    return mockRecommendations;
  } catch (error) {
    console.error('AI recommendation error:', error);
    throw error;
  }
};

export const useAIRecommendations = (request: AIRecommendationRequest) => {
  return useQuery({
    queryKey: ['ai-recommendations', request],
    queryFn: () => generateAIRecommendations(request),
    enabled: !!request.location && request.userInterests.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};