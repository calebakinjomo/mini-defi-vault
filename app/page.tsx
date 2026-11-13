"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS!;
const SEPOLIA_CHAIN_ID = 11155111;

const VAULT_ABI = [
  "function deposit() payable",
  "function withdraw()",
  "function getBalance(address user) view returns (uint256)",
  "function contractBalance() view returns (uint256)",
];

export default function Home() {
  const [address, setAddress] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"ok" | "err" | "">("");
  const [userBalance, setUserBalance] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  async function getProvider() {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("MetaMask not found");
      throw new Error("No MetaMask");
    }
    return new ethers.BrowserProvider(eth);
  }

  async function getWriteContract() {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID)
      throw new Error("Please switch MetaMask to Sepolia");
    return new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
  }

  async function getReadContract() {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!
    );
    return new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
  }

  async function loadBalances() {
    try {
      const contract = await getReadContract();
      const vb = await contract.contractBalance();
      setVaultBalance(ethers.formatEther(vb));
      if (address) {
        const ub = await contract.getBalance(address);
        setUserBalance(ethers.formatEther(ub));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadBalances();
  }, [address]);

  async function connectWallet() {
    try {
      setLoading(true);
      const provider = await getProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      setStatus("Wallet connected");
      setStatusKind("ok");
    } catch (e: any) {
      setStatus("Failed to connect wallet");
      setStatusKind("err");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    try {
      setLoading(true);
      setStatus("Waiting for wallet confirmation...");
      setStatusKind("");
      const contract = await getWriteContract();
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      setStatus("✓ Deposit Successful");
      setStatusKind("ok");
      setAmount("");
      loadBalances();
    } catch (e: any) {
      setStatus("Transaction failed: " + (e.shortMessage || e.message));
      setStatusKind("err");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    try {
      setLoading(true);
      setStatus("Waiting for wallet confirmation...");
      setStatusKind("");
      const contract = await getWriteContract();
      const tx = await contract.withdraw();
      await tx.wait();
      setStatus("✓ Withdraw Successful");
      setStatusKind("ok");
      loadBalances();
    } catch (e: any) {
      setStatus("Transaction failed: " + (e.shortMessage || e.message));
      setStatusKind("err");
    } finally {
      setLoading(false);
    }
  }

  const shortVault = VAULT_ADDRESS
    ? `${VAULT_ADDRESS.slice(0, 6)}...${VAULT_ADDRESS.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070b14] via-[#0b1120] to-[#131a2e] text-slate-100">
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-[#070b14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-base">🔐</span>
            Mini DeFi Vault
          </a>
          {address ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-300">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button onClick={() => setAddress("")} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20">Disconnect</button>
            </div>
          ) : (
            <button onClick={connectWallet} disabled={loading} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 transition hover:opacity-90 disabled:opacity-50">
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <span className="inline-block rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">Sepolia Testnet</span>
          <h1 className="mt-4 bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Welcome to Mini DeFi Vault
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Deposit Ethereum securely into our decentralized vault and withdraw it whenever you need it.
          </p>
          {shortVault && (
            <p className="mt-3 font-mono text-xs text-slate-500">
              Vault contract: {shortVault}
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-indigo-300">Vault Balance</h2>
              <span className="text-xl">🏦</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Total Ethereum locked in the vault</p>
            <p className="mt-3 font-mono text-3xl font-bold">{Number(vaultBalance).toFixed(4)} <span className="text-lg text-slate-400">ETH</span></p>
            <button onClick={loadBalances} className="mt-4 rounded-full bg-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/30">Refresh</button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-emerald-300">My Vault Balance</h2>
              <span className="text-xl">👛</span>
            </div>
            <p className="mt-1 truncate font-mono text-sm text-slate-400">{address || "Connect your wallet"}</p>
            <p className="mt-3 font-mono text-3xl font-bold">{Number(userBalance).toFixed(4)} <span className="text-lg text-slate-400">ETH</span></p>
            <button onClick={loadBalances} className="mt-4 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30">Refresh</button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2" id="deposit">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">Deposit ETH</h2>
            <p className="mt-1 text-sm text-slate-400">Enter the amount you want to lock in the vault.</p>
            <input type="number" step="0.001" min="0" placeholder="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono outline-none placeholder:text-slate-500 focus:border-indigo-400" />
            <button onClick={handleDeposit} disabled={loading} className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 font-semibold shadow-lg shadow-indigo-500/30 transition hover:opacity-90 disabled:opacity-50">
              {loading ? "Processing..." : "Deposit"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur" id="withdraw">
            <h2 className="text-lg font-semibold">Withdraw</h2>
            <p className="mt-1 text-sm text-slate-400">Withdraw your entire vault balance back to your wallet.</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-mono text-slate-300">
              {Number(userBalance).toFixed(4)} ETH available
            </div>
            <button onClick={handleWithdraw} disabled={loading} className="mt-4 w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 font-semibold shadow-lg shadow-rose-500/30 transition hover:opacity-90 disabled:opacity-50">
              {loading ? "Processing..." : "Withdraw All"}
            </button>
          </div>
        </div>

        {status && (
          <p className={`mt-6 rounded-xl border px-4 py-3 text-center text-sm font-medium ${statusKind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : statusKind === "err" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"}`}>
            {status}
          </p>
        )}

        <p className="mt-10 text-center text-xs text-slate-500">
          Mini DeFi Vault — built on Sepolia • Contract: {shortVault}
        </p>
      </main>
    </div>
  );
}
