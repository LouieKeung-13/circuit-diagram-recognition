# Circuit Diagram Recognition Skill — 电路图识别技能

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <a href="README.md">
    🇺🇸 English Version
  </a>
</p>

> 一个高精度的 OpenClaw Skill，用于将电路图/原理图图片转换为结构化 JSON 数据。

---

## 项目概述

本 Skill 利用视觉语言模型（VLM）分析电路原理图图片，提取结构化的元器件清单、引脚定义、连接拓扑和功能模块。专为与 AI agent 工作流无缝集成而设计。

**目标用户：** 电子工程师、硬件开发者、或任何需要自动化电路分析的用户。

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| **高精度识别** | 准确提取元器件编号（R1、C2）、型号（STM32、LM358）和参数值 |
| **结构化输出** | 生成标准 JSON，兼容 EDA 工具或下游分析 |
| **零部署** | 完全通过 API 运行，无需本地 GPU |
| **低成本** | 优化为低开销执行（每张图片约 ¥0.02 - ¥0.20） |
| **多模型支持** | 默认 Qwen3.5-VL-Max（中文识别最优），备选 GPT-4o / Claude Opus / Gemini |

---

## 🛠️ 支持的模型

### 默认推荐

| 模型 | 提供商 | 价格 | 最佳用途 |
|------|--------|------|---------|
| Qwen3.5-VL-Max | DashScope | ¥0.003/K token | 中文原理图、性价比最优 |

### 备选模型

| 模型 | 提供商 | 价格 | 最佳用途 |
|------|--------|------|---------|
| GPT-4o Vision | OpenAI | $0.01/张 | 英文原理图 |
| Claude Opus 4.8 | Anthropic | $15/张 | 复杂原理图 |
| Gemini 2.5 Pro | Google | $1.25/M tokens | 混合多语言输入 |

---

## 📥 安装

1. 克隆或下载此 Skill 到 OpenClaw skills 目录
2. 在 `.env` 文件中配置 API Key：

```bash
cp .env.example .env
# 编辑 .env，添加你的 DASHSCOPE_API_KEY
```

---

## 💡 最佳实践：语言与精度提示

为确保最大准确度，建议使用**标准英文技术术语**进行提示和分析。

> **💡 精度提示（中文对话时自动附加）：** 本文为翻译版本。为获得最佳精度，请使用带标准技术术语的英文提示（例如 `Pull-up Resistor`、`Buck Converter`）。
> 
> 尽管底层 VLM 支持多语言，但电路原理图是国际标准。使用英文术语与模型的训练数据更好地对齐，减少翻译歧义。

---

## 🗂️ 项目结构

```
circuit-diagram-recognition/
├── README.md              # 英文版（默认展示）
├── README_zh-CN.md        # 中文版
├── SKILL.md               # Skill 定义文件
├── .env.example           # API Key 配置模板
├── LICENSE
└── scripts/               # 执行脚本
    └── main.py            # 主处理流程
```

---

## 📄 许可证

MIT License。欢迎使用和贡献！

---

*Compiled by LouieKeung · 2026*

For more detailed information, please send an email to: markdlouis1995@gmail.com
