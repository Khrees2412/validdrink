// interface Window {
//     ethereum?: {
//         isMetaMask?: boolean;
//         request?: (...args: any[]) => Promise<void>;
//     };
// }

export {};

declare global {
    interface Window {
        ethereum: any;
    }
}
