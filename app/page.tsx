import Navbar from "@/components/Navbar";
import VaultBalance from "@/components/VaultBalance";
import UserBalance from "@/components/UserBalance";
import Deposit from "@/components/Deposit";
import Withdraw from "@/components/Withdraw";
import TransactionHistory from "@/components/TransactionHistory";

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1>Welcome to Mini DeFi Vault</h1>
        <p>Deposit Ethereum securely into our decentralized vault and withdraw it whenever you need it.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <VaultBalance />
          <UserBalance />
        </div>
        <div className="grid md:grid-cols-2 gap-4" id="deposit">
          <Deposit />
          <div id="withdraw">
            <Withdraw />
          </div>
        </div>
        <div id="history">
          <TransactionHistory />
        </div>
      </main>
    </div>
  );
}
