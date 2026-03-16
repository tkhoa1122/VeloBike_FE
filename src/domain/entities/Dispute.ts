export type DisputeReason =
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'ITEM_DAMAGED'
  | 'WRONG_ITEM'
  | 'MISSING_PARTS'
  | 'FAKE_ITEM'
  | 'SELLER_NOT_RESPONSIVE'
  | 'SHIPPING_ISSUE'
  | 'OTHER';

export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface DisputeComment {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  attachments?: string[];
  createdAt: Date;
}

export interface Dispute {
  _id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: DisputeReason;
  description: string;
  evidence: string[]; // Image URLs
  status: DisputeStatus;
  comments: DisputeComment[];
  resolution?: string;
  resolvedBy?: string; // Admin user ID
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateDisputeData {
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[];
}

export interface AddDisputeCommentData {
  disputeId: string;
  comment: string;
  attachments?: string[];
}

export interface DisputeSearchParams {
  status?: DisputeStatus;
  page?: number;
  limit?: number;
}

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  ITEM_NOT_AS_DESCRIBED: 'Sản phẩm không đúng mô tả',
  ITEM_DAMAGED: 'Sản phẩm bị hư hỏng',
  WRONG_ITEM: 'Giao sai sản phẩm',
  MISSING_PARTS: 'Thiếu phụ kiện/linh kiện',
  FAKE_ITEM: 'Sản phẩm giả mạo',
  SELLER_NOT_RESPONSIVE: 'Người bán không phản hồi',
  SHIPPING_ISSUE: 'Vấn đề về vận chuyển',
  OTHER: 'Lý do khác',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: 'Mở',
  IN_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};
