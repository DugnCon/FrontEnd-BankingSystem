import { redirect } from 'next/navigation';
import HeaderBox from '@/components/HeaderBox';
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import MyQRButton from '@/components/MyQRButton';
import QRScannerButton from '@/components/QRScannerButton';
import { getAccounts, getTransactionHistory } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page) || 1;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accounts = await getAccounts();
  if (!accounts || !accounts.data) {
    return <div>Không có tài khoản</div>;
  }

  const accountsData = accounts.data;
  const accountId = id || accountsData.accountID || accountsData.id;

  if (!accountId) {
    return <div>Chưa chọn tài khoản để xem lịch sử giao dịch</div>;
  }

  const account = await getTransactionHistory({ accountId });

  const transactions = account?.transactions ?? [];
  const userName = loggedIn.firstName || loggedIn.name || 'Guest';

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex items-center justify-between w-full">
            <HeaderBox 
              type="greeting"
              title="Welcome"
              user={userName}
              subtext="Access and manage your account and transactions efficiently."
            />
            <div className="flex gap-2">
              <MyQRButton />
              <QRScannerButton />
            </div>
          </div>

          <TotalBalanceBox 
            accounts={accountsData ? [accountsData] : []}
            totalBanks={accounts.totalBanks ?? 1}
            totalCurrentBalance={accounts.totalCurrentBalance ?? (accountsData?.currentBalance || 0)}
          />
        </header>

        <RecentTransactions 
          accounts={accountsData ? [accountsData] : []}
          transactions={transactions}
          selectedAccountID={accountId} 
          page={currentPage}
        />
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={transactions}
        banks={accountsData ? [accountsData] : []}
      />
    </section>
  );
};

export default Home;