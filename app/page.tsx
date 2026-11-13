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
    } catch (e: any) {
      setStatus("Failed to connect wallet");
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
      const contract = await getWriteContract();
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      setStatus("✓ Deposit Successful");
      setAmount("");
      loadBalances();
    } catch (e: any) {
      setStatus("Transaction failed: " + (e.shortMessage || e.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    try {
      setLoading(true);
      setStatus("Waiting for wallet confirmation...");
      const contract = await getWriteContract();
      const tx = await contract.withdraw();
      await tx.wait();
      setStatus("✓ Withdraw Successful");
      loadBalances();
    } catch (e: any) {
      setStatus("Transaction failed: " + (e.shortMessage || e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <nav className="sticky top-0 bg-white shadow px-4 py-3 flex justify-between items-center">
        <a href="/" className="font-bold text-lg">Mini DeFi Vault</a>
        {address ? (
          <div className="flex items-center gap-2">
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
            <button onClick={() => setAddress("")} className="bg-red-500 text-white px-3 py-1 rounded">Disconnect</button>
          </div>
        ) : (
          <button onClick={connectWallet} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Welcome to Mini DeFi Vault</h1>
        <p className="text-gray-600">Deposit Ethereum securely into our decentralized vault and withdraw it whenever you need it.</p>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="font-semibold text-blue-600">Vault Balance</h2>
            <p>Total Ethereum locked in the vault</p>
            <p className="text-2xl">{Number(vaultBalance).toFixed(4)} ETH</p>
            <button onClick={loadBalances} className="bg-blue-600 text-white px-3 py-1 rounded mt-2">Refresh</button>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="font-semibold text-green-600">My Vault Balance</h2>
            <p>{address || "Connect your wallet"}</p>
            <p className="text-2xl">{Number(userBalance).toFixed(4)} ETH</p>
            <button onClick={loadBalances} className="bg-green-600 text-white px-3 py-1 rounded mt-2">Refresh</button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4" id="deposit">
          <div className="bg-white shadow rounded p-4">
            <h2 className="font-semibold">Deposit ETH</h2>
            <input type="number" step="0.001" min="0" placeholder="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="border rounded px-3 py-2 w-full mt-2" />
            <button onClick={handleDeposit} disabled={loading} className="bg-blue-600 text-white w-full py-2 rounded mt-3">Deposit</button>
          </div>
          <div className="bg-white shadow rounded p-4" id="withdraw">
            <h2 className="font-semibold">Withdraw</h2>
            <p>You can withdraw your entire balance.</p>
            <button onClick={handleWithdraw} disabled={loading} className="bg-red-600 text-white w-full py-2 rounded mt-3">Withdraw</button>
          </div>
        </div>
        {status && <p className="text-green-600 mt-4">{status}</p>}
      </main>
    </div>
  );
}
