import type { Request, Response } from 'express';
import { z } from 'zod';
import * as walletService from '../services/wallet.service.js';

const fundSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().default('NGN'),
  accountName: z.string().min(1),
});

export async function fundWallet(req: Request, res: Response) {
  const input = fundSchema.parse(req.body);
  const result = await walletService.fundWallet(input);
  res.status(201).json(result);
}

const withdrawSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().default('NGN'),
  destination: z.object({
    accountNumber: z.string().min(1),
    accountName: z.string().min(1),
    bankCode: z.string().min(1),
    branchCode: z.string().optional(),
  }),
  narration: z.string().optional(),
});

export async function withdrawWallet(req: Request, res: Response) {
  const input = withdrawSchema.parse(req.body);
  const result = await walletService.withdrawWallet(input);
  res.status(202).json(result);
}
