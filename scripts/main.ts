#!/usr/bin/env bun
/**
 * Circuit Diagram Recognition Script
 * 
 * Analyzes circuit schematic images using Vision-Language Models (VLMs)
 * and outputs structured JSON data.
 * 
 * Default Model: Qwen3.5-VL-Max via DashScope API
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

// ==================== Configuration ====================

const DEFAULT_MODEL = 'qwen3.5-vl-max';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000;
const MIN_IMAGE_DIMENSION = 500;

// ==================== Types ====================

interface Component {
  id: string;
  type_en: string;
  type_cn?: string;
  model?: string;
  package?: string;
  value?: string;
  pins?: Array<{
    number: number | string;
    name: string;
    function_en?: string;
    function_cn?: string;
  }>;
}

interface Connection {
  from: { component: string; pin: number | string };
  to: { component: string; pin: number | string };
  net_name?: string;
  crossing_only?: boolean;
}

interface Module {
  name_en: string;
  name_cn?: string;
  description_en?: string;
  description_cn?: string;
  components: string[];
  power_domain?: string;
}

interface Signal {
  name: string;
  direction?: 'input' | 'output' | 'bidirectional';
  level?: string;
  source?: string;
  destination?: string;
}

interface Metadata {
  image_source?: 'photo' | 'scan' | 'digital';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  model_version: string;
  processing_time_ms?: number;
}

interface AnalysisResult {
  metadata: Metadata;
  components: Component[];
  connections: Connection[];
  modules: Module[];
  signals: Signal[];
  warnings?: string[];
}

// ==================== CLI Argument Parser ====================

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  const rawArgs = process.argv.slice(2);

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = rawArgs[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

// ==================== Image Preprocessing ====================

function preprocessImage(imagePath: string): { width: number; height: number } {
  console.log(`🔍 Preprocessing image: ${imagePath}`);

  try {
    let width = 0, height = 0;

    try {
      const output = execSync(`magick identify -format "%w %h" "${imagePath}"`, { encoding: 'utf-8' });
      [width, height] = output.trim().split(' ').map(Number);
    } catch {
      // Fallback: try with ffprobe
      try {
        const output = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${imagePath}"`, { encoding: 'utf-8' });
        [width, height] = output.trim().split(',').map(Number);
      } catch {
        console.warn('⚠️ Could not determine image dimensions. Proceeding without resize.');
      }
    }

    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      console.warn(`⚠️ Image is small (${width}x${height}). Accuracy may be reduced.`);
      return { width, height };
    }

    return { width, height };
  } catch (error) {
    console.error('❌ Error preprocessing image:', error);
    return { width: 0, height: 0 };
  }
}

// ==================== DashScope API Client ====================

async function callDashScopeAPI(
  imagePath: string,
  model: string,
  prompt: string
): Promise<AnalysisResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY environment variable is not set.\nPlease create a .env file with your API key.');
  }

  const imageUrl = `file://${imagePath}`;

  const payload = {
    model,
    input: {
      messages: [
        {
          role: 'system',
          content: [
            { type: 'text', text: `You are a professional electronic circuit analysis expert with deep knowledge of component identification, circuit topology, and connectivity analysis.

Your task is to convert circuit diagram images into structured JSON data.

## Requirements
1. Accurately identify all component symbols, reference designators (R1, C2, U3...), and values
2. Extract pin definitions for ICs and connectors
3. Trace signal paths and power connections between components
4. Identify functional modules (power supply, amplification, filtering, digital interfaces)
5. Use standard English technical terminology
6. Mark uncertain identifications with appropriate confidence levels
7. Output ONLY valid JSON, no additional text or explanations

## Technical Terminology Standards
- Resistor types: "Resistor" (not "R" as a type)
- Capacitor types: "Capacitor" (not "C" as a type)
- Inductor types: "Inductor" (not "L" as a type)
- Diodes: "Diode"
- Transistors: "BJT", "MOSFET", "JFET"
- ICs: "Integrated Circuit" + specific type (e.g., "Microcontroller", "Op-Amp", "Voltage Regulator")
- Connectors: "Connector" + pin count (e.g., "2-pin Connector")
- Power: "VCC", "VDD", "GND", "VSS" (keep as-is)
- Signals: "CLK", "RESET", "DATA", "ADDR" (keep as-is)

## Confidence Levels
- HIGH: Clear image, standard symbols, recognizable component models
- MEDIUM: Fair quality, some ambiguous symbols or partial text
- LOW: Blurry image, non-standard symbols, or heavily damaged diagrams

Output must match this structure:
{
  "metadata": { "confidence": "HIGH|MEDIUM|LOW", "model_version": "${model}" },
  "components": [{ "id": "R1", "type_en": "Resistor", "value": "10kΩ" }],
  "connections": [{ "from": { "component": "R1", "pin": "A" }, "to": { "component": "C1", "pin": "A" } }],
  "modules": [{ "name_en": "Power Management", "components": ["U1", "C1"] }],
  "signals": [{ "name": "CLK", "direction": "input" }]
}` },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    },
    parameters: {
      max_tokens: 4096,
      temperature: 0.1,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📡 Calling DashScope API (Attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from API');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result: AnalysisResult = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed JSON output');

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// ==================== Main Execution ====================

async function main() {
  const args = parseArgs();
  const mode = args.image ? 'single' : (args['input-dir'] ? 'batch' : 'help');

  if (mode === 'help') {
    console.log(`
Circuit Diagram Recognition Tool

Usage:
  analyze --image <path> [--model <model>]
  batch --input-dir <dir> --output-dir <dir>

Options:
  --image <path>       Path to circuit diagram image (PNG/JPG/PDF)
  --input-dir <path>   Directory containing images for batch processing
  --output-dir <path>  Directory for output files (default: current directory)
  --model <name>       VLM model to use (default: qwen3.5-vl-max)
  --verbose            Enable detailed logging
`);
    process.exit(0);
  }

  const model = (args.model as string) || process.env.MODEL || DEFAULT_MODEL;
  console.log(`🔧 Using model: ${model}`);

  if (mode === 'single') {
    const imagePath = args.image as string;

    if (!existsSync(imagePath)) {
      console.error(`❌ Image file not found: ${imagePath}`);
      process.exit(1);
    }

    preprocessImage(imagePath);

    const userPrompt = `Analyze this circuit diagram:
- Extract all components with their IDs, types, values, and models
- Identify pin definitions for ICs and connectors
- Trace connectivity between components
- Identify functional modules
- Note any potential issues (floating pins, short circuits, etc.)`;

    const startTime = Date.now();
    const result = await callDashScopeAPI(imagePath, model, userPrompt);
    result.metadata.processing_time_ms = Date.now() - startTime;

    console.log('\n📊 Analysis Result:');
    console.log(JSON.stringify(result, null, 2));

    const outputDir = args['output-dir'] as string || process.env.OUTPUT_DIR;
    if (outputDir) {
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      const fileName = `schematic_${Date.now()}.json`;
      const outputPath = join(outputDir, fileName);
      writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`💾 Saved to: ${outputPath}`);
    }
  } else if (mode === 'batch') {
    const inputDir = args['input-dir'] as string;
    const outputDir = args['output-dir'] as string || '.';

    if (!existsSync(inputDir)) {
      console.error(`❌ Input directory not found: ${inputDir}`);
      process.exit(1);
    }

    console.log(`📁 Processing directory: ${inputDir}`);

    let imageFiles: string[];
    try {
      const output = execSync(`dir /b "${inputDir}\\*.png" "${inputDir}\\*.jpg" "${inputDir}\\*.jpeg" "${inputDir}\\*.pdf" 2>nul`, { encoding: 'utf-8' });
      imageFiles = output.trim().split('\n').filter(f => f.trim());
    } catch {
      console.log('No image files found in directory.');
      process.exit(0);
    }

    if (imageFiles.length === 0) {
      console.log('No image files found in directory.');
      process.exit(0);
    }

    console.log(`📸 Found ${imageFiles.length} image(s) to process`);

    const results: Array<{ file: string; result?: AnalysisResult; error?: string }> = [];

    for (const file of imageFiles) {
      const filePath = join(inputDir, file.trim());
      try {
        console.log(`\n🔄 Processing: ${file}`);
        preprocessImage(filePath);

        const userPrompt = `Analyze this circuit diagram and extract all components, connections, and modules.`;

        const startTime = Date.now();
        const result = await callDashScopeAPI(filePath, model, userPrompt);
        result.metadata.processing_time_ms = Date.now() - startTime;

        results.push({ file: file.trim(), result });
        console.log(`✅ Completed: ${file}`);
      } catch (error) {
        console.error(`❌ Failed: ${file} - ${(error as Error).message}`);
        results.push({ file: file.trim(), error: (error as Error).message });
      }
    }

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const batchOutputPath = join(outputDir, 'batch_results.json');
    writeFileSync(batchOutputPath, JSON.stringify(results, null, 2));

    const successCount = results.filter(r => r.result).length;
    const failCount = results.filter(r => r.error).length;

    console.log(`\n📊 Batch Results Summary:`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`💾 Saved to: ${batchOutputPath}`);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});