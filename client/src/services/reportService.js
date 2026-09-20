import api from './api';

export const reportService = {
  getReportData: async (params = {}) => {
    const response = await api.get('/reports/export-data', { params });
    return response.data;
  },

  downloadUnifiedExcel: async () => {
    const response = await api.get('/reports/download-excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TimeWise_Late_Entries.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
