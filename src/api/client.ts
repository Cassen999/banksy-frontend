import axios from 'axios';
import { configure } from 'axios-hooks';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Bind axios-hooks to our configured instance so all useAxios calls
// automatically include baseURL and withCredentials.
configure({ axios: apiClient });
