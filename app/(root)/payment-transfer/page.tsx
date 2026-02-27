import HeaderBox from '@/components/HeaderBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import QRScannerButton from '@/components/QRScannerButton'
import MyQRButton from '@/components/MyQRButton'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts()

  if(!accounts) return;
  
  const accountsData = accounts?.data;

  return (
    <section className="payment-transfer">
      <div className="flex items-center justify-between w-full">
        <HeaderBox 
          title="Payment Transfer"
          subtext="Please provide any specific details or notes related to the payment transfer"
        />
        <div className="flex gap-2">
          <MyQRButton />
          <QRScannerButton />
        </div>
      </div>

      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  )
}

export default Transfer