import { spotflowClient } from './spotflow.client.js';
import type {
  CreateVirtualAccountRequest,
  VirtualAccount,
  CreateTransferRequest,
  Transfer,
  PaymentStatus,
} from './spotflow.types.js';

// Pay-In: create a temporary virtual account the user pays into.
export async function createVirtualAccount(
  payload: CreateVirtualAccountRequest,
): Promise<VirtualAccount> {
  const { data } = await spotflowClient.post<VirtualAccount>(
    '/virtual-accounts/temporary',
    payload,
  );
  return data;
}

// Payout: disburse funds to a bank account.
export async function createTransfer(payload: CreateTransferRequest): Promise<Transfer> {
  const { data } = await spotflowClient.post<Transfer>('/transfers', payload);
  return data;
}

// Reconciliation: fetch the true status of a collection (pay-in).
export async function verifyPayment(reference: string): Promise<PaymentStatus> {
  const { data } = await spotflowClient.get<PaymentStatus>('/payments/verify', {
    params: { reference },
  });
  return data;
}

// Reconciliation: fetch the true status of a transfer (payout).
export async function getTransferByReference(reference: string): Promise<Transfer> {
  const { data } = await spotflowClient.get<Transfer>(`/transfers/reference/${reference}`);
  return data;
}
