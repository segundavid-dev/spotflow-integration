import { schedule } from 'node-cron';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { verifyPayment, getTransferByReference } from '../spotflow/spotflow.service.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

type TxnDoc = NonNullable<Awaited<ReturnType<typeof Transaction.findOne>>>;

const SUCCESS_STATES = ['success', 'successful', 'completed', 'paid'];
const FAILED_STATES = ['failed', 'reversed', 'declined', 'cancelled'];

// Runs every 5 minutes; each pass reconciles transactions that have been
// PENDING longer than PENDING_TIMEOUT_MINUTES.
export function startReconciliationJob(): void {
  schedule('*/5 * * * *', () => {
    reconcilePendingTransactions().catch((err) =>
      logger.error({ err }, 'Reconciliation job failed'),
    );
  });
  logger.info('Reconciliation job scheduled (every 5 minutes)');
}

export async function reconcilePendingTransactions(): Promise<void> {
  const cutoff = new Date(Date.now() - env.PENDING_TIMEOUT_MINUTES * 60_000);
  const stuck = await Transaction.find({ status: 'PENDING', createdAt: { $lt: cutoff } });
  if (stuck.length === 0) return;

  logger.info({ count: stuck.length }, 'Reconciling stuck PENDING transactions');
  for (const txn of stuck) {
    try {
      if (txn.type === 'PAYOUT') {
        await reconcilePayout(txn);
      } else {
        await reconcilePayin(txn);
      }
    } catch (err) {
      // Spotflow has no record, or the poll failed: give up on this one.
      logger.warn({ err, reference: txn.reference }, 'Poll failed; marking ABANDONED');
      await Transaction.updateOne({ _id: txn._id, status: 'PENDING' }, { $set: { status: 'ABANDONED' } });
    }
  }
}

async function reconcilePayin(txn: TxnDoc): Promise<void> {
  const payment = await verifyPayment(txn.reference);
  const status = (payment.status ?? '').toLowerCase();

  if (SUCCESS_STATES.includes(status)) {
    // Atomic flip guards against a webhook crediting the same txn concurrently.
    const flipped = await Transaction.findOneAndUpdate(
      { _id: txn._id, status: 'PENDING' },
      { $set: { status: 'SUCCESS' } },
      { new: true },
    );
    if (flipped) {
      await Wallet.updateOne({ userId: txn.userId }, { $inc: { balance: txn.amount } });
      logger.info({ reference: txn.reference }, 'Pay-in confirmed via reconciliation');
    }
    return;
  }

  await Transaction.updateOne({ _id: txn._id, status: 'PENDING' }, { $set: { status: 'ABANDONED' } });
}

async function reconcilePayout(txn: TxnDoc): Promise<void> {
  const transfer = await getTransferByReference(txn.reference);
  const status = (transfer.status ?? '').toLowerCase();

  if (SUCCESS_STATES.includes(status)) {
    await Transaction.updateOne({ _id: txn._id, status: 'PENDING' }, { $set: { status: 'SUCCESS' } });
    logger.info({ reference: txn.reference }, 'Payout confirmed via reconciliation');
    return;
  }

  if (FAILED_STATES.includes(status)) {
    const flipped = await Transaction.findOneAndUpdate(
      { _id: txn._id, status: 'PENDING' },
      { $set: { status: 'FAILED' } },
      { new: true },
    );
    if (flipped) {
      await Wallet.updateOne({ userId: txn.userId }, { $inc: { balance: txn.amount } });
      logger.info({ reference: txn.reference }, 'Payout failed; wallet refunded via reconciliation');
    }
  }
  // else still processing: leave PENDING for a later run
}
