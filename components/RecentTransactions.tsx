import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTabItem } from './BankTabItem';
import BankInfo from './BankInfo';
import TransactionsTable from './TransactionsTable';
import { Pagination } from './Pagination';

const RecentTransactions = ({
  accounts,
  transactions = [],
  selectedAccountId,
  page = 1,
}: RecentTransactionsProps) => {
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const indexOfLastTransaction = page * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  if (accounts.length === 0) {
    return (
      <section className="recent-transactions">
        <header className="flex items-center justify-between">
          <h2 className="recent-transactions-label">Recent transactions</h2>
        </header>
        <p className="text-muted-foreground">No accounts available.</p>
      </section>
    );
  }

  const selectedAccount =
    accounts.find((acc) => acc.accountID === selectedAccountId) || accounts[0];

  const defaultTabValue = selectedAccount.accountID;

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent transactions</h2>
        <Link
          href={`/transaction-history/?id=${defaultTabValue}`}
          className="view-all-btn"
        >
          View all
        </Link>
      </header>

      <Tabs defaultValue={defaultTabValue} className="w-full">
        <TabsList className="recent-transactions-tablist">
          {accounts.map((account) => (
            <TabsTrigger key={account.accountID} value={account.accountID}>
              <BankTabItem
                account={account}
                selectedAccountId={account.accountID}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account) => (
          <TabsContent
            key={account.accountID}
            value={account.accountID}
            className="space-y-4"
          >
            <BankInfo
              account={account}
              selectedAccountId={account.accountID}
              type="full"
            />

            <TransactionsTable transactions={currentTransactions} />

            {totalPages > 1 && (
              <div className="my-4 w-full">
                <Pagination totalPages={totalPages} page={page} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

export default RecentTransactions;