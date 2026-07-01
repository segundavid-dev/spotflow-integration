import type { Request, Response } from 'express';
import { Webhook } from 'standardwebhooks';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import * as webhookService from '../services/webhook.service.js';
import type { SpotflowWebhookEvent } from '../spotflow/spotflow.types.js';


const webhookSecret = env.SPOTFLOW_WEBHOOK_SECRET?.replace(/^whsec_(test|live)_/, 'whsec_');

export async function handleSpotflowWebhook(req: Request, res: Response): Promise<void> {
  if (!webhookSecret) {
    logger.error('SPOTFLOW_WEBHOOK_SECRET is not set; cannot verify webhook');
    res.status(500).json({ message: 'Webhook secret not configured' });
    return;
  }


  const rawBody = req.body as Buffer;
  const headers = {
    'webhook-id': req.header('webhook-id') ?? '',
    'webhook-timestamp': req.header('webhook-timestamp') ?? '',
    'webhook-signature': req.header('x-spotflow-signature') ?? '',
  };

  let event: SpotflowWebhookEvent;
  try {
    event = new Webhook(webhookSecret).verify(
      rawBody.toString('utf8'),
      headers,
    ) as SpotflowWebhookEvent;
  } catch (err) {
    logger.warn({ err }, 'Webhook signature verification failed');
    res.status(401).json({ message: 'Invalid signature' });
    return;
  }

  await webhookService.processEvent(event);

  res.status(200).json({ received: true });
}
