import axios from 'axios';
import { configure } from 'axios-hooks';
import { handleUnauthorized } from '../utils/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // /api/auth/me returning 401 means "not logged in" — expected on load after logout.
    // Every other 401 means a session expired mid-use and requires re-authentication.
    if (error.response?.status === 401 && error.config?.url !== '/api/auth/me') {
      handleUnauthorized();
    }
    return Promise.reject(error);
  },
);

// Bind axios-hooks to our configured instance so all useAxios calls
// automatically include baseURL, withCredentials, and the 401 interceptor.
configure({ axios: apiClient });
