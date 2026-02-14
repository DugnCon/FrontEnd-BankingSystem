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

  const accounts = await getAccounts({ 
    userId: loggedIn.userID ?? ''
  });

  if (!accounts) return <div>Không có tài khoản</div>;
  
  const accountsData = accounts?.data;
  
  const accountId = (id as string) || accountsData[0]?.accountId || accountsData[0]?.id;
  const account = await getAccount({ accountId }); // Sửa param

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
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>

        <RecentTransactions 
          accounts={accountsData}
          transactions={account?.transactions || []}
          selectedAccountId={accountId} // Sửa tên prop
          page={currentPage}
        />
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={account?.transactions || []}
        banks={accountsData?.slice(0, 2) || []}
      />
    </section>
  );
};

export default Home;