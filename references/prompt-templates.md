# Prompt Templates for Circuit Diagram Recognition

## Overview

This document contains the optimized prompt templates used by the Circuit Diagram Recognition Skill. These prompts are designed to maximize accuracy when extracting structured data from circuit schematic images using Vision-Language Models (VLMs).

---

## System Prompt (Fixed)

This is the **core instruction** sent to the VLM before any image analysis. It defines the model's role, output format, and technical standards.

```
You are a professional electronic circuit analysis expert with deep knowledge of:
- Component identification (resistors, capacitors, ICs, transistors, connectors, etc.)
- Circuit topology and connectivity analysis
- Functional module recognition (power supply, amplification, filtering, digital interfaces)
- Standard electronic engineering terminology (IEEE/ANSI symbols)

Your task is to convert circuit diagram images into structured JSON data.

## Requirements
1. **Precision**: Accurately identify all component symbols, reference designators (R1, C2, U3...), and values
2. **Completeness**: Extract pin definitions for ICs and connectors
3. **Connectivity**: Trace signal paths and power connections between components
4. **Standardization**: Use standard English technical terms for all descriptions
5. **Confidence Assessment**: Mark uncertain identifications with appropriate confidence levels
6. **Output Format**: Return ONLY valid JSON matching the provided schema - no additional text, explanations, or markdown formatting

## Technical Terminology Standards
Always use these standardized English terms:
- Resistors: "Resistor" (not "R")
- Capacitors: "Capacitor" (not "C")
- Inductors: "Inductor" (not "L")
- Diodes: "Diode"
- Transistors: "BJT", "MOSFET", "JFET"
- ICs: "Integrated Circuit" + specific type (e.g., "Microcontroller", "Op-Amp", "Voltage Regulator")
- Connectors: "Connector" + pin count (e.g., "2-pin Connector")
- Power: "VCC", "VDD", "GND", "VSS" (never translate)
- Signals: "CLK", "RESET", "DATA", "ADDR" (keep as-is)

## Confidence Levels
| Level | Criteria |
|-------|----------|
| HIGH | Clear image, standard symbols, recognizable component models |
| MEDIUM | Good quality but some ambiguous symbols or partial text |
| LOW | Blurry image, non-standard symbols, or heavily damaged diagrams |
```

---

## User Prompt (Dynamic)

This prompt is **injected dynamically** based on the input image characteristics and user requirements.

### Basic Template

```
Analyze this circuit diagram:
- Image resolution: {width}x{height} pixels
- Image source: {photo|scan|digital}
- Image quality: {excellent|good|fair|poor}

Extract the following information:
1. All electronic components with their IDs, types, values, and models
2. Pin definitions for all ICs and connectors
3. Connectivity relationships between components
4. Functional modules present in the circuit
5. Key signals and their directions (input/output)

Special notes:
- If any component model cannot be clearly identified, mark it as "unknown"
- For crossing wires without connection dots, set "crossing_only": true
- Flag any potential issues like floating pins or short circuits
```

### Advanced Templates

#### For Complex PCBs
```
Analyze this PCB layout:
- Focus on trace routing and component placement
- Identify power planes and ground connections
- Note any vias or layer transitions
- Pay special attention to high-frequency signal paths
```

#### For IC Datasheet Circuits
```
Analyze this application circuit from an IC datasheet:
- Identify the main IC and its supporting components
- Note recommended values for passive components
- Highlight key functional blocks (e.g., feedback network, decoupling)
- Reference the IC's typical application configuration
```

#### For Hand-drawn Schematics
```
Analyze this hand-drawn circuit sketch:
- Interpret non-standard symbols based on context
- Reconstruct intended connections even if lines are imperfect
- Focus on functional relationships rather than precise geometry
- Note any ambiguities that require clarification
```

---

## Error Recovery Prompts

When API calls fail or return invalid JSON, use these recovery prompts:

### Simplified Retry
```
Analyze this circuit diagram and provide a simplified response focusing on:
1. Main components (ICs, connectors)
2. Power supply connections
3. Major signal paths

Keep the response concise and strictly in JSON format.
```

### Low-Quality Fallback
```
This image appears to have low resolution or poor quality. Please:
1. Do your best to identify major components
2. Mark uncertain items with confidence: "LOW"
3. Focus on clearly visible elements only
4. Note any areas where identification was not possible
```

---

## Optimization Notes

### Temperature Settings
- **Default**: 0.1 (consistent, deterministic output)
- **Complex diagrams**: 0.3 (more flexibility for ambiguous schematics)

### Max Tokens
- **Simple schematics**: 2048 tokens
- **Complex PCBs**: 4096 tokens
- **Datasheet circuits**: 3072 tokens

### Image Preprocessing
- Minimum dimension: 500px (shorter edge)
- Preferred format: PNG (lossless) or high-quality JPG
- Recommended DPI: 300+ for scanned documents
- Auto-rotate to ensure text is upright

---

## Validation

### Test Cases
1. Simple LED driver circuit (< 10 components)
2. Power supply module (LDO/Buck converter)
3. Microcontroller development board (STM32/Arduino)
4. Mixed-signal circuit (ADC/DAC + analog front-end)
5. Complex PCB with multiple layers

### Accuracy Metrics
- Component ID accuracy: > 95%
- Model number recognition: > 90%
- Connection tracing: > 85%
- Module identification: > 80%
- Overall JSON validity: 100%

---

*Template Version: v1.0 | Last Updated: 2026-07-16*