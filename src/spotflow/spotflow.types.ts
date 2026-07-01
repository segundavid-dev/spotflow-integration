export interface CreateVirtualAccountRequest {
  currency: string;
  accountName: string;
  amount: number;
  expiresIn?: number;
}

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  mode: 'live' | 'test';
  lifecycle: string;
  amount: number;
  reference: string;
  expiresAt: string;
}

export interface TransferDestination {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  branchCode?: string;
}

export interface CreateTransferRequest {
  reference: string;
  amount: number;
  currency: string;
  destination: TransferDestination;
  narration?: string;
}

export interface Transfer {
  reference: string;
  spotflowreference: string;
  amount: number;
  currency: string;
  transferMode: string;
  destination: TransferDestination & { bankName?: string };
  narrations?: string;
  status: string;
}

export interface PaymentStatus {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  spotflowReference?: string;
}

export interface SpotflowWebhookEvent {
  event: string;
  data: {
    id: string;
    account?: {
      id: string;
      account_number: string;
      account_name: string;
    };
    reference?: string;
    spotflow_reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
  };
}
