'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Building, Lock, CheckCircle, AlertCircle, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';
import { createFullBankAccount, checkAccounts } from '@/lib/actions/bank.actions';
import { getSession } from '@/lib/session/session';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AccountSubtypeEnum = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  JOINT: 'joint',
} as const;

const formSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  subtype: z.enum(
    [AccountSubtypeEnum.PERSONAL, AccountSubtypeEnum.BUSINESS, AccountSubtypeEnum.JOINT],
    { required_error: 'Please select an account subtype' }
  ),
  mask: z
    .string()
    .length(4, 'Last 4 digits must be exactly 4 numbers')
    .regex(/^\d{4}$/, 'Only numbers allowed (4 digits)'),
  institutionId: z.string().optional(),
  officialName: z.string().optional(),
  availableBalance: z.number().min(0, 'Balance cannot be negative').default(0),
  currentBalance: z.number().min(0, 'Balance cannot be negative').default(0),
});

type FormValues = z.infer<typeof formSchema>;

const SUBTYPE_OPTIONS = [
  { value: AccountSubtypeEnum.PERSONAL, label: 'Personal Account' },
  { value: AccountSubtypeEnum.BUSINESS, label: 'Business Account' },
  { value: AccountSubtypeEnum.JOINT, label: 'Joint Account' },
] as const;

interface BankAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({
  onSuccess,
  onCancel,
  className = '',
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const session = getSession();
  const hasCheckedRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      officialName: '',
      subtype: AccountSubtypeEnum.PERSONAL,
      mask: '',
      institutionId: '',
      availableBalance: 0,
      currentBalance: 0,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (hasCheckedRef.current) return;
    if (!session?.userID) {
      setCheckError('Please sign in to continue');
      setIsChecking(false);
      return;
    }

    hasCheckedRef.current = true;

    const checkUserAccounts = async () => {
      setIsChecking(true);
      setCheckError(null);

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject({ status: 429, message: 'Timeout' }), 6000)
        );

        const result = (await Promise.race([
          checkAccounts(),
          timeoutPromise,
        ])) as Awaited<ReturnType<typeof checkAccounts>>;

        setHasAccounts(result.hasAccounts);
      } catch (error: any) {
        console.error('Check accounts failed:', error);

        if (error?.status === 429 || error?.message?.includes('429') || error?.message === 'Timeout') {
          setCheckError('System is busy, please try again in a few minutes');
        } else if (error?.status === 401) {
          toast.error('Session expired');
          router.push('/sign-in');
          return;
        } else {
          setCheckError('Unable to connect to server. Please check your network and try again.');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkUserAccounts();
  }, [session?.userID, router]);

  const onSubmit = async (data: FormValues) => {
    if (!session?.userID) {
      router.push('/sign-in');
      return;
    }

    setIsLoading(true);

    try {
      await createFullBankAccount({
        userId: String(session.userID),
        name: data.name,
        officialName: data.officialName,
        type: data.subtype,
        subtype: data.subtype,
        mask: data.mask,
        institutionId: data.institutionId,
        availableBalance: data.availableBalance,
        currentBalance: data.currentBalance,
      });

      toast.success('Account added successfully!');
      onSuccess?.();

      // Reload toàn bộ trang để cập nhật dữ liệu mới nhất
      window.location.reload();
      // Hoặc nếu muốn giữ URL và reload soft hơn: router.replace(router.asPath, { scroll: false }); rồi router.refresh();
    } catch (err) {
      console.error('Create account error:', err);
      toast.error('Failed to add account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const isValid = await form.trigger(['name', 'subtype', 'mask']);
    if (isValid) setStep(2);
  };

  const prevStep = () => setStep(1);

  const canProceedToStep2 =
    !isChecking &&
    !checkError &&
    form.formState.isValid &&
    hasAccounts === false;

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-600">
        Please sign in to continue
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 font-medium">Checking your accounts...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-xl font-semibold flex items-center gap-2.5">
          <Building className="w-5 h-5" />
          Add Bank Account
        </h2>
        <p className="text-sm text-blue-100 mt-1 opacity-90">
          Connect your account to manage finances easily
        </p>
      </div>

      {checkError ? (
        <div className="mx-6 mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <ServerCrash className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Cannot connect to server</p>
            <p className="text-sm text-red-700 mt-1">{checkError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : hasAccounts ? (
        <div className="mx-6 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">You already have a bank account</p>
            <p className="text-sm text-amber-700 mt-1">
              You can still add a new account anytime.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-6 mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-emerald-800">You do not have any bank account yet</p>
            <p className="text-sm text-emerald-700 mt-1">
              Create your first account to start managing finances!
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-5 bg-gray-50 border-b">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Step number={1} label="Basic Info" active={step >= 1} current={step === 1} />
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <Step number={2} label="Balance" active={step >= 2} current={step === 2} />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Checking" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Subtype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBTYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mask"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 4 digits</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234"
                        maxLength={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institutionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vietcombank, Techcombank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="officialName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vietcombank Checking Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="availableBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Balance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Balance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Your information is secure</span>
                </div>
                <p className="text-xs opacity-80">
                  Data is encrypted and protected.
                </p>
              </div>
            </div>
          )}
        </form>
      </Form>

      <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3 border-t">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isLoading}
            className="flex-1 order-2 sm:order-1"
          >
            Back
          </Button>
        )}

        {step === 1 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceedToStep2}
            className={`flex-1 order-1 sm:order-2 ${
              canProceedToStep2
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed opacity-70'
            } text-white`}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading || !!checkError}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Account'
            )}
          </Button>
        )}

        {onCancel && step === 1 && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-600 order-3 sm:order-last"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

function Step({
  number,
  label,
  active,
  current,
}: {
  number: number;
  label: string;
  active: boolean;
  current: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
          current
            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
            : active
            ? 'bg-blue-100 text-blue-700 border-blue-400'
            : 'bg-gray-100 text-gray-500 border-gray-300'
        }`}
      >
        {number}
      </div>
      <span
        className={`text-xs mt-2 font-medium ${
          current ? 'text-blue-700' : active ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default BankAccountForm;