import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { startReconciliationJob } from './jobs/reconciliation.job.js';

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });
  startReconciliationJob();
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
