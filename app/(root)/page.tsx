import HeaderBox from '@/components/HeaderBox';
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accounts = await getAccounts();
  if (!accounts) return <div>Không có tài khoản</div>;

  const accountsData = accounts?.data;

  // Vì data chỉ là 1 object duy nhất, không phải mảng
  const accountId = (id as string) || accountsData?.accountID || accountsData?.id;
  const account = await getAccount({ accountId });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Welcome"
            user={loggedIn.firstName || loggedIn.name || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox 
            accounts={accountsData ? [accountsData] : []}
            totalBanks={accounts?.totalBanks ?? (accountsData ? 1 : 0)}
            totalCurrentBalance={accounts?.totalCurrentBalance ?? (accountsData?.currentBalance || 0)}
          />
        </header>

        <RecentTransactions 
          accounts={accountsData ? [accountsData] : []}
          transactions={account?.transactions || []}
          selectedAccountId={accountId} 
          page={currentPage}
        />
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={account?.transactions || []}
        banks={accountsData ? [accountsData] : []}
      />
    </section>
  );
};

export default Home;