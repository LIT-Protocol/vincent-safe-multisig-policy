/**
 * ABI to Signatures Generator
 *
 * This script reads ABI files from the Vincent contracts and generates a TypeScript file
 * containing method signatures and event definitions.
 */

import fs from 'fs';
import path from 'path';

// Default configuration constants
const DEFAULT_ABIS_DIR = './abis';

export function abiToTypeAssertions(deploymentFile: string, outputDir: string): string {
    const abisDir = DEFAULT_ABIS_DIR;

    // Check if deployment file exists
    if (!fs.existsSync(deploymentFile)) {
        console.log(`⚠️ Deployment file not found: ${deploymentFile}`);
        console.log('Skipping type assertions generation for this deployment file.');
        return '';
    }

    // Read the deployment file
    const DeployedJson = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    // Handle different deployment file structures
    let contractAddress = '';
    if (DeployedJson.returns && DeployedJson.returns.length > 0) {
        // Diamond pattern deployment
        contractAddress = DeployedJson.returns[0].value;
        console.log(`✅ Diamond deployed at: ${contractAddress}`);
    } else if (DeployedJson.transactions && DeployedJson.transactions.length > 0) {
        // Standard contract deployment
        const mainContract = DeployedJson.transactions.find(tx => tx.transactionType === 'CREATE');
        if (mainContract) {
            contractAddress = mainContract.contractAddress;
            console.log(`✅ Contract deployed at: ${contractAddress}`);
        }
    }

    if (!contractAddress) {
        console.log('⚠️ No contract address found in deployment file. Skipping type assertions generation.');
        return '';
    }

    // Get all the ABI files
    const jsonFileNames = fs.readdirSync(abisDir).filter((file) => file.endsWith('.json'));

    const contractData: any = [];
    for (const file of jsonFileNames) {
        const contractName = file.replace('.abi.json', '');
        const abi = JSON.parse(fs.readFileSync(path.join(abisDir, file), 'utf8'));
        contractData.push({
            [contractName]: abi,
        });
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, 'vincent-contract-data.ts');

    fs.writeFileSync(
        outputFile,
        `/**
 * Generated Contract Data for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentContractAddress = '${contractAddress}';

export const vincentContractData = ${JSON.stringify(contractData, null, 2)} as const;`,
    );

    console.log(`✅ Vincent Contract Data generated at: ${outputFile}`);
    return outputFile;
}