"use strict";
/**
 * Build Golden Dataset Script
 *
 * Generates and saves the golden dataset to JSON files.
 *
 * Usage:
 *   npx ts-node src/scripts/build-golden-dataset.ts
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGoldenDataset = buildGoldenDataset;
const path = __importStar(require("path"));
const golden_dataset_builder_1 = require("../utils/golden-dataset-builder");
const golden_dataset_generator_1 = require("../utils/golden-dataset-generator");
async function buildGoldenDataset() {
    console.log('Building Golden Dataset...\n');
    // Create builder
    const builder = (0, golden_dataset_builder_1.createGoldenDatasetBuilder)('1.0.0');
    // Set metadata
    builder.setMetadata({
        description: 'Golden dataset for RAG pipeline evaluation',
        author: 'Avon Health Team',
        purpose: 'Testing and validation of query processing, retrieval, and extraction',
    });
    // Generate sample entries
    console.log('Generating sample entries...');
    const entries = (0, golden_dataset_generator_1.generateSampleDataset)();
    console.log(`Generated ${entries.length} entries`);
    // Add entries to builder
    console.log('\nAdding entries to builder...');
    builder.addEntries(entries);
    // Validate dataset
    console.log('\nValidating dataset...');
    const validation = builder.validate();
    if (!validation.valid) {
        console.error('❌ Validation failed:');
        validation.errors.forEach((error) => {
            console.error(`  - ${error}`);
        });
        process.exit(1);
    }
    if (validation.warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        validation.warnings.forEach((warning) => {
            console.warn(`  - ${warning}`);
        });
    }
    console.log('✅ Validation passed');
    // Display statistics
    console.log('\nDataset Statistics:');
    const stats = builder.getStatistics();
    console.log(`  Total Entries: ${stats.total_entries}`);
    console.log(`  Category Distribution:`);
    Object.entries(stats.category_distribution).forEach(([category, count]) => {
        console.log(`    - ${category}: ${count}`);
    });
    console.log(`  Avg Relevant Artifacts: ${stats.avg_relevant_artifacts}`);
    console.log(`  Avg Expected Extractions: ${stats.avg_expected_extractions}`);
    console.log(`  Avg Confidence Min: ${stats.avg_confidence_min}`);
    console.log(`  Verified Entries: ${stats.verified_entries}`);
    // Save to file
    const outputPath = path.join(__dirname, '../../data/golden_dataset.json');
    console.log(`\nSaving to ${outputPath}...`);
    await builder.save(outputPath);
    console.log('✅ Dataset saved successfully');
    // Also save a compact version
    const dataset = builder.build();
    const compactPath = path.join(__dirname, '../../data/golden_dataset_compact.json');
    const fs = require('fs/promises');
    await fs.mkdir(path.dirname(compactPath), { recursive: true });
    await fs.writeFile(compactPath, JSON.stringify(dataset), 'utf-8');
    console.log(`✅ Compact version saved to ${compactPath}`);
    console.log('\n✨ Golden dataset build complete!');
}
// Run the script
if (require.main === module) {
    buildGoldenDataset().catch((error) => {
        console.error('Error building golden dataset:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=build-golden-dataset.js.map