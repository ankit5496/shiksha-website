/** "mock" → in-browser demo database (localStorage). "api" → Express backend via /api. */
export const DATA_MODE: 'mock' | 'api' = import.meta.env.VITE_DATA_MODE === 'api' ? 'api' : 'mock';
export const API_BASE = '/api';
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
/** Documented demo password shared by all demo accounts. */
export const DEMO_PASSWORD = 'Demo@123';
