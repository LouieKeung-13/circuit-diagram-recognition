# Circuit Diagram Recognition Skill

## Overview

This skill enables AI agents to analyze circuit schematic images and extract structured component data, connectivity topologies, and functional modules. It uses Vision-Language Models (VLMs) via DashScope API to convert visual circuit information into machine-readable JSON.

**Target Users:** Electronic engineers, hardware developers, or any users requiring automated circuit analysis.

## When to Use

- User asks to analyze, identify, or extract components from a circuit diagram image
- User needs to understand the function of a specific electronic circuit
- User wants to generate a BOM (Bill of Materials) from a schematic
- User needs to trace signal paths or pin definitions in a circuit

## How to Use

### Basic Analysis

```bash
# Analyze a single image
bun scripts/main.ts analyze --image <path_to_image> [--model qwen3.5-vl-max]
```

### Batch Processing

```bash
# Process multiple images in a directory
bun scripts/main.ts batch --input-dir <directory_path> --output-dir <output_directory>
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--image <path>` | Path to image file (PNG/JPG/PDF) | Required for single mode |
| `--input-dir <path>` | Directory containing images | Required for batch mode |
| `--output-dir <path>` | Directory for output files | Current directory |
| `--model <name>` | VLM model to use | `qwen3.5-vl-max` |
| `--lang <en\|zh>` | Output language for descriptions | `en` (recommended) |
| `--format <json\|md>` | Output format | `json` |
| `--verbose` | Enable detailed logging | Disabled |

## Output Format

The skill outputs a structured JSON object:

```json
{
  "metadata": {
    "image_source": "photo_or_scan",
    "confidence": "HIGH|MEDIUM|LOW",
    "model_version": "qwen3.5-vl-max"
  },
  "components": [
    {
      "id": "U1",
      "type_en": "Microcontroller",
      "type_cn": "微控制器",
      "model": "STM32F103C8T6",
      "package": "LQFP-48",
      "pins": [
        {"number": 1, "name": "PA0", "function_en": "ADC_IN0"},
        {"number": 2, "name": "PA1", "function_en": "ADC_IN1"}
      ],
      "value": null
    }
  ],
  "connections": [
    {
      "from": {"component": "U1", "pin": 1},
      "to": {"component": "R1", "pin": "A"},
      "net_name": "SENSOR_SIG"
    }
  ],
  "modules": [
    {
      "name_en": "Power Management",
      "name_cn": "电源管理",
      "description_en": "5V to 3.3V LDO regulation circuit",
      "description_cn": "5V 转 3.3V LDO 稳压电路",
      "components": ["U1", "L1", "C1", "C2"],
      "power_domain": "3.3V"
    }
  ],
  "signals": [
    {
      "name": "CLK",
      "direction": "input",
      "level": "3.3V",
      "source": "XTAL1",
      "destination": "U1_PIN_9"
    }
  ]
}
```

## Language Strategy

### Default Behavior
- **All technical terms remain in English** (e.g., `Pull-up Resistor`, `Buck Converter`, `VCC`, `GND`)
- **Component IDs and models are never translated** (e.g., `STM32F103`, `LM358`)
- **Descriptions support bilingual output** (`name_en`/`name_cn` fields)

### Recommended Workflow
1. **Agent receives user input** (Chinese or English)
2. **Agent translates prompt to English** before calling the skill
3. **Skill returns structured English JSON**
4. **Agent translates response** back to user's language

### Precision Tip
When users communicate in Chinese, append this note:
> 💡 *Precision Tip: Translated from Chinese. For optimal accuracy, use English prompts with standard technical terms.*

## Error Handling

| Error Type | Action |
|-----------|--------|
| Invalid image format | Request PNG/JPG/PDF format |
| Low resolution (<500px) | Warn user about potential accuracy loss |
| API timeout | Retry up to 3 times with exponential backoff |
| Model not found | Fall back to default `qwen3.5-vl-max` |
| Missing API key | Display setup instructions |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DASHSCOPE_API_KEY` | Alibaba Cloud DashScope API Key | Yes |
| `MODEL` | VLM model name | No (default: `qwen3.5-vl-max`) |
| `OUTPUT_DIR` | Default output directory | No |
| `VERBOSE` | Enable debug logging | No |

## References

- [DashScope API Documentation](https://help.aliyun.com/zh/dashscope/)
- [Qwen-VL Model Cards](https://qwenlm.github.io/blog/qwen-vl-series/)
- [JSON Schema Definition](./references/json-schema.json)