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

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  });

  if (!accounts || !accounts.data) {
    return <div>Không có tài khoản nào</div>;
  }

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
            {accounts.data.map((a: Account) => (
              <BankCard 
                key={a.id}
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