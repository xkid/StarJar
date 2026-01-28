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
  category: 'chore' | 'behavior' | 'redemption' | 'investment' | 'other';
}

export interface ActivitySuggestion {
  description: string;
  points: number;
  category: ActivityLog['category'];
}

export interface Bank {
  id: string;
  name: string;
  description: string;
  color: string;
  rate: number; // Annual interest rate in %
}

export interface Investment {
  id: string;
  childId: string;
  bankId: string;
  principal: number;
  rate: number;
  durationMonths: number;
  startDate: number;
  maturityDate: number;
  projectedReturn: number;
  status: 'active' | 'completed' | 'early_withdrawn';
}