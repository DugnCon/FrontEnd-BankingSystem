import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react';

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return <div>Đang tải hoặc chưa đăng nhập...</div>;
  }

  const accounts = await getAccounts();

  if (!accounts || !accounts.data) {
    return <div>Không có tài khoản nào</div>;
  }

  // Vì data chỉ là 1 object duy nhất (không phải mảng)
  const accountList = accounts.data && typeof accounts.data === 'object' && !Array.isArray(accounts.data)
    ? [accounts.data]
    : Array.isArray(accounts.data)
    ? accounts.data
    : [];

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox 
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="space-y-4">
          <h2 className="header-2">
            Your cards
          </h2>
          <div className="flex flex-wrap gap-6">
            {accountList.map((a: Account) => (
              <BankCard 
                key={a.accountID}
                account={a}
                userName={`${loggedIn.firstName} ${loggedIn.lastName}`.trim() || 'Guest'}
                showBalance={true}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;