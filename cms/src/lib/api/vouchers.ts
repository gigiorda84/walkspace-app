import { apiClient } from './client';

export interface VoucherBatch {
  id: string;
  name: string;
  description: string;
  tourId: string;
  createdByUserId: string;
  createdAt: string;
  voucherCount?: number;
}

export interface Voucher {
  id: string;
  code: string;
  batchId: string;
  tourId: string;
  maxUses: number;
  usesSoFar: number;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateVoucherBatchRequest {
  name: string;
  description: string;
  tourId: string;
  quantity: number;
  maxUsesPerCode: number;
  expiresAt: string;
  codePrefix?: string;
}

export const vouchersApi = {
  /**
   * Get all voucher batches
   */
  async getAllBatches(): Promise<VoucherBatch[]> {
    const response = await apiClient.get<VoucherBatch[]>('/admin/voucher-batches');
    return response.data;
  },

  /**
   * Get a specific voucher batch
   */
  async getBatch(batchId: string): Promise<VoucherBatch> {
    const response = await apiClient.get<VoucherBatch>(`/admin/voucher-batches/${batchId}`);
    return response.data;
  },

  /**
   * Create a new voucher batch
   */
  async createBatch(data: CreateVoucherBatchRequest): Promise<VoucherBatch> {
    const response = await apiClient.post<VoucherBatch>('/admin/voucher-batches', data);
    return response.data;
  },

  /**
   * Update a voucher batch
   */
  async updateBatch(batchId: string, data: Partial<VoucherBatch>): Promise<VoucherBatch> {
    const response = await apiClient.patch<VoucherBatch>(`/admin/voucher-batches/${batchId}`, data);
    return response.data;
  },

  /**
   * Delete a voucher batch
   */
  async deleteBatch(batchId: string): Promise<void> {
    await apiClient.delete(`/admin/voucher-batches/${batchId}`);
  },

  /**
   * Get all vouchers in a batch
   */
  async getVouchersByBatch(batchId: string): Promise<Voucher[]> {
    const response = await apiClient.get<Voucher[]>(`/admin/voucher-batches/${batchId}/vouchers`);
    return response.data;
  },

  /**
   * Activate/Deactivate a voucher
   */
  async toggleVoucher(voucherId: string, isActive: boolean): Promise<Voucher> {
    const response = await apiClient.patch<Voucher>(`/admin/vouchers/${voucherId}`, { isActive });
    return response.data;
  },

  /**
   * Export vouchers as CSV
   */
  async exportBatchCsv(batchId: string): Promise<Blob> {
    const response = await apiClient.get(`/admin/voucher-batches/${batchId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
