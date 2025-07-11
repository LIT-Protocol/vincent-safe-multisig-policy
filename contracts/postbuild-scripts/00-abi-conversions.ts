import { abiToSignatures } from './utils/abiToSignatures.ts';
import { abiToTypeAssertions } from './utils/abiToTypeAssertions.ts';

const targetAndOutputDir = [
    {
        target: './broadcast/SafeMessageTracker.s.sol/175188/run-latest.json',
        outputDir: './src/networks/vDatil/datil-mainnet',
    },
];

targetAndOutputDir.forEach(({ target, outputDir }) => {
    console.log(`Generating signatures for ${target} to ${outputDir}`);
    abiToSignatures(target, outputDir);
    abiToTypeAssertions(target, outputDir);
});