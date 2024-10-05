"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

// This ABI is a simplified example and should be replaced with your actual smart contract ABI
const ABI = [
    {
        inputs: [
            {
                internalType: "string",
                name: "imageHash",
                type: "string",
            },
            {
                internalType: "bool",
                name: "isFake",
                type: "bool",
            },
        ],
        name: "storeValidationResult",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

export default function Component() {
    const [file, setFile] = useState<File | null>(null);
    const [validationResult, setValidationResult] = useState<string | null>(
        null
    );
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

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

    const connectWallet = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                // Request account access
                await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                const web3 = new Web3(window.ethereum);
                const accounts = await web3.eth.getAccounts();
                setWalletAddress(accounts[0]);
                toast({
                    title: "Wallet Connected",
                    description: "Your wallet has been successfully connected.",
                });
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                toast({
                    title: "Connection Failed",
                    description: "Failed to connect wallet. Please try again.",
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "Web3 Not Found",
                description:
                    "Please install MetaMask or another Web3 provider.",
                variant: "destructive",
            });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const validateImage = async () => {
        if (!file || !walletAddress) return;

        setIsLoading(true);
        try {
            // Simulate API call for image validation
            const formData = new FormData();
            formData.append("image", file);

            // Replace with your actual API endpoint
            const response = await fetch(
                "https://api.example.com/validate-image",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Image validation failed");
            }

            const data = await response.json();
            const isFake = data.isFake;

            setValidationResult(
                isFake
                    ? "The image appears to be fake."
                    : "The image appears to be genuine."
            );

            // Connect to Arbitrum network
            const web3 = new Web3("https://arb1.arbitrum.io/rpc");

            // Replace with your actual contract address
            const contractAddress =
                "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
            const contract = new web3.eth.Contract(ABI, contractAddress);

            // Generate a simple hash of the file (in a real app, use a more robust method)
            const imageHash = web3.utils.sha3(file.name + file.size);

            // Store the result on the blockchain
            const transaction = await contract.methods
                .storeValidationResult(imageHash, isFake)
                .send({ from: walletAddress });

            setTransactionHash(transaction.transactionHash);

            toast({
                title: "Validation Complete",
                description: "Result stored on the blockchain successfully.",
            });
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description:
                    "Failed to validate image or store result on the blockchain.",
                variant: "destructive",
            });
            setTransactionHash(
                "Error: Unable to store result on the blockchain"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="w-full p-4 flex justify-end">
                <Button onClick={connectWallet} disabled={!!walletAddress}>
                    {walletAddress
                        ? `Connected: ${walletAddress.slice(
                              0,
                              6
                          )}...${walletAddress.slice(-4)}`
                        : "Connect Wallet"}
                </Button>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Fake Image Validator</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="image">Upload Image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start space-y-2">
                        <Button
                            onClick={validateImage}
                            disabled={!file || isLoading || !walletAddress}
                        >
                            {isLoading ? "Validating..." : "Validate Image"}
                        </Button>
                        {validationResult && (
                            <div className="text-sm">
                                <p>Result: {validationResult}</p>
                                <p>Transaction Hash: {transactionHash}</p>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </main>
            <Toaster />
        </div>
    );
}
