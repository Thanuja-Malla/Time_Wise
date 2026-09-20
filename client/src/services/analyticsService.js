import api from './api';

export const analyticsService = {
  getDashboardAnalytics: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getFrequentLateStudents: async (limit = 10) => {
    const response = await api.get('/analytics/frequent-late-students', {
      params: { limit }
    });
    return response.data;
  },

  getMonthlyAnalytics: async () => {
    const response = await api.get('/analytics/monthly');
    return response.data;
  }
};
