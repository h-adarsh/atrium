export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'RESIDENT' | 'STAFF';

export type DueStatus = 'PENDING' | 'SUBMITTED_FOR_VERIFICATION' | 'PAID' | 'OVERDUE';

export type PaymentVerification = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type NoticePriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type OccupancyType = 'OWNER' | 'TENANT';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Society {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  totalFloors: number;
  flatsPerFloor: number;
  hasBasement: boolean;
  hasTerrace: boolean;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  upiId?: string | null;
  _count?: {
    flats?: number;
    users?: number;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  occupancyType?: OccupancyType;
  approvalStatus?: ApprovalStatus;
  society?: Society | null;
  flat?: {
    id: string;
    unitNumber: string;
    floorNumber: number;
    superBuiltUpSqFt: number;
    occupancyType?: OccupancyType;
    occupantCount?: number;
  } | null;
}

export interface MaintenanceConfig {
  id: string;
  baseFixedCharge: number | string;
  ratePerSqFt: number | string;
  dueDayOfMonth: number;
  lateFeeFlat: number | string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  upiId: string;
}

export interface Payment {
  id: string;
  dueId: string;
  amountPaid: number | string;
  paymentMethod: string;
  utrNumber: string;
  proofImageUrl?: string | null;
  verificationStatus: PaymentVerification;
  receiptNumber?: string | null;
  receiptPdfUrl?: string | null;
  paidAt: string;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  verifiedBy?: { id: string; fullName: string; role: Role } | null;
  rejectionReason?: string | null;
}

export interface MaintenanceDue {
  id: string;
  flatId: string;
  billingPeriod: string;
  sqFtRate: number | string;
  areaSqFt: number;
  fixedCharge: number | string;
  variableCharge: number | string;
  totalDue: number | string;
  dueDate: string;
  status: DueStatus;
  flat: {
    id: string;
    unitNumber: string;
    floorNumber: number;
    superBuiltUpSqFt: number;
    resident?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
    } | null;
  };
  payment?: Payment | null;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number | string;
  expenseDate: string;
  vendorName?: string | null;
  billImageUrl?: string | null;
  recordedById: string;
  recordedBy: {
    id: string;
    fullName: string;
    role: Role;
  };
}

export interface Complaint {
  id: string;
  ticketNumber: number;
  flatId: string;
  flat: {
    unitNumber: string;
    floorNumber: number;
  };
  createdById: string;
  createdBy: {
    fullName: string;
    phone?: string | null;
  };
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  photoUrl?: string | null;
  resolutionPhotoUrl?: string | null;
  preferredSlot?: string | null;
  assignedTo?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: NoticePriority;
  pinned: boolean;
  expiresAt?: string | null;
  publishedById: string;
  publishedBy: {
    fullName: string;
    role: Role;
  };
  createdAt: string;
}

export interface FlatItem {
  id: string;
  unitNumber: string;
  floorNumber: number;
  superBuiltUpSqFt: number;
  carpetSqFt?: number | null;
  occupancyType?: OccupancyType;
  occupantCount?: number;
  resident?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  } | null;
  dues?: MaintenanceDue[];
}

export interface FinancialSummary {
  billingPeriod: string;
  totalBilled?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  paidCount?: number;
  pendingCount?: number;
  pendingVerificationCount?: number;
  totalExpenses: number;
  netBalance?: number;
  totalFlats?: number;
  isAdmin?: boolean;
}

export type FeedbackType = 'BUG' | 'FEATURE_REQUEST' | 'USABILITY' | 'GENERAL';

export interface Feedback {
  id: string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  rating: number;
  category: FeedbackType;
  message: string;
  page?: string | null;
  deviceInfo?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    flat?: { unitNumber: string } | null;
  } | null;
}

export interface FeedbackSummary {
  totalCount: number;
  avgRating: number;
  categoryBreakdown: {
    BUG: number;
    FEATURE_REQUEST: number;
    USABILITY: number;
    GENERAL: number;
  };
}


