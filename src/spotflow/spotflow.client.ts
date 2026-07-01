import axios from 'axios';
import { env } from '../config/env.js';

const BASE_URL = env.SPOTFLOW_BASE_URL ?? 'https://api.spotflow.co/api/v1';

// Axios instance for Spotflow API requests
export const spotflowClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${env.SPOTFLOW_API_KEY ?? ''}`,
    'Content-Type': 'application/json',
  },
});
