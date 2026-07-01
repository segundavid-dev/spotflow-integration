import mongoose from 'mongoose';

export const TRANSACTION_TYPES = ['PAYIN', 'PAYOUT'] as const;
export const TRANSACTION_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED'] as const;

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, enum: [...TRANSACTION_TYPES], required: true },
    status: { type: String, enum: [...TRANSACTION_STATUSES], default: 'PENDING', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'NGN' },
    // Spotflow-side id, used by the reconciliation worker to poll status
    providerReference: { type: String },
  },
  { timestamps: true },
);


transactionSchema.index({ status: 1, createdAt: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
