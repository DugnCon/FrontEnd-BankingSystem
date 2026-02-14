"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { BankDropdown } from "./BankDropdown";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

// Giả lập toast (mày có thể import từ sonner hoặc shadcn nếu dùng)
const toast = {
  success: (msg: string) => console.log("[TOAST SUCCESS]", msg),
  error: (msg: string) => console.log("[TOAST ERROR]", msg),
};

const formSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(4, "Ghi chú chuyển khoản quá ngắn"),
  amount: z.string().min(1, "Số tiền không được để trống"),
  senderBank: z.string().min(1, "Vui lòng chọn tài khoản nguồn"),
  sharableId: z.string().min(1, "Vui lòng nhập mã tài khoản nhận"),
});

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: "",
      senderBank: "",
      sharableId: "",
    },
  });

  const submit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // MOCK: Giả lập chuyển khoản thành công
      console.log("[MOCK TRANSFER]", {
        from: data.senderBank,
        to: data.sharableId,
        amount: data.amount,
        note: data.name,
        email: data.email,
      });

      // Giả lập delay 1s như API thật
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Toast success
      toast.success(`Chuyển khoản thành công: ${data.amount} VND đến ${data.email}`);

      form.reset();
      router.push("/");
    } catch (error) {
      console.error("[MOCK TRANSFER ERROR]:", error);
      toast.error("Chuyển khoản thất bại, vui lòng thử lại");
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
        <FormField
          control={form.control}
          name="senderBank"
          render={() => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Chọn tài khoản nguồn
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Chọn tài khoản bạn muốn chuyển tiền từ
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <BankDropdown
                      accounts={accounts}
                      setValue={form.setValue}
                      otherStyles="!w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Ghi chú chuyển khoản (Tùy chọn)
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Cung cấp thêm thông tin hoặc ghi chú liên quan đến giao dịch
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Textarea
                      placeholder="Viết ghi chú ngắn gọn ở đây"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_form-details">
          <h2 className="text-18 font-semibold text-gray-900">
            Thông tin tài khoản nhận
          </h2>
          <p className="text-16 font-normal text-gray-600">
            Nhập thông tin tài khoản của người nhận
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Email người nhận
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="ví dụ: johndoe@gmail.com"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sharableId"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-5 pt-6">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Mã tài khoản nhận (Sharable ID)
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="Nhập mã tài khoản công khai"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="border-y border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                  Số tiền
                </FormLabel>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="ví dụ: 5.00"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_btn-box">
          <Button type="submit" className="payment-transfer_btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> &nbsp; Đang gửi...
              </>
            ) : (
              "Chuyển khoản"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;