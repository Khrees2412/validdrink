"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import ABI from "./abi.json";

const CA = "0xc7c553f9031b2cf0fd15603a0e39685c86a1a457";

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [contract, setContract] = useState<any | null>(null);
    const [barcode, setBarcode] = useState<string>("");
    const { toast } = useToast();

    useEffect(() => {
        // Check if Web3 is injected by the browser (Mist/MetaMask)
        if (typeof window.ethereum !== "undefined") {
            // Use the browser's injected provider
            const web3 = new Web3(window.ethereum);

            // Check if already connected
            web3.eth.getAccounts().then((accounts) => {
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
            });
        }
    }, []);

    const arbSepoliaRpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
    const connectWallet = async () => {
        let web3: any;
        if (typeof window.ethereum !== "undefined") {
            try {
                web3 = new Web3(window.ethereum);
                await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x66eee" }], // Arbitrum Sepolia chain ID
                });
            } catch (switchError: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: "0x66eee",
                                    chainName: "Arbitrum Sepolia",
                                    nativeCurrency: {
                                        name: "Ether",
                                        symbol: "ETH",
                                        decimals: 18,
                                    },
                                    rpcUrls: [arbSepoliaRpcUrl],
                                    blockExplorerUrls: [
                                        "https://sepolia.arbiscan.io/",
                                    ],
                                },
                            ],
                        });
                    } catch (addError) {
                        console.error(
                            "Failed to add Arbitrum Sepolia network:",
                            addError
                        );
                        toast({
                            title: "Network Addition Failed",
                            description:
                                "Unable to add Arbitrum Sepolia network. Please add it manually in MetaMask.",
                            variant: "destructive",
                        });
                        return;
                    }
                } else {
                    console.error(
                        "Failed to switch to Arbitrum Sepolia network:",
                        switchError
                    );
                    toast({
                        title: "Network Switch Failed",
                        description:
                            "Unable to switch to Arbitrum Sepolia network. Please switch manually in MetaMask.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            try {
                const accounts = await web3.eth.getAccounts();
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                    toast({
                        title: "Wallet Connected",
                        description: `Connected to account: ${accounts[0].slice(
                            0,
                            6
                        )}...${accounts[0].slice(-4)} on Arbitrum Sepolia`,
                    });
                } else {
                    throw new Error("No accounts found");
                }
            } catch (error) {
                console.error("Failed to get accounts:", error);
                toast({
                    title: "Connection Failed",
                    description:
                        "Unable to access your Ethereum accounts. Please check your wallet and try again.",
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "MetaMask Not Found",
                description: "Please install MetaMask to use this feature.",
                variant: "destructive",
            });
        }
    };

    const products: IProduct[] = [
        {
            productId: 1,
            name: "HENNESSY VSOP COGNAC 1L",
            barcode: "3245990987604",
            isFake: false,
        },
        {
            productId: 2,
            name: "HENNESSY VSOP PRIVILEGE 1L",
            barcode: "3245990987604",
            isFake: false,
        },
        {
            productId: 3,
            name: "HENNESSY V.S.O.P",
            barcode: "3245990987604",
            isFake: false,
        },
    ];
    interface IProduct {
        productId: number;
        name: string;
        barcode: string;
        isFake: boolean;
    }

    const addProducts = async () => {
        products.forEach(async (product: IProduct) => {
            const { productId, name, barcode, isFake } = product;
            const result = await contract.methods
                .addProduct(productId, name, barcode, isFake)
                .send({ from: walletAddress });
            console.log(result);
        });
        toast({
            title: "Products Added",
            description: "In memory products added successfully",
        });
    };

    const getContract = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(ABI, CA);
        setContract(contract);
        return contract;
    };

    useEffect(() => {
        getContract();
    }, []);

    const verifyBarcode = async () => {
        if (!contract || !walletAddress) {
            toast({
                title: "Error",
                description: "Please connect your wallet first.",
                variant: "destructive",
            });
            return;
        }

        if (!barcode) {
            toast({
                title: "Error",
                description: "Please enter a barcode.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Verification Initiated",
            description: `Verifying barcode: ${barcode}`,
        });

        const result = await contract.methods.isValidProduct(barcode).call();
        console.log(result);
        toast({
            title: "Verification Result",
            description: `Result: ${result}`,
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="w-full p-4 flex justify-end ">
                <Button
                    onClick={addProducts}
                    disabled={!walletAddress}
                    className="mr-5"
                >
                    Add Products
                </Button>

                <Button onClick={connectWallet} disabled={!!walletAddress}>
                    {walletAddress
                        ? `Connected: ${walletAddress.slice(
                              0,
                              6
                          )}...${walletAddress.slice(-4)}`
                        : "Connect Wallet"}
                </Button>
            </header>
            <main className="flex-grow flex flex-col gap-5 items-center justify-center p-4 space-y-4">
                <div className="text-6xl font-[800] text-center">
                    Say Goodbye to buying fake drinks. <br /> Verify Valid
                    Drinks
                </div>
                <Input
                    type="text"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="max-w-xs"
                />
                <Button onClick={verifyBarcode} disabled={!walletAddress}>
                    Verify Barcode
                </Button>
            </main>
            <Toaster />
        </div>
    );
}
