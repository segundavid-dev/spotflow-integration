import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'NGN' },
  },
  { timestamps: true },
);

export const Wallet = mongoose.model('Wallet', walletSchema);
