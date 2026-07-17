# Circuit Diagram Recognition Skill

> A high-precision OpenClaw Skill for converting circuit diagrams into structured JSON data.

## 📖 Overview

This skill leverages Vision-Language Models (VLMs) to analyze circuit schematic images and extract structured component lists, pin definitions, connectivity topologies, and functional modules. Designed for seamless integration into AI agent workflows.

**Target Users:** Electronic engineers, hardware developers, or any users requiring automated circuit analysis.

## ✨ Key Features

- **High Precision:** Extracts component IDs (R1, C2), models (STM32, LM358), and values with high accuracy.
- **Structured Output:** Generates standard JSON compatible with EDA tools or downstream analysis.
- **Zero Deployment:** Runs entirely via API; no local GPU required.
- **Cost Effective:** Optimized for low-cost execution (approx. ¥0.02 - ¥0.20 per image).

## 🛠️ Supported Models

### Default (Recommended)
| Model | Provider | Price | Best For |
|-------|----------|-------|----------|
| Qwen3.5-VL-Max | DashScope | ¥0.003/K token | Chinese schematics, cost-effective |

### Alternatives
| Model | Provider | Price | Best For |
|-------|----------|-------|----------|
| GPT-4o Vision | OpenAI | $0.01/image | English schematics |
| Claude Opus 4.8 | Anthropic | $15/image | Complex schematics |
| Gemini 2.5 Pro | Google | $1.25/M tokens | Mixed multilingual inputs |

## 📥 Installation

1. Clone or download this skill into your OpenClaw skills directory.
2. Set up your API key in the `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env and add your DASHSCOPE_API_KEY
   ```

## 💡 Best Practices: Language & Precision

To ensure maximum accuracy, we recommend using **standard English technical terms** for prompts and analysis.

> **💡 Precision Tip:** Translated from Chinese. For optimal accuracy, use English prompts with standard technical terms (e.g., `Pull-up Resistor`, `Buck Converter`).

While the underlying VLMs are multilingual, circuit diagrams are an international standard. Using English terminology aligns better with the models' training data, reducing translation ambiguity.

## 📄 License

MIT License. Feel free to use and contribute!

---


*Compiled by LouieKeung · 2026 · Dynamic Token Compression Project*

For more detailed information, please send an email to: markdlouis1995@gmail.com
