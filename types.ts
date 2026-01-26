export interface Child {
  id: string;
  name: string;
  avatarUrl: string; // Base64 or URL
  totalPoints: number;
}

export interface ActivityLog {
  id: string;
  childId: string;
  description: string;
  points: number; // Positive for earning, negative for redeeming
  timestamp: number;
  category: 'chore' | 'behavior' | 'redemption' | 'other';
}

export interface ActivitySuggestion {
  description: string;
  points: number;
  category: ActivityLog['category'];
}
