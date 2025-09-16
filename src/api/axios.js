import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API || 'http://localhost:5000/api' });
export default api;
