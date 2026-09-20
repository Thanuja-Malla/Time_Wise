import api from './api';

export const lateEntryService = {
  getLateEntries: async (params = {}) => {
    const response = await api.get('/late-entries', { params });
    return response.data;
  },

  getLateEntryById: async (id) => {
    const response = await api.get(`/late-entries/${id}`);
    return response.data;
  },

  getStudentLateHistory: async (studentId) => {
    const response = await api.get(`/late-entries/student/${studentId}`);
    return response.data;
  },

  createLateEntry: async (entryData) => {
    const response = await api.post('/late-entries', entryData);
    return response.data;
  },

  deleteLateEntry: async (id) => {
    const response = await api.delete(`/late-entries/${id}`);
    return response.data;
  }
};
