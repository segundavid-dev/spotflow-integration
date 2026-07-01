import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { logger } from '../config/logger.js';
import type { SpotflowWebhookEvent } from '../spotflow/spotflow.types.js';

export async function processEvent(event: SpotflowWebhookEvent): Promise<void> {
  if (event.event === 'account_credit_successful') {
    await creditWalletFromPayIn(event);
    return;
  }

  logger.info({ event: event.event }, 'Ignoring unhandled webhook event');
}

async function creditWalletFromPayIn(event: SpotflowWebhookEvent): Promise<void> {
  const accountId = event.data.account?.id;
  if (!accountId) {
    logger.warn('account_credit_successful missing data.account.id');
    return;
  }

  // Idempotency gate. This single atomic operation flips PENDING -> SUCCESS
  const transaction = await Transaction.findOneAndUpdate(
    { providerReference: accountId, type: 'PAYIN', status: 'PENDING' },
    { $set: { status: 'SUCCESS' } },
    { new: true },
  );

  if (!transaction) {
    logger.info({ accountId }, 'No PENDING pay-in matched (already processed or unknown)');
    return;
  }

  // Because the flip above happens once, this credit runs exactly once too.
  await Wallet.updateOne(
    { userId: transaction.userId },
    { $inc: { balance: transaction.amount } },
  );

  logger.info(
    { reference: transaction.reference, userId: transaction.userId, amount: transaction.amount },
    'Wallet credited from pay-in',
  );
}

