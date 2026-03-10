export type Tier = "essential" | "rising" | "worth-watching";

export interface EssentialTool {
  name: string;
  description: string;
  tier: Tier;
  url: string;
  repo: string | null;
}

export interface EssentialsCategory {
  id: string;
  label: string;
  tools: EssentialTool[];
}

export const TIER_META: Record<
  Tier,
  { label: string; color: string; bgColor: string }
> = {
  essential: {
    label: "Essential",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
  rising: {
    label: "Rising",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  "worth-watching": {
    label: "Worth Watching",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/15",
  },
};

export const ESSENTIALS_CATEGORIES: EssentialsCategory[] = [
  {
    id: "coding-assistants",
    label: "AI Coding Assistants",
    tools: [
      {
        name: "Claude Code",
        description:
          "Anthropic's agentic coding tool for the terminal with autonomous multi-file editing",
        tier: "essential",
        url: "https://docs.anthropic.com/en/docs/claude-code",
        repo: null,
      },
      {
        name: "GitHub Copilot",
        description:
          "AI pair programmer with inline completions and chat across all major editors",
        tier: "essential",
        url: "https://github.com/features/copilot",
        repo: null,
      },
      {
        name: "Cursor",
        description:
          "AI-native code editor built on VS Code with deep codebase understanding",
        tier: "essential",
        url: "https://cursor.com",
        repo: null,
      },
      {
        name: "Windsurf",
        description:
          "AI-powered IDE with built-in everything — lowest barrier to start coding with AI",
        tier: "essential",
        url: "https://windsurf.com",
        repo: null,
      },
      {
        name: "Codex",
        description:
          "OpenAI's cloud-based coding agent that runs tasks in a sandboxed environment",
        tier: "rising",
        url: "https://openai.com/index/introducing-codex/",
        repo: null,
      },
      {
        name: "Aider",
        description:
          "AI pair programming in your terminal — works with any LLM provider",
        tier: "rising",
        url: "https://aider.chat",
        repo: "paul-gauthier/aider",
      },
      {
        name: "Continue",
        description:
          "Open-source AI code assistant for VS Code and JetBrains",
        tier: "worth-watching",
        url: "https://continue.dev",
        repo: "continuedev/continue",
      },
      {
        name: "Cline",
        description:
          "Autonomous AI coding agent for VS Code with tool use and browser control",
        tier: "rising",
        url: "https://cline.bot",
        repo: "cline/cline",
      },
      {
        name: "Kilo Code",
        description:
          "VS Code AI assistant with structured modes and tight context handling",
        tier: "worth-watching",
        url: "https://kilocode.ai",
        repo: "kilocode/kilo-code",
      },
    ],
  },
  {
    id: "app-builders",
    label: "AI App Builders (Vibe Coding)",
    tools: [
      {
        name: "v0",
        description:
          "Vercel's AI-powered UI generator — text to polished React components",
        tier: "essential",
        url: "https://v0.dev",
        repo: null,
      },
      {
        name: "Bolt.new",
        description:
          "Full-stack AI app builder with in-browser dev environment and instant deploy",
        tier: "essential",
        url: "https://bolt.new",
        repo: "stackblitz/bolt.new",
      },
      {
        name: "Lovable",
        description:
          "AI app builder focused on stunning UI design for MVPs and prototypes",
        tier: "essential",
        url: "https://lovable.dev",
        repo: null,
      },
      {
        name: "Replit Agent",
        description:
          "Browser-based IDE with AI agent — best for beginners who want to learn while building",
        tier: "essential",
        url: "https://replit.com",
        repo: null,
      },
    ],
  },
  {
    id: "autonomous-agents",
    label: "Autonomous AI Agents",
    tools: [
      {
        name: "OpenClaw",
        description:
          "Open-source personal AI assistant with 234K+ GitHub stars — acquired by OpenAI",
        tier: "essential",
        url: "https://openclaw.ai",
        repo: "openclaw/openclaw",
      },
      {
        name: "Devin",
        description:
          "Autonomous AI software engineer by Cognition Labs with full dev environment",
        tier: "essential",
        url: "https://cognition.ai",
        repo: null,
      },
      {
        name: "OpenHands",
        description:
          "Open-source autonomous coding agent (formerly OpenDevin) for software tasks",
        tier: "rising",
        url: "https://www.all-hands.dev",
        repo: "All-Hands-AI/OpenHands",
      },
      {
        name: "Browser Use",
        description:
          "Make AI agents interact with websites using natural language",
        tier: "rising",
        url: "https://browser-use.com",
        repo: "browser-use/browser-use",
      },
      {
        name: "Stagehand",
        description:
          "AI-powered browser automation framework for building web agents",
        tier: "rising",
        url: "https://stagehand.dev",
        repo: "browserbasehq/stagehand",
      },
      {
        name: "SWE-agent",
        description:
          "Princeton's agent for automatically resolving GitHub issues",
        tier: "worth-watching",
        url: "https://swe-agent.com",
        repo: "SWE-agent/SWE-agent",
      },
    ],
  },
  {
    id: "agent-frameworks",
    label: "Agent Frameworks",
    tools: [
      {
        name: "LangGraph",
        description:
          "Framework for building stateful, multi-actor LLM applications as graphs",
        tier: "essential",
        url: "https://langchain-ai.github.io/langgraph/",
        repo: "langchain-ai/langgraph",
      },
      {
        name: "CrewAI",
        description:
          "Framework for orchestrating role-playing autonomous AI agents",
        tier: "essential",
        url: "https://crewai.com",
        repo: "crewAIInc/crewAI",
      },
      {
        name: "OpenAI Agents SDK",
        description:
          "Production-ready SDK for building agentic apps with tool use and handoffs",
        tier: "rising",
        url: "https://openai.github.io/openai-agents-python",
        repo: "openai/openai-agents-python",
      },
      {
        name: "AutoGen",
        description:
          "Microsoft's framework for building multi-agent conversational systems",
        tier: "rising",
        url: "https://microsoft.github.io/autogen/",
        repo: "microsoft/autogen",
      },
      {
        name: "Pydantic AI",
        description:
          "Type-safe agent framework from the Pydantic team with structured outputs",
        tier: "rising",
        url: "https://ai.pydantic.dev",
        repo: "pydantic/pydantic-ai",
      },
      {
        name: "Google ADK",
        description:
          "Google's open-source multi-agent development kit for building AI agents",
        tier: "rising",
        url: "https://github.com/google/adk-python",
        repo: "google/adk-python",
      },
      {
        name: "Smolagents",
        description:
          "Hugging Face's lightweight library for building capable AI agents",
        tier: "worth-watching",
        url: "https://huggingface.co/docs/smolagents",
        repo: "huggingface/smolagents",
      },
      {
        name: "Mastra",
        description:
          "TypeScript-first AI framework — great for JS/TS developers building agents",
        tier: "rising",
        url: "https://mastra.ai",
        repo: "mastra-ai/mastra",
      },
    ],
  },
  {
    id: "llm-frameworks",
    label: "LLM Frameworks & SDKs",
    tools: [
      {
        name: "LangChain",
        description:
          "Largest LLM framework ecosystem with 500+ integrations — powerful but complex",
        tier: "rising",
        url: "https://langchain.com",
        repo: "langchain-ai/langchain",
      },
      {
        name: "Vercel AI SDK",
        description:
          "TypeScript toolkit for building AI-powered streaming UIs",
        tier: "essential",
        url: "https://sdk.vercel.ai",
        repo: "vercel/ai",
      },
      {
        name: "LlamaIndex",
        description:
          "Best-in-class framework for RAG — connect your data to LLMs with ease",
        tier: "essential",
        url: "https://llamaindex.ai",
        repo: "run-llama/llama_index",
      },
      {
        name: "DSPy",
        description:
          "Framework for programming with foundation models using optimized prompts",
        tier: "rising",
        url: "https://dspy-docs.vercel.app",
        repo: "stanfordnlp/dspy",
      },
      {
        name: "Semantic Kernel",
        description:
          "Microsoft's SDK for integrating AI models into C#, Python, and Java apps",
        tier: "worth-watching",
        url: "https://learn.microsoft.com/en-us/semantic-kernel/",
        repo: "microsoft/semantic-kernel",
      },
      {
        name: "Haystack",
        description:
          "End-to-end NLP framework for building search and RAG pipelines",
        tier: "worth-watching",
        url: "https://haystack.deepset.ai",
        repo: "deepset-ai/haystack",
      },
    ],
  },
  {
    id: "local-inference",
    label: "Local Inference",
    tools: [
      {
        name: "Ollama",
        description:
          "Run large language models locally with a simple CLI interface",
        tier: "essential",
        url: "https://ollama.ai",
        repo: "ollama/ollama",
      },
      {
        name: "vLLM",
        description:
          "High-throughput LLM serving engine with PagedAttention",
        tier: "rising",
        url: "https://vllm.ai",
        repo: "vllm-project/vllm",
      },
      {
        name: "llama.cpp",
        description:
          "LLM inference in C/C++ — runs models on consumer hardware",
        tier: "rising",
        url: "https://github.com/ggerganov/llama.cpp",
        repo: "ggerganov/llama.cpp",
      },
      {
        name: "SGLang",
        description:
          "High-performance LLM serving framework used by xAI and Azure",
        tier: "rising",
        url: "https://github.com/sgl-project/sglang",
        repo: "sgl-project/sglang",
      },
      {
        name: "LM Studio",
        description:
          "Desktop app for running local LLMs — easiest GUI for beginners, no terminal needed",
        tier: "rising",
        url: "https://lmstudio.ai",
        repo: null,
      },
      {
        name: "LocalAI",
        description:
          "OpenAI-compatible local API for running models without GPU",
        tier: "worth-watching",
        url: "https://localai.io",
        repo: "mudler/LocalAI",
      },
      {
        name: "Llamafile",
        description:
          "Run LLMs from a single executable file, backed by Mozilla",
        tier: "worth-watching",
        url: "https://github.com/Mozilla-Ocho/llamafile",
        repo: "Mozilla-Ocho/llamafile",
      },
      {
        name: "TensorRT-LLM",
        description:
          "NVIDIA's high-performance inference library for GPU-accelerated LLMs",
        tier: "worth-watching",
        url: "https://github.com/NVIDIA/TensorRT-LLM",
        repo: "NVIDIA/TensorRT-LLM",
      },
    ],
  },
  {
    id: "vector-databases",
    label: "Vector Databases",
    tools: [
      {
        name: "pgvector",
        description:
          "Vector similarity search extension for PostgreSQL",
        tier: "essential",
        url: "https://github.com/pgvector/pgvector",
        repo: "pgvector/pgvector",
      },
      {
        name: "ChromaDB",
        description:
          "Open-source embedding database for AI applications",
        tier: "essential",
        url: "https://trychroma.com",
        repo: "chroma-core/chroma",
      },
      {
        name: "Qdrant",
        description:
          "High-performance vector similarity search engine with filtering",
        tier: "rising",
        url: "https://qdrant.tech",
        repo: "qdrant/qdrant",
      },
      {
        name: "Weaviate",
        description:
          "AI-native vector database with best-in-class docs — build RAG in an afternoon",
        tier: "essential",
        url: "https://weaviate.io",
        repo: "weaviate/weaviate",
      },
      {
        name: "FAISS",
        description:
          "Meta's library for efficient similarity search and dense vector clustering",
        tier: "rising",
        url: "https://github.com/facebookresearch/faiss",
        repo: "facebookresearch/faiss",
      },
      {
        name: "Milvus",
        description:
          "Cloud-native vector database for scalable similarity search",
        tier: "worth-watching",
        url: "https://milvus.io",
        repo: "milvus-io/milvus",
      },
      {
        name: "LanceDB",
        description:
          "Serverless vector database built on Lance columnar format",
        tier: "worth-watching",
        url: "https://lancedb.com",
        repo: "lancedb/lancedb",
      },
    ],
  },
  {
    id: "observability-eval",
    label: "Observability & Evaluation",
    tools: [
      {
        name: "Langfuse",
        description:
          "Open-source LLM engineering platform for traces, evals, and prompt management",
        tier: "essential",
        url: "https://langfuse.com",
        repo: "langfuse/langfuse",
      },
      {
        name: "Weights & Biases",
        description:
          "ML experiment tracking, model management, and dataset versioning",
        tier: "rising",
        url: "https://wandb.ai",
        repo: "wandb/wandb",
      },
      {
        name: "Ragas",
        description:
          "Evaluation framework for Retrieval Augmented Generation pipelines",
        tier: "rising",
        url: "https://ragas.io",
        repo: "explodinggradients/ragas",
      },
      {
        name: "Phoenix",
        description:
          "AI observability platform for tracing, evaluation, and experimentation",
        tier: "worth-watching",
        url: "https://phoenix.arize.com",
        repo: "Arize-ai/phoenix",
      },
      {
        name: "Promptfoo",
        description:
          "Test and evaluate LLM prompts, agents, and models — essential for shipping AI apps",
        tier: "essential",
        url: "https://promptfoo.dev",
        repo: "promptfoo/promptfoo",
      },
      {
        name: "Helicone",
        description:
          "Open-source LLM observability with logging, caching, and rate limiting",
        tier: "worth-watching",
        url: "https://helicone.ai",
        repo: "Helicone/helicone",
      },
      {
        name: "DeepEval",
        description:
          "Unit testing framework for evaluating LLM outputs",
        tier: "worth-watching",
        url: "https://deepeval.com",
        repo: "confident-ai/deepeval",
      },
      {
        name: "OpenLLMetry",
        description:
          "OpenTelemetry-based instrumentation for LLM applications",
        tier: "worth-watching",
        url: "https://traceloop.com",
        repo: "traceloop/openllmetry",
      },
    ],
  },
  {
    id: "data-processing",
    label: "Data Processing & RAG",
    tools: [
      {
        name: "Firecrawl",
        description:
          "Turn websites into LLM-ready markdown or structured data via API",
        tier: "essential",
        url: "https://firecrawl.dev",
        repo: "mendableai/firecrawl",
      },
      {
        name: "Unstructured",
        description:
          "ETL toolkit for preprocessing documents, images, and HTML for LLMs",
        tier: "essential",
        url: "https://unstructured.io",
        repo: "Unstructured-IO/unstructured",
      },
      {
        name: "Crawl4AI",
        description:
          "Open-source web crawler optimized for AI data extraction",
        tier: "rising",
        url: "https://crawl4ai.com",
        repo: "unclecode/crawl4ai",
      },
      {
        name: "Docling",
        description:
          "IBM's document parsing library for PDFs, DOCX, and more to markdown",
        tier: "rising",
        url: "https://ds4sd.github.io/docling/",
        repo: "DS4SD/docling",
      },
      {
        name: "Repomix",
        description:
          "Pack entire repos into AI-friendly single files with token counting",
        tier: "rising",
        url: "https://github.com/yamadashy/repomix",
        repo: "yamadashy/repomix",
      },
      {
        name: "RAGFlow",
        description:
          "Open-source RAG engine with deep document understanding",
        tier: "worth-watching",
        url: "https://ragflow.io",
        repo: "infiniflow/ragflow",
      },
      {
        name: "Embedchain",
        description:
          "Framework for creating RAG bots over any data source",
        tier: "worth-watching",
        url: "https://embedchain.ai",
        repo: "embedchain/embedchain",
      },
    ],
  },
  {
    id: "platforms",
    label: "AI App Platforms",
    tools: [
      {
        name: "Dify",
        description:
          "Open-source platform for building LLM apps with visual workflows",
        tier: "essential",
        url: "https://dify.ai",
        repo: "langgenius/dify",
      },
      {
        name: "n8n",
        description:
          "Workflow automation platform with 400+ integrations and AI nodes",
        tier: "essential",
        url: "https://n8n.io",
        repo: "n8n-io/n8n",
      },
      {
        name: "Flowise",
        description:
          "Drag-and-drop UI for building LLM flows — easiest way to prototype AI chains",
        tier: "essential",
        url: "https://flowiseai.com",
        repo: "FlowiseAI/Flowise",
      },
      {
        name: "Langflow",
        description:
          "Visual AI workflow builder with drag-and-drop components",
        tier: "rising",
        url: "https://langflow.org",
        repo: "langflow-ai/langflow",
      },
    ],
  },
  {
    id: "structured-output",
    label: "Structured Output",
    tools: [
      {
        name: "Instructor",
        description:
          "Extract structured data from LLMs with validation via Pydantic",
        tier: "essential",
        url: "https://instructor-ai.github.io/instructor/",
        repo: "instructor-ai/instructor",
      },
      {
        name: "Outlines",
        description:
          "Structured text generation with guaranteed JSON output from LLMs",
        tier: "rising",
        url: "https://outlines-dev.github.io/outlines/",
        repo: "outlines-dev/outlines",
      },
      {
        name: "Guardrails AI",
        description:
          "Add validation, guardrails, and corrective actions to LLM outputs",
        tier: "worth-watching",
        url: "https://guardrailsai.com",
        repo: "guardrails-ai/guardrails",
      },
    ],
  },
  {
    id: "gateways",
    label: "Gateways & Routing",
    tools: [
      {
        name: "OpenRouter",
        description:
          "Unified API for 200+ LLMs with automatic fallback and routing",
        tier: "essential",
        url: "https://openrouter.ai",
        repo: null,
      },
      {
        name: "LiteLLM",
        description:
          "Call 100+ LLM APIs in OpenAI-compatible format with load balancing",
        tier: "essential",
        url: "https://litellm.ai",
        repo: "BerriAI/litellm",
      },
      {
        name: "Portkey",
        description:
          "AI gateway with caching, fallbacks, and observability for LLM apps",
        tier: "rising",
        url: "https://portkey.ai",
        repo: "Portkey-AI/gateway",
      },
    ],
  },
  {
    id: "protocols",
    label: "Protocols & Standards",
    tools: [
      {
        name: "Model Context Protocol",
        description:
          "Open standard for connecting AI assistants to external data and tools",
        tier: "essential",
        url: "https://modelcontextprotocol.io",
        repo: "modelcontextprotocol/specification",
      },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    tools: [
      {
        name: "Letta",
        description:
          "Stateful agent platform with persistent memory, formerly MemGPT",
        tier: "essential",
        url: "https://letta.com",
        repo: "letta-ai/letta",
      },
      {
        name: "Mem0",
        description:
          "Memory layer for AI assistants — adds persistent personalization",
        tier: "rising",
        url: "https://mem0.ai",
        repo: "mem0ai/mem0",
      },
      {
        name: "Zep",
        description:
          "Memory and knowledge graph platform for AI agents and assistants",
        tier: "rising",
        url: "https://getzep.com",
        repo: "getzep/zep",
      },
    ],
  },
  {
    id: "code-execution",
    label: "Code Execution",
    tools: [
      {
        name: "E2B",
        description:
          "Cloud sandboxes for running AI-generated code securely",
        tier: "rising",
        url: "https://e2b.dev",
        repo: "e2b-dev/E2B",
      },
    ],
  },
  {
    id: "voice-ai",
    label: "Voice AI",
    tools: [
      {
        name: "Pipecat",
        description:
          "Open-source framework for voice and multimodal conversational AI",
        tier: "essential",
        url: "https://pipecat.ai",
        repo: "pipecat-ai/pipecat",
      },
      {
        name: "LiveKit Agents",
        description:
          "Framework for building realtime AI agents with voice and video",
        tier: "rising",
        url: "https://livekit.io",
        repo: "livekit/agents",
      },
      {
        name: "ElevenLabs",
        description:
          "Voice AI platform with lifelike speech synthesis in 30+ languages",
        tier: "rising",
        url: "https://elevenlabs.io",
        repo: null,
      },
    ],
  },
  {
    id: "chat-uis",
    label: "Chat UIs & Frontends",
    tools: [
      {
        name: "Open WebUI",
        description:
          "Self-hosted WebUI for LLMs with plugin system and RAG support",
        tier: "essential",
        url: "https://openwebui.com",
        repo: "open-webui/open-webui",
      },
      {
        name: "Gradio",
        description:
          "Python framework for building interactive ML and AI demo interfaces",
        tier: "essential",
        url: "https://gradio.app",
        repo: "gradio-app/gradio",
      },
      {
        name: "Streamlit",
        description:
          "Python framework for building data apps and AI prototypes",
        tier: "rising",
        url: "https://streamlit.io",
        repo: "streamlit/streamlit",
      },
      {
        name: "Chainlit",
        description:
          "Framework for building production-ready conversational AI interfaces",
        tier: "rising",
        url: "https://chainlit.io",
        repo: "Chainlit/chainlit",
      },
      {
        name: "Lobe Chat",
        description:
          "Modern LLM chat framework with plugin system and multi-model support",
        tier: "worth-watching",
        url: "https://lobehub.com",
        repo: "lobehub/lobe-chat",
      },
    ],
  },
];
