import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccounts } from '@/lib/actions/bank.actions';
import { redirect } from 'next/navigation';
import BankCard from '@/components/BankCard';
import BankAccountForm from '@/components/BankAccountForm';

const BankAccountsPage = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accountsData = await getAccounts();

  // Xử lý trường hợp data là object đơn hoặc mảng
  let accounts = [];
  if (Array.isArray(accountsData?.data)) {
    accounts = accountsData.data;
  } else if (accountsData?.data && typeof accountsData.data === 'object') {
    accounts = [accountsData.data]; // bọc thành mảng nếu là 1 object
  }
  
  const totalBanks = accountsData?.totalBanks ?? accounts.length;
  const totalBalance = accountsData?.totalCurrentBalance ?? 
    accounts.reduce((sum: number, acc: any) => sum + (Number(acc?.currentBalance) || 0), 0);

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        <p className="text-gray-500">Manage your connected bank accounts</p>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'VND' 
                }).format(totalBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Banks</p>
              <p className="text-3xl font-bold text-gray-900">{totalBanks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Accounts</h2>
            
            {accounts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-4">🏦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
                <p className="text-sm text-gray-500">Add your first bank account to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account: Account) => (
                  <BankCard
                    key={account.accountID}
                    account={account}
                    userName={loggedIn.firstName}
                    showBalance={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <BankAccountForm />
        </div>
      </div>
    </section>
  );
};

export default BankAccountsPage;