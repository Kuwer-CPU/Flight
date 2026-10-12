import type { Metadata } from 'next';
import { MilesWallet } from '@/components/miles-wallet';
import { ToolPage } from '@/components/tool-page';
import './wallet.css';

export const metadata: Metadata = {
  title: 'Miles Wallet',
  description: 'Keep a manual record of your airline loyalty balances and estimate the value of a miles redemption. Stored only in your browser.',
  alternates: { canonical: '/miles-wallet' },
};

export default function MilesWalletPage() {
  return <ToolPage eyebrow="MAKE YOUR MILES GO FURTHER" title="Your miles. Your next chapter." description="Keep your loyalty balances in one place and compare cash with miles before you book. You enter the numbers; your airline confirms the details.">
    <MilesWallet />
  </ToolPage>;
}
