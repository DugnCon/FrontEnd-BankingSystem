/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

declare type SignUpParams = {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  password: string;
};

declare type LoginUser = {
  email: string;
  password: string;
};

declare type User = {
  $id: string;
  email: string;
  userID: string;
  firstName: string;
  lastName: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
};

declare type NewUserParams = {
  userID: string | number;
  email: string;
  name: string;
  password: string;
};

declare type Account = {
  accountID: string | number;
  availableBalance: number;
  currentBalance: number;
  officialName: string;
  mask: string;
  institutionID: string;
  name: string;
  type: string;
  subtype: string;
  shareableID: string;
};

declare type Transaction = {
  id: string;
  $id: string;
  name: string;
  paymentChannel: string;
  type: string;
  accountID: string | number;
  amount: number;
  pending: boolean;
  category: string;
  date: string;
  image: string;
  $createdAt: string;
  channel: string;
  senderBankId: string;
  receiverBankId: string;
};

declare type Bank = {
  $id: string;
  accountID: string | number;
  bankId: string;
  accessToken: string;
  fundingSourceUrl: string;
  userId: string;
  shareableID: string;
};

declare type AccountTypes =
  | "depository"
  | "credit"
  | "loan "
  | "investment"
  | "other";

declare type Category = "Food and Drink" | "Travel" | "Transfer";

declare type CategoryCount = {
  name: string;
  count: number;
  totalCount: number;
};

declare type Receiver = {
  firstName: string;
  lastName: string;
};

declare type TransferParams = {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amount: string;
};

declare type AddFundingSourceParams = {
  dwollaCustomerId: string;
  processorToken: string;
  bankName: string;
};

declare type NewDwollaCustomerParams = {
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
};

declare interface CreditCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
}

declare interface BankInfoProps {
  account: Account;
  appwriteItemId?: string;
  type: "full" | "card";
}

declare interface HeaderBoxProps {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
}

declare interface MobileNavProps {
  user: User;
}

declare interface PageHeaderProps {
  topTitle: string;
  bottomTitle: string;
  topDescription: string;
  bottomDescription: string;
  connectBank?: boolean;
}

declare interface PaginationProps {
  page: number;
  totalPages: number;
}

declare interface PlaidLinkProps {
  user: User;
  variant?: "primary" | "ghost";
  dwollaCustomerId?: string;
}

declare interface AuthFormProps {
  type: "sign-in" | "sign-up";
}

declare interface BankDropdownProps {
  accounts: Account[];
  setValue?: UseFormSetValue<any>;
  otherStyles?: string;
  disabled?: boolean;
}

declare interface BankTabItemProps {
  account: Account;
  appwriteItemId?: string;
}

declare interface TotalBalanceBoxProps {
  accounts: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
}

declare interface FooterProps {
  user: User;
  type?: 'mobile' | 'desktop'
}

declare interface RightSidebarProps {
  user: User;
  transactions: Transaction[];
  banks: Bank[] & Account[];
}

declare interface SiderbarProps {
  user: User;
}

declare interface RecentTransactionsProps {
  accounts: Account[];
  transactions: Transaction[];
  selectedAccountId: string | number;
  page: number;
}

declare interface TransactionHistoryTableProps {
  transactions: Transaction[];
  page: number;
}

declare interface CategoryBadgeProps {
  category: string;
}

declare interface TransactionTableProps {
  transactions: Transaction[];
}

declare interface CategoryProps {
  category: CategoryCount;
}

declare interface DoughnutChartProps {
  accounts: Account[];
}

declare interface PaymentTransferFormProps {
  accounts: Account[];
}

declare interface getAccountsProps {
  userId: string | number;
}

declare interface getAccountProps {
  accountID: string | number;
}

declare interface getInstitutionProps {
  institutionID: string;
}

declare interface getTransactionsProps {
  accountID: string | number;
}

declare interface CreateFundingSourceOptions {
  customerId: string;
  fundingSourceName: string;
  plaidToken: string;
  _links: object;
}

declare interface CreateTransactionProps {
  senderId: string | null;
  receiverId: string;
  amount: number;
  note: string | undefined;
  email: string;
}

declare interface getTransactionsByBankIdProps {
  bankId: string;
}

declare interface signInProps {
  email: string;
  password: string;
}

declare interface getUserInfoProps {
  userId: string;
}

declare interface exchangePublicTokenProps {
  publicToken: string;
  user: User;
}

declare interface createBankAccountProps {
  accessToken: string;
  userId: string;
  accountID: string | number;
  bankId: string;
  fundingSourceUrl: string;
  shareableID: string;
}

declare interface getBanksProps {
  userId: string;
}

declare interface getBankProps {
  documentId: string;
}

declare interface getBankByAccountIdProps {
  accountID: string | number;
}

declare interface BiometricPreference {
  userId: number;
  hasFaceId: boolean;
  hasFingerprint: boolean;
  faceDescriptor: string | null;
}

declare interface FaceVerificationResult {
  success: boolean;
  matchScore?: number;
  error?: string;
  fallbackAvailable: boolean;
}

declare interface FaceRegistrationResult {
  success: boolean;
  message: string;
}

declare interface FingerprintRegistrationResult {
  success: boolean;
  message: string;
}

declare interface FingerprintVerificationResult {
  success: boolean;
  message: string;
}