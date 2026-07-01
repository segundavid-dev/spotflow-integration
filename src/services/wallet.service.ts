import { randomUUID } from 'node:crypto';
import { Wallet } from '../models/wallet.model.js';
import { Transaction } from '../models/transaction.model.js';
import { createVirtualAccount, createTransfer } from '../spotflow/spotflow.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

interface FundInput {
  userId: string;
  amount: number;
  currency: string;
  accountName: string;
}

export async function fundWallet(input: FundInput) {
  const { userId, amount, currency, accountName } = input;

  // Ensure the user has a wallet
  await Wallet.updateOne(
    { userId },
    { $setOnInsert: { userId, balance: 0, currency } },
    { upsert: true },
  );

  // Ask Spotflow for a temporary account for the user to pay into.
  const account = await createVirtualAccount({ currency, accountName, amount });

  // Record the intent as PENDING.
  const transaction = await Transaction.create({
    reference: randomUUID(),
    userId,
    type: 'PAYIN',
    status: 'PENDING',
    amount,
    currency,
    providerReference: account.id,
  });

  return {
    reference: transaction.reference,
    status: transaction.status,
    amount,
    currency,
    account: {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankName: account.bankName,
    },
  };
}

interface WithdrawInput {
  userId: string;
  amount: number;
  currency: string;
  destination: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    branchCode?: string;
  };
  narration?: string;
}

export async function withdrawWallet(input: WithdrawInput) {
  const { userId, amount, currency, destination, narration } = input;

  // Atomic guard: deduct only if the balance covers it. The { balance: $gte }
  // filter means two concurrent withdrawals can't both pass, so no overdraw.
  const wallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true },
  );
  if (!wallet) {
    throw new ApiError(400, 'Insufficient balance');
  }

  const reference = randomUUID();
  const transaction = await Transaction.create({
    reference,
    userId,
    type: 'PAYOUT',
    status: 'PENDING',
    amount,
    currency,
  });

  try {
    const transfer = await createTransfer({ reference, amount, currency, destination, narration });
    transaction.providerReference = transfer.spotflowreference;
    await transaction.save();
  } catch (err) {
    // Disbursement rejected: put the money back and mark the txn failed.
    await Wallet.updateOne({ userId }, { $inc: { balance: amount } });
    transaction.status = 'FAILED';
    await transaction.save();
    logger.warn({ err, reference }, 'Disbursement failed; wallet refunded');
    throw new ApiError(502, 'Disbursement failed; wallet refunded');
  }

  return {
    reference: transaction.reference,
    status: transaction.status,
    amount,
    currency,
    balance: wallet.balance,
  };
}
