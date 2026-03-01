import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHoursLearned: number;
  certificatesEarned: number;
  streak: number;
}

interface AnalyticsContextType {
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  fetchDashboardStats: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchDashboardStats = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulated - would call API
      setDashboardStats({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalHoursLearned: 0,
        certificatesEarned: 0,
        streak: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AnalyticsContextType = {
    dashboardStats,
    isLoading,
    fetchDashboardStats
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
