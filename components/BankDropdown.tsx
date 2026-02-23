"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

export const BankDropdown = ({
  accounts,
  setValue,
  otherStyles,
}: BankDropdownProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultAccount = accounts && accounts.length > 0 ? accounts[0] : undefined;
  
  const [selected, setSelected] = useState<Account | undefined>(defaultAccount);

  const handleBankChange = (id: string) => {
    const account = accounts.find((acc) => String(acc.accountID) === id);
    if (!account) return;

    setSelected(account);

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: id,
    });
    router.push(newUrl, { scroll: false });

    if (setValue) {
      setValue("senderBank", id);
    }
  };

  if (!selected || accounts.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger
          className={`flex w-full bg-white gap-3 md:w-[300px] ${otherStyles}`}
        >
          <Image
            src="/icons/credit-card.svg"
            width={20}
            height={20}
            alt="account"
          />
          <p className="line-clamp-1 w-full text-left text-gray-400">
            Không có tài khoản
          </p>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={String(selected.accountID)}
      onValueChange={handleBankChange}
    >
      <SelectTrigger
        className={`flex w-full bg-white gap-3 md:w-[300px] ${otherStyles}`}
      >
        <Image
          src="/icons/credit-card.svg"
          width={20}
          height={20}
          alt="account"
        />
        <p className="line-clamp-1 w-full text-left">{selected.name}</p>
      </SelectTrigger>

      <SelectContent
        className={`w-full bg-white md:w-[300px] ${otherStyles}`}
        align="end"
      >
        <SelectGroup>
          <SelectLabel className="py-2 font-normal text-gray-500">
            Chọn tài khoản
          </SelectLabel>
          {accounts.map((account) => (
            <SelectItem
              key={account.accountID}
              value={String(account.accountID)}
              className="cursor-pointer border-t"
            >
              <div className="flex flex-col">
                <p className="text-16 font-medium">{account.name}</p>
                <p className="text-14 font-medium text-blue-600">
                  {formatAmount(account.currentBalance)}
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};