// Query keys for admin-related queries
export const adminKeys = {
  all: ['admin'] as const,
  costs: () => [...adminKeys.all, 'costs'] as const,
  myCosts: (startDate?: string, endDate?: string) => 
    [...adminKeys.costs(), 'me', { startDate, endDate }] as const,
  allUsersCosts: (startDate?: string, endDate?: string) => 
    [...adminKeys.costs(), 'all', { startDate, endDate }] as const,
  userCosts: (userId: string, startDate?: string, endDate?: string) => 
    [...adminKeys.costs(), 'user', userId, { startDate, endDate }] as const,
  role: () => [...adminKeys.all, 'role'] as const,
};
