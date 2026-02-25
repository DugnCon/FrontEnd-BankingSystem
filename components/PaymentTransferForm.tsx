"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { toast } from "sonner";

import { createTransaction } from "@/lib/actions/transaction.actions";
import { BankDropdown } from "./BankDropdown";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(4, "Ghi chú chuyển khoản quá ngắn"),
  amount: z.string().min(1, "Số tiền không được để trống"),
  senderBank: z.string().optional(),
  sharableId: z.string().min(1, "Vui lòng nhập mã tài khoản nhận"),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentTransferFormProps {
  accounts: any[];
}

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const idempotencyKeyRef = useRef<string>(uuidv4());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: "",
      senderBank: "",
      sharableId: "",
    },
  });

  const submit = async (data: FormValues) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const transactionData = {
        senderId: data.senderBank || null,
        receiverId: data.sharableId,
        amount: parseFloat(data.amount),
        note: data.name || undefined,
        email: data.email,
      };

      const response = await createTransaction(transactionData, {
        headers: {
          "Idempotency-Key": idempotencyKeyRef.current,
        },
      });

      if (response?.success) {
        toast.success(response.message || `Chuyển khoản thành công ${data.amount} VND đến ${data.email}!`);
        form.reset();
        router.push("/");
      } else {
        toast.error(response.message || "Chuyển khoản thất bại, vui lòng thử lại.");
      }
    } catch (error: any) {
      console.error("[TRANSFER ERROR]:", error);

      let errorMsg = "Chuyển khoản thất bại, vui lòng thử lại.";

      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);

      if (error?.status === 409 || error?.message?.includes("idempotent")) {
        toast.error("Giao dịch này đã được xử lý trước đó. Vui lòng kiểm tra lịch sử.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6 pb-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Từ tài khoản</h3>
          <FormField
            control={form.control}
            name="senderBank"
            render={() => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-gray-700">
                  Tài khoản nguồn (tùy chọn)
                </FormLabel>
                <FormControl>
                  <div className={cn(isLoading && "pointer-events-none opacity-70")}>
                    <BankDropdown
                      accounts={accounts}
                      setValue={form.setValue}
                      otherStyles="w-full"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-600" />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Đến người nhận</h3>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Email người nhận
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ví dụ: johndoe@gmail.com"
                      className="h-11 rounded-xl border-gray-300 text-base focus:border-blue-600 focus:ring-blue-500 focus:ring-1"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sharableId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Mã tài khoản nhận (Sharable ID)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập mã Shareable ID"
                      className="h-11 rounded-xl border-gray-300 text-base focus:border-blue-600 focus:ring-blue-500 focus:ring-1"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Chi tiết chuyển khoản</h3>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Số tiền (VND)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="0"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="h-11 rounded-xl border-gray-300 pl-10 pr-16 text-base focus:border-blue-600 focus:ring-blue-500 focus:ring-1"
                        disabled={isLoading}
                        {...field}
                      />
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <span className="text-gray-500 text-base">₫</span>
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <span className="text-gray-400 text-sm">VND</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Nội dung CK (tùy chọn)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ví dụ: Chuyển tiền sinh nhật bạn"
                      className="min-h-[90px] rounded-xl border-gray-300 text-base focus:border-blue-600 focus:ring-blue-500 focus:ring-1"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Xác nhận chuyển khoản"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;