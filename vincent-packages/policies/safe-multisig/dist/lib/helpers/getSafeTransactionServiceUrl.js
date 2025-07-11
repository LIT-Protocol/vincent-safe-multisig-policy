import { LIT_CHAINS } from '@lit-protocol/constants';
/**
 * Get Safe Transaction Service URL from LIT chain identifier
 * @param litChainIdentifier - The LIT chain identifier (must be a valid key from LIT_CHAINS)
 * @returns The Safe Transaction Service URL for the chain
 * @throws Error if chain identifier is not found or Safe doesn't support the chain
 */
export function getSafeTransactionServiceUrl(litChainIdentifier) {
    const chain = LIT_CHAINS[litChainIdentifier];
    if (!chain) {
        throw new Error(`Chain identifier '${litChainIdentifier}' not supported by Lit`);
    }
    // This switch case is handling the cases where the chain identifier used by Safe
    // is different from the chain identifier used by Lit, and unsupported chains by Lit.
    let safeChainIdentifier = litChainIdentifier;
    switch (litChainIdentifier) {
        case "arbitrum":
            break;
        case "aurora":
            break;
        case "avalanche":
            break;
        case "base":
            break;
        case "baseSepolia":
            safeChainIdentifier = "base-sepolia";
            break;
        case "berachain":
            throw new Error("Berachain is not supported by Lit");
        case "bsc":
            break;
        case "celo":
            break;
        case "chiado":
            break;
        case "gnosis-chain":
            throw new Error("Gnosis Chain is not supported by Lit");
        case "hemi":
            throw new Error("Hemi is not supported by Lit");
        case "ink":
            throw new Error("Ink is not supported by Lit");
        case "lens":
            throw new Error("Lens is not supported by Lit");
        case "linea":
            throw new Error("Linea is not supported by Lit");
        case "ethereum":
            safeChainIdentifier = "mainnet";
            break;
        case "mantle":
            break;
        case "optimism":
            break;
        case "polygon":
            break;
        case "scroll":
            break;
        case "sepolia":
            break;
        case "sonicMainnet":
            safeChainIdentifier = "sonic";
            break;
        case "unichain":
            throw new Error("Unichain is not supported by Lit");
        case "worldchain":
            throw new Error("Worldchain is not supported by Lit");
        case "xlayer":
            throw new Error("Xlayer is not supported by Lit");
        case "zkEvm":
            break;
        case "zksync":
            break;
        default:
            throw new Error(`Safe Transaction Service is not supported for chain identifier '${litChainIdentifier}'`);
    }
    return `https://safe-transaction-${safeChainIdentifier}.safe.global`;
}
