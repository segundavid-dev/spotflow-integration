import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
}