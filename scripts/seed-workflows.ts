import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { tools, users, workflows, workflowTools } from "../src/lib/schema";
import type { WorkflowStep } from "../src/lib/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

// ─── Seed Data ────────────────────────────────────────────────────────

interface SeedWorkflow {
  title: string;
  slug: string;
  description: string;
  problemContext?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeSaved: string;
  outcome?: string;
  failureModes?: string;
  submitterName: string;
  submitterRole?: string;
  isVerified: boolean;
  isFeatured: boolean;
  steps: WorkflowStep[];
  /** Tool names from tools.json — resolved to IDs at insert time */
  toolRefs: { name: string; role: string }[];
}

const seedWorkflows: SeedWorkflow[] = [
  {
    title: "AI-Assisted Code Review with Cursor and Aider",
    slug: "ai-assisted-code-review-cursor-aider",
    description:
      "Use AI coding assistants to pre-review pull requests, catch bugs, suggest improvements, and generate review comments before human reviewers see the code.",
    problemContext:
      "Code reviews are a bottleneck — senior engineers spend hours per day reviewing PRs, and turnaround times slow the whole team down.",
    difficulty: "beginner",
    timeSaved: "2-3 hours per day on review cycles",
    outcome:
      "PRs arrive at human reviewers with fewer obvious issues, reducing back-and-forth cycles by ~60%.",
    failureModes:
      "AI can miss domain-specific logic bugs. Always keep human reviewers in the loop for architecture decisions and security-sensitive code.",
    submitterName: "Marcus Chen",
    submitterRole: "Staff Engineer @ Stripe",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "Cursor", role: "Primary code review IDE" },
      { name: "Aider", role: "Terminal-based review for large diffs" },
    ],
    steps: [
      {
        order: 1,
        title: "Check out the PR branch locally",
        description:
          "Pull the branch and open it in Cursor. The AI will automatically index the changed files.",
        toolName: "Cursor",
      },
      {
        order: 2,
        title: "Run Cursor's inline review",
        description:
          "Select changed files and ask Cursor to review the diff. It highlights potential bugs, style issues, and suggests improvements inline.",
        toolName: "Cursor",
        promptText:
          "Review this diff for bugs, performance issues, and style violations. Flag anything that doesn't match our existing patterns.",
      },
      {
        order: 3,
        title: "Deep review with Aider for complex changes",
        description:
          "For larger PRs or architectural changes, use Aider in the terminal to ask targeted questions about the diff.",
        toolName: "Aider",
        promptText:
          "aider --read $(git diff --name-only main...HEAD) --message 'Review these changes for correctness and edge cases'",
      },
      {
        order: 4,
        title: "Compile AI feedback into review comments",
        description:
          "Synthesize the AI suggestions into actionable GitHub review comments, filtering out false positives.",
      },
    ],
  },
  {
    title: "RAG Pipeline for Internal Documentation Search",
    slug: "rag-pipeline-internal-docs-search",
    description:
      "Build a retrieval-augmented generation pipeline that lets your team search internal docs, wikis, and Notion pages using natural language queries.",
    problemContext:
      "Teams waste 30+ minutes per day searching through scattered documentation across Notion, Confluence, and Google Docs.",
    difficulty: "intermediate",
    timeSaved: "30 min per developer per day",
    outcome:
      "A Slack bot or web app that answers questions about internal processes, architecture decisions, and onboarding materials with cited sources.",
    failureModes:
      "Stale embeddings when docs change frequently. Set up a re-indexing cron job. Also watch for hallucinated answers — always return source citations.",
    submitterName: "Priya Sharma",
    submitterRole: "Platform Lead @ Shopify",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "LlamaIndex", role: "Document indexing and retrieval" },
      { name: "ChromaDB", role: "Vector storage for embeddings" },
      { name: "LangChain", role: "LLM orchestration and prompt management" },
      { name: "Langfuse", role: "Observability and tracing" },
    ],
    steps: [
      {
        order: 1,
        title: "Ingest and chunk documents",
        description:
          "Use LlamaIndex's data connectors to pull from Notion, Google Docs, and markdown repos. Chunk documents into ~512 token segments with overlap.",
        toolName: "LlamaIndex",
        promptText:
          "from llama_index.core import SimpleDirectoryReader\nreader = SimpleDirectoryReader('./docs', recursive=True)\ndocuments = reader.load_data()",
      },
      {
        order: 2,
        title: "Generate and store embeddings",
        description:
          "Embed each chunk using OpenAI's text-embedding-3-small and store in ChromaDB with metadata (source URL, last updated, team).",
        toolName: "ChromaDB",
      },
      {
        order: 3,
        title: "Build the retrieval chain",
        description:
          "Wire up a LangChain RetrievalQA chain that queries ChromaDB, retrieves top-5 relevant chunks, and sends them as context to the LLM.",
        toolName: "LangChain",
      },
      {
        order: 4,
        title: "Add observability",
        description:
          "Instrument the pipeline with Langfuse to track query latency, retrieval relevance, and LLM token usage. Set up alerts for low-relevance queries.",
        toolName: "Langfuse",
      },
      {
        order: 5,
        title: "Deploy and iterate",
        description:
          "Deploy as a FastAPI service behind a Slack bot. Monitor Langfuse dashboards weekly and re-index docs on a nightly cron.",
      },
    ],
  },
  {
    title: "Multi-Agent Research Assistant with CrewAI",
    slug: "multi-agent-research-assistant-crewai",
    description:
      "Orchestrate multiple AI agents — researcher, analyst, and writer — to produce comprehensive technical research reports from a single prompt.",
    problemContext:
      "Writing thorough research reports on new technologies takes days of reading, comparing, and synthesizing information.",
    difficulty: "intermediate",
    timeSaved: "4-6 hours per research report",
    outcome:
      "A structured markdown report with executive summary, comparison tables, pros/cons, and recommendations — ready for stakeholder review.",
    failureModes:
      "Agents can go off-topic or produce conflicting analyses. Define clear role boundaries and add a validation step between agents.",
    submitterName: "Jake Morrison",
    submitterRole: "Engineering Manager @ Datadog",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "CrewAI", role: "Agent orchestration framework" },
      { name: "Firecrawl", role: "Web scraping for research sources" },
      { name: "LangChain", role: "LLM integration layer" },
    ],
    steps: [
      {
        order: 1,
        title: "Define agent roles and goals",
        description:
          "Create three agents: Researcher (finds sources), Analyst (evaluates and compares), Writer (produces the final report). Each gets a specific backstory and goal.",
        toolName: "CrewAI",
        promptText:
          "researcher = Agent(role='Senior Tech Researcher', goal='Find comprehensive sources on {topic}', backstory='You are a thorough technical researcher...')",
      },
      {
        order: 2,
        title: "Set up web research tools",
        description:
          "Give the Researcher agent access to Firecrawl for scraping technical blogs, documentation, and GitHub READMEs.",
        toolName: "Firecrawl",
      },
      {
        order: 3,
        title: "Define the task pipeline",
        description:
          "Create sequential tasks: research → analysis → writing. Each task's output feeds into the next agent as context.",
        toolName: "CrewAI",
      },
      {
        order: 4,
        title: "Run the crew and review",
        description:
          "Execute the crew with crew.kickoff(). Review the output, tweak agent prompts based on quality, and iterate.",
        toolName: "CrewAI",
        promptText:
          "result = crew.kickoff(inputs={'topic': 'Vector databases for production RAG'})",
      },
    ],
  },
  {
    title: "Local LLM Development Environment with Ollama",
    slug: "local-llm-dev-environment-ollama",
    description:
      "Set up a fully local AI development environment for prototyping and testing LLM features without API costs or data privacy concerns.",
    problemContext:
      "API costs add up fast during development, and sending proprietary code to cloud LLMs raises security concerns.",
    difficulty: "beginner",
    timeSaved: "Saves $200-500/month in API costs during development",
    outcome:
      "A local development setup where you can iterate on prompts and test LLM integrations for free with fast turnaround.",
    failureModes:
      "Local models are less capable than GPT-4/Claude. Use local for iteration, then validate with production models before shipping.",
    submitterName: "Alex Rivera",
    submitterRole: "Senior Developer @ Mozilla",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Ollama", role: "Local model server" },
      { name: "Open WebUI", role: "Chat interface for testing" },
      { name: "Continue", role: "IDE integration for local models" },
    ],
    steps: [
      {
        order: 1,
        title: "Install Ollama and pull models",
        description:
          "Install Ollama and download models suited for development — a small one for fast iteration and a larger one for quality testing.",
        toolName: "Ollama",
        promptText:
          "ollama pull llama3.2:3b  # Fast iteration\nollama pull qwen2.5-coder:14b  # Quality testing",
      },
      {
        order: 2,
        title: "Set up Open WebUI for interactive testing",
        description:
          "Run Open WebUI via Docker to get a ChatGPT-like interface pointing at your local Ollama instance.",
        toolName: "Open WebUI",
        promptText:
          "docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main",
      },
      {
        order: 3,
        title: "Configure Continue for IDE autocomplete",
        description:
          "Install the Continue extension in VS Code and point it at your local Ollama server for code completions and inline chat.",
        toolName: "Continue",
      },
      {
        order: 4,
        title: "Test and validate against cloud models",
        description:
          "Once prompts work locally, run the same test suite against your production API (Claude/GPT-4) to verify quality before deploying.",
      },
    ],
  },
  {
    title: "Automated Test Generation with AI Coding Agents",
    slug: "automated-test-generation-ai-agents",
    description:
      "Use AI coding agents to generate comprehensive test suites for existing codebases, covering unit tests, edge cases, and integration tests.",
    problemContext:
      "Legacy codebases often have low test coverage, and writing tests retroactively is tedious work that nobody wants to do.",
    difficulty: "intermediate",
    timeSaved: "5-8 hours per module",
    outcome:
      "Test coverage increases from ~30% to 70%+ with meaningful tests that actually catch bugs, not just inflate metrics.",
    failureModes:
      "AI-generated tests can be superficial — testing that 1+1=2 rather than real edge cases. Always review generated tests and add domain-specific scenarios manually.",
    submitterName: "Sarah Kim",
    submitterRole: "Senior QA Engineer @ Netflix",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "Aider", role: "Test generation from terminal" },
      { name: "Cursor", role: "IDE-based test writing" },
    ],
    steps: [
      {
        order: 1,
        title: "Identify modules with low coverage",
        description:
          "Run your existing coverage tool to find modules below threshold. Prioritize business-critical paths.",
        promptText: "npx vitest run --coverage | grep 'below threshold'",
      },
      {
        order: 2,
        title: "Generate initial test suites with Aider",
        description:
          "Use Aider to read source files and generate test files. Give it context about your testing patterns and frameworks.",
        toolName: "Aider",
        promptText:
          "aider src/services/payment.ts --message 'Write comprehensive vitest tests for this module. Cover happy paths, error cases, and edge cases. Follow the patterns in tests/services/auth.test.ts'",
      },
      {
        order: 3,
        title: "Refine edge cases in Cursor",
        description:
          "Open the generated tests in Cursor. Use inline chat to add domain-specific edge cases that require business context.",
        toolName: "Cursor",
      },
      {
        order: 4,
        title: "Run and fix failing tests",
        description:
          "Execute the test suite, fix any compilation errors or incorrect assertions, and verify coverage actually improved.",
        promptText: "npx vitest run --coverage",
      },
    ],
  },
  {
    title: "LLM-Powered Data Extraction Pipeline",
    slug: "llm-powered-data-extraction-pipeline",
    description:
      "Extract structured data from unstructured documents (PDFs, invoices, contracts) using LLMs with validated output schemas.",
    problemContext:
      "Manual data entry from documents is expensive and error-prone. Traditional OCR/regex pipelines break on format variations.",
    difficulty: "intermediate",
    timeSaved: "10+ hours per week on data entry",
    outcome:
      "An automated pipeline that extracts structured JSON from uploaded documents with 95%+ accuracy on known formats.",
    failureModes:
      "LLMs can hallucinate field values. Always validate outputs against schemas and flag low-confidence extractions for human review.",
    submitterName: "David Park",
    submitterRole: "Data Engineer @ Plaid",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Unstructured", role: "Document parsing and chunking" },
      { name: "Instructor", role: "Structured LLM output with validation" },
      { name: "LangChain", role: "Pipeline orchestration" },
      { name: "Langfuse", role: "Quality monitoring" },
    ],
    steps: [
      {
        order: 1,
        title: "Parse documents with Unstructured",
        description:
          "Use Unstructured to convert PDFs and images into clean text, preserving table structures and layout information.",
        toolName: "Unstructured",
        promptText:
          "from unstructured.partition.auto import partition\nelements = partition(filename='invoice.pdf', strategy='hi_res')",
      },
      {
        order: 2,
        title: "Define Pydantic extraction schemas",
        description:
          "Create typed Pydantic models for each document type (invoice, contract, receipt) with validation rules.",
        toolName: "Instructor",
        promptText:
          "class Invoice(BaseModel):\n    vendor: str\n    total: float = Field(gt=0)\n    line_items: list[LineItem]\n    date: date",
      },
      {
        order: 3,
        title: "Extract with Instructor",
        description:
          "Pass the parsed text to Instructor, which calls the LLM and validates the response against your Pydantic schema automatically.",
        toolName: "Instructor",
      },
      {
        order: 4,
        title: "Monitor extraction quality",
        description:
          "Log every extraction to Langfuse with confidence scores. Set up alerts for validation failures or unusual values.",
        toolName: "Langfuse",
      },
    ],
  },
  {
    title: "AI-Powered PR Description and Changelog Generator",
    slug: "ai-pr-description-changelog-generator",
    description:
      "Automatically generate detailed PR descriptions, release notes, and changelogs from git diffs using AI coding tools.",
    problemContext:
      "Developers write minimal PR descriptions ('fixed bug') and changelogs are always out of date. Release notes become a last-minute scramble.",
    difficulty: "beginner",
    timeSaved: "15-30 min per PR, hours per release",
    outcome:
      "Every PR gets a well-structured description with context, and release notes are auto-generated from merged PRs.",
    failureModes:
      "AI descriptions can be too verbose or miss the 'why'. Always let the author edit the generated description before submitting.",
    submitterName: "Tom Zhang",
    submitterRole: "DevEx Engineer @ Vercel",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Aider", role: "Git diff analysis and description generation" },
      { name: "Cursor", role: "In-editor changelog drafting" },
    ],
    steps: [
      {
        order: 1,
        title: "Generate PR description from diff",
        description:
          "Run Aider against your current branch diff to generate a structured PR description with summary, changes, and testing notes.",
        toolName: "Aider",
        promptText:
          "git diff main...HEAD | aider --message 'Generate a PR description for these changes. Include: summary, key changes, testing notes, and migration steps if needed.'",
      },
      {
        order: 2,
        title: "Review and refine in Cursor",
        description:
          "Paste the generated description into the PR template in Cursor, and use AI chat to refine sections that need more context.",
        toolName: "Cursor",
      },
      {
        order: 3,
        title: "Aggregate for release notes",
        description:
          "At release time, collect all merged PR descriptions and use AI to synthesize them into user-facing release notes grouped by category.",
        promptText:
          "gh pr list --state merged --base main --json title,body --limit 50 | aider --message 'Generate release notes from these PRs'",
      },
    ],
  },
  {
    title: "Eval-Driven Prompt Engineering with Promptfoo",
    slug: "eval-driven-prompt-engineering-promptfoo",
    description:
      "Systematically test and improve LLM prompts using automated evaluation suites instead of manual trial-and-error.",
    problemContext:
      "Prompt engineering is usually ad-hoc — you tweak a prompt, try a few examples, and hope it works. No regression testing, no metrics.",
    difficulty: "intermediate",
    timeSaved: "3-5 hours per prompt iteration cycle",
    outcome:
      "A CI-integrated prompt testing pipeline that catches regressions, compares model performance, and tracks quality metrics over time.",
    failureModes:
      "Eval datasets that are too small or not representative of production traffic. Start with real user queries from logs.",
    submitterName: "Lisa Nguyen",
    submitterRole: "ML Engineer @ Anthropic",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "Promptfoo", role: "Prompt evaluation and comparison" },
      { name: "Langfuse", role: "Production prompt tracing" },
    ],
    steps: [
      {
        order: 1,
        title: "Define test cases from real queries",
        description:
          "Export 50-100 real user queries from your production logs. Categorize them and define expected outputs or quality criteria.",
        toolName: "Promptfoo",
        promptText:
          "# promptfooconfig.yaml\nprompts:\n  - 'You are a helpful assistant. {{query}}'\n  - 'Answer concisely: {{query}}'\ntests:\n  - vars: { query: 'How do I reset my password?' }\n    assert:\n      - type: contains\n        value: 'settings'",
      },
      {
        order: 2,
        title: "Run evaluations across prompt variants",
        description:
          "Use Promptfoo to test multiple prompt versions against your test suite. Compare accuracy, latency, and cost across models.",
        toolName: "Promptfoo",
        promptText: "npx promptfoo eval --output results.json",
      },
      {
        order: 3,
        title: "Integrate with CI",
        description:
          "Add Promptfoo evaluation as a GitHub Action that runs on any PR that modifies prompt templates. Fail the build if quality drops below threshold.",
      },
      {
        order: 4,
        title: "Monitor production drift",
        description:
          "Use Langfuse to trace production prompts and detect quality drift. Feed new edge cases back into your eval suite.",
        toolName: "Langfuse",
      },
    ],
  },
  {
    title: "Building a Customer Support Chatbot with LangGraph",
    slug: "customer-support-chatbot-langgraph",
    description:
      "Build a stateful customer support agent that can handle multi-turn conversations, access knowledge bases, and escalate to humans when needed.",
    problemContext:
      "Basic chatbots fail on multi-step support flows — they lose context, can't access backend systems, and don't know when to escalate.",
    difficulty: "advanced",
    timeSaved: "40+ hours per month on L1 support tickets",
    outcome:
      "A production chatbot that resolves 60%+ of L1 tickets autonomously with proper escalation paths and conversation memory.",
    failureModes:
      "Overconfident agents that make up answers instead of escalating. Build explicit 'I don't know' paths and confidence thresholds.",
    submitterName: "Rachel Foster",
    submitterRole: "Senior Backend Engineer @ Intercom",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "LangGraph", role: "Stateful conversation graph" },
      { name: "LangChain", role: "LLM and retrieval integration" },
      { name: "ChromaDB", role: "Knowledge base vector store" },
      { name: "Langfuse", role: "Conversation tracing" },
    ],
    steps: [
      {
        order: 1,
        title: "Design the conversation graph",
        description:
          "Map out the conversation states: greeting → intent classification → knowledge lookup → response → escalation. Define edges and conditions.",
        toolName: "LangGraph",
      },
      {
        order: 2,
        title: "Build the knowledge retrieval node",
        description:
          "Index your help center articles and FAQ into ChromaDB. Create a retrieval node that pulls relevant context for each user query.",
        toolName: "ChromaDB",
      },
      {
        order: 3,
        title: "Implement state management",
        description:
          "Use LangGraph's state management to track conversation history, user intent, and resolution status across turns.",
        toolName: "LangGraph",
        promptText:
          "from langgraph.graph import StateGraph\n\nclass SupportState(TypedDict):\n    messages: list\n    intent: str\n    resolved: bool\n    confidence: float",
      },
      {
        order: 4,
        title: "Add escalation logic",
        description:
          "Define confidence thresholds — if the agent's confidence is below 0.7 or the user asks for a human, route to the escalation node.",
      },
      {
        order: 5,
        title: "Deploy and monitor",
        description:
          "Deploy behind a websocket API. Use Langfuse to trace every conversation, measure resolution rates, and identify topics that need more knowledge base content.",
        toolName: "Langfuse",
      },
    ],
  },
  {
    title: "Automated Codebase Documentation with AI",
    slug: "automated-codebase-documentation-ai",
    description:
      "Generate and maintain up-to-date codebase documentation by having AI analyze source code, infer architecture, and produce markdown docs.",
    problemContext:
      "Documentation is always stale. Nobody wants to write it, and it drifts from reality within weeks of being written.",
    difficulty: "beginner",
    timeSaved: "1-2 days per documentation cycle",
    outcome:
      "Auto-generated architecture docs, API references, and onboarding guides that stay current with the codebase.",
    failureModes:
      "Generated docs can be too generic or miss nuance. Pair AI generation with human curation — let AI draft, humans refine.",
    submitterName: "Chris Walters",
    submitterRole: "DevRel @ Supabase",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Repomix", role: "Codebase packaging for AI context" },
      { name: "Cursor", role: "Documentation generation and editing" },
      { name: "Aider", role: "Batch documentation updates" },
    ],
    steps: [
      {
        order: 1,
        title: "Pack the codebase with Repomix",
        description:
          "Use Repomix to create an AI-friendly snapshot of your repository that fits within context windows.",
        toolName: "Repomix",
        promptText:
          "npx repomix --output codebase.txt --ignore 'node_modules,dist,*.test.*'",
      },
      {
        order: 2,
        title: "Generate architecture overview",
        description:
          "Feed the Repomix output to Cursor and ask it to generate a high-level architecture document covering data flow, key modules, and dependencies.",
        toolName: "Cursor",
        promptText:
          "Analyze this codebase and generate an ARCHITECTURE.md that covers: system overview, key modules, data flow, external dependencies, and deployment model.",
      },
      {
        order: 3,
        title: "Generate API documentation",
        description:
          "Use Aider to scan API route files and generate endpoint documentation with request/response schemas.",
        toolName: "Aider",
      },
      {
        order: 4,
        title: "Set up documentation refresh CI job",
        description:
          "Add a weekly GitHub Action that regenerates docs and opens a PR if changes are detected.",
      },
    ],
  },
  {
    title: "AI-Powered Database Query Assistant",
    slug: "ai-powered-database-query-assistant",
    description:
      "Build an internal tool that lets non-technical team members query databases using natural language, with guardrails to prevent dangerous operations.",
    problemContext:
      "Business analysts constantly ask engineers to run SQL queries. Every ad-hoc data request creates a context switch.",
    difficulty: "advanced",
    timeSaved: "5-10 hours per week across the team",
    outcome:
      "A web app where anyone on the team can ask data questions in English and get formatted results with charts.",
    failureModes:
      "SQL injection via LLM, generating expensive queries that bring down the DB. Always use read-only connections and query timeouts.",
    submitterName: "Emma Walsh",
    submitterRole: "Data Platform Lead @ Notion",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "LangChain", role: "Natural language to SQL conversion" },
      { name: "Vercel AI SDK", role: "Streaming UI for query results" },
      { name: "Guardrails AI", role: "Query safety validation" },
      { name: "Supabase", role: "Read-only database connection" },
    ],
    steps: [
      {
        order: 1,
        title: "Set up read-only database access",
        description:
          "Create a read-only Supabase connection with restricted permissions. Set query timeout to 30 seconds to prevent expensive scans.",
        toolName: "Supabase",
      },
      {
        order: 2,
        title: "Build the NL-to-SQL pipeline",
        description:
          "Use LangChain's SQL agent with schema context — feed it table definitions, column descriptions, and example queries.",
        toolName: "LangChain",
        promptText:
          "from langchain_community.utilities import SQLDatabase\nfrom langchain.chains import create_sql_query_chain\ndb = SQLDatabase.from_uri(readonly_uri, include_tables=['orders', 'users', 'products'])",
      },
      {
        order: 3,
        title: "Add query validation guardrails",
        description:
          "Use Guardrails AI to validate generated SQL — block DELETE/UPDATE/DROP, enforce LIMIT clauses, and restrict to allowed tables.",
        toolName: "Guardrails AI",
      },
      {
        order: 4,
        title: "Build the streaming UI",
        description:
          "Use Vercel AI SDK to stream the query generation process and results to a React frontend with formatted tables.",
        toolName: "Vercel AI SDK",
      },
      {
        order: 5,
        title: "Log queries and build a library",
        description:
          "Save successful queries to a library so common questions can be answered instantly without re-generating SQL.",
      },
    ],
  },
  {
    title: "RAG Evaluation Pipeline with Ragas",
    slug: "rag-evaluation-pipeline-ragas",
    description:
      "Set up automated quality evaluation for RAG pipelines using Ragas metrics — faithfulness, answer relevancy, and context precision.",
    problemContext:
      "RAG pipelines degrade silently. Without evaluation, you don't know if retrieval quality drops or if the LLM starts hallucinating.",
    difficulty: "intermediate",
    timeSaved: "2-3 hours per evaluation cycle",
    outcome:
      "A dashboard showing RAG quality metrics over time, with alerts when any metric drops below threshold.",
    failureModes:
      "Evaluation datasets that don't represent production queries. Regularly refresh your eval set with real user questions.",
    submitterName: "Andre Santos",
    submitterRole: "ML Engineer @ Cohere",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Ragas", role: "RAG evaluation framework" },
      { name: "LlamaIndex", role: "RAG pipeline under test" },
      { name: "ChromaDB", role: "Vector store" },
      { name: "Langfuse", role: "Metrics tracking" },
    ],
    steps: [
      {
        order: 1,
        title: "Build evaluation dataset",
        description:
          "Create 50+ question-answer pairs from your domain. Include the expected answer and the ground truth context passages.",
        toolName: "Ragas",
      },
      {
        order: 2,
        title: "Run Ragas evaluation",
        description:
          "Evaluate your RAG pipeline against the dataset using Ragas metrics: faithfulness, answer_relevancy, context_precision, context_recall.",
        toolName: "Ragas",
        promptText:
          "from ragas import evaluate\nfrom ragas.metrics import faithfulness, answer_relevancy, context_precision\nresult = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])",
      },
      {
        order: 3,
        title: "Identify failure modes",
        description:
          "Analyze low-scoring samples. Common issues: wrong chunks retrieved (context_precision), LLM ignoring context (faithfulness), or irrelevant answers.",
      },
      {
        order: 4,
        title: "Automate in CI",
        description:
          "Run Ragas evaluation on every PR that changes retrieval logic, embedding models, or prompt templates. Fail if metrics drop >5%.",
      },
    ],
  },
  {
    title: "Browser Automation Agent for QA Testing",
    slug: "browser-automation-agent-qa-testing",
    description:
      "Use an AI-powered browser agent to automatically explore your web app, find bugs, and generate test reports — no scripted test paths needed.",
    problemContext:
      "Manual QA is slow and exploratory testing misses edge cases. Traditional E2E tests are brittle and expensive to maintain.",
    difficulty: "advanced",
    timeSaved: "8-12 hours per release cycle on QA",
    outcome:
      "An AI agent that explores your app like a real user, flags visual regressions, broken flows, and accessibility issues.",
    failureModes:
      "Agent can get stuck in loops or miss auth-gated pages. Provide initial navigation hints and authentication credentials.",
    submitterName: "Nina Kozlov",
    submitterRole: "QA Architect @ GitLab",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Browser Use", role: "AI browser automation" },
      { name: "LangChain", role: "Agent reasoning engine" },
      { name: "Stagehand", role: "Structured browser interactions" },
    ],
    steps: [
      {
        order: 1,
        title: "Set up the browser agent",
        description:
          "Configure Browser Use with your app's base URL and authentication cookies. Define the testing scope (which pages/flows to explore).",
        toolName: "Browser Use",
        promptText:
          "from browser_use import Agent\nagent = Agent(task='Test the checkout flow on our e-commerce app', llm=ChatOpenAI(model='gpt-4o'))",
      },
      {
        order: 2,
        title: "Define testing objectives",
        description:
          "Give the agent specific testing goals: form validation, navigation flows, error handling, and responsive layout checks.",
      },
      {
        order: 3,
        title: "Run exploration and collect results",
        description:
          "Let the agent explore your app autonomously. It screenshots each page, logs interactions, and flags anomalies.",
        toolName: "Browser Use",
      },
      {
        order: 4,
        title: "Generate structured test reports",
        description:
          "Use Stagehand to convert the agent's exploration log into structured test reports with screenshots, steps to reproduce, and severity ratings.",
        toolName: "Stagehand",
      },
    ],
  },
  {
    title: "Self-Healing CI Pipeline with AI Error Analysis",
    slug: "self-healing-ci-pipeline-ai-error-analysis",
    description:
      "Automatically analyze CI failures, classify error types, suggest fixes, and even auto-fix common issues like flaky tests or dependency conflicts.",
    problemContext:
      "CI failures eat 15-30 minutes per incident as developers context-switch to read logs, understand errors, and figure out fixes.",
    difficulty: "advanced",
    timeSaved: "15-30 min per CI failure incident",
    outcome:
      "CI failures get auto-triaged with root cause analysis and suggested fixes. Common issues like lock file conflicts get auto-repaired.",
    failureModes:
      "Auto-fixes that mask real bugs. Only auto-fix well-understood patterns (lock files, formatting, flaky retries). Flag everything else for human review.",
    submitterName: "Ryan O'Brien",
    submitterRole: "Platform Engineer @ Cloudflare",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "LangChain", role: "Error log analysis" },
      { name: "Aider", role: "Automated code fixes" },
      { name: "n8n", role: "Workflow automation" },
    ],
    steps: [
      {
        order: 1,
        title: "Capture CI failure logs",
        description:
          "Set up an n8n workflow triggered by GitHub Actions failure webhooks. Extract the failure logs and relevant context.",
        toolName: "n8n",
      },
      {
        order: 2,
        title: "Classify the failure",
        description:
          "Use LangChain to classify the failure type: flaky test, dependency conflict, type error, lint failure, timeout, or infrastructure issue.",
        toolName: "LangChain",
        promptText:
          "Classify this CI failure into one of: FLAKY_TEST, DEPENDENCY_CONFLICT, TYPE_ERROR, LINT_FAILURE, TIMEOUT, INFRA_ISSUE, UNKNOWN. Explain your reasoning.\n\nLog: {ci_log}",
      },
      {
        order: 3,
        title: "Auto-fix known patterns",
        description:
          "For well-understood failures (lint, lock file, formatting), use Aider to generate and push the fix automatically.",
        toolName: "Aider",
      },
      {
        order: 4,
        title: "Report and escalate unknown failures",
        description:
          "For unclassified failures, post a Slack message with the AI's analysis, suspected root cause, and suggested next steps.",
        toolName: "n8n",
      },
    ],
  },
  {
    title: "Structured Output API with Instructor and FastAPI",
    slug: "structured-output-api-instructor-fastapi",
    description:
      "Build a production API that extracts structured data from unstructured text using Instructor for typed LLM outputs and FastAPI for serving.",
    problemContext:
      "Raw LLM responses are unpredictable strings. Building reliable APIs on top requires structured, validated outputs.",
    difficulty: "intermediate",
    timeSaved: "2-3 days of manual parsing code",
    outcome:
      "A FastAPI service that accepts unstructured text and returns validated, typed JSON — ready for downstream consumption.",
    failureModes:
      "Complex nested schemas can cause LLM extraction failures. Start simple and add fields incrementally. Use retries with exponential backoff.",
    submitterName: "Jason Instructor",
    submitterRole: "Creator of Instructor",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Instructor", role: "Structured LLM extraction" },
      { name: "FastAPI", role: "API server" },
      { name: "Guardrails AI", role: "Output validation" },
    ],
    steps: [
      {
        order: 1,
        title: "Define Pydantic models",
        description:
          "Create your extraction schema as Pydantic models with field descriptions that guide the LLM.",
        toolName: "Instructor",
        promptText:
          "class Contact(BaseModel):\n    name: str = Field(description='Full name of the person')\n    email: EmailStr = Field(description='Email address')\n    company: str | None = Field(description='Company name if mentioned')",
      },
      {
        order: 2,
        title: "Wire up Instructor with your LLM",
        description:
          "Patch your OpenAI or Anthropic client with Instructor. It handles schema injection, extraction, and validation automatically.",
        toolName: "Instructor",
        promptText:
          "import instructor\nclient = instructor.from_anthropic(Anthropic())\ncontact = client.messages.create(model='claude-sonnet-4-20250514', response_model=Contact, messages=[{'role': 'user', 'content': text}])",
      },
      {
        order: 3,
        title: "Build the FastAPI endpoint",
        description:
          "Create an API endpoint that accepts text input, runs extraction, and returns the validated model as JSON.",
        toolName: "FastAPI",
      },
      {
        order: 4,
        title: "Add validation and error handling",
        description:
          "Use Guardrails AI for additional business logic validation (e.g., email domain allowlists). Return structured errors for failed extractions.",
        toolName: "Guardrails AI",
      },
    ],
  },
  {
    title: "Observability Stack for LLM Applications",
    slug: "observability-stack-llm-applications",
    description:
      "Set up comprehensive observability for LLM apps — tracing every prompt, tracking token costs, measuring latency, and detecting quality regressions.",
    problemContext:
      "LLM apps are black boxes in production. You can't debug what you can't observe — and LLMs fail in unique, hard-to-reproduce ways.",
    difficulty: "intermediate",
    timeSaved: "Prevents hours of debugging per incident",
    outcome:
      "Full visibility into your LLM pipeline: every prompt traced, costs tracked per feature, latency monitored, and quality scored.",
    failureModes:
      "Over-instrumentation that adds latency. Use async tracing and sampling for high-throughput endpoints.",
    submitterName: "Clemens Karagianis",
    submitterRole: "Co-founder @ Langfuse",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "Langfuse", role: "LLM tracing and analytics" },
      { name: "OpenLLMetry", role: "OpenTelemetry-based instrumentation" },
      { name: "Helicone", role: "Cost tracking and caching" },
    ],
    steps: [
      {
        order: 1,
        title: "Instrument with OpenLLMetry",
        description:
          "Add OpenLLMetry's auto-instrumentation to your app. It automatically traces OpenAI, Anthropic, and LangChain calls with zero code changes.",
        toolName: "OpenLLMetry",
        promptText:
          "from traceloop.sdk import Traceloop\nTraceloop.init(app_name='my-app', api_endpoint='https://cloud.langfuse.com')",
      },
      {
        order: 2,
        title: "Set up Langfuse dashboards",
        description:
          "Configure Langfuse to receive traces from OpenLLMetry. Set up dashboards for: latency p50/p99, token usage by feature, error rates, and cost per user.",
        toolName: "Langfuse",
      },
      {
        order: 3,
        title: "Add cost tracking with Helicone",
        description:
          "Route LLM API calls through Helicone proxy for real-time cost tracking, request caching, and rate limiting.",
        toolName: "Helicone",
      },
      {
        order: 4,
        title: "Set up quality scoring and alerts",
        description:
          "Define quality scoring functions in Langfuse (response relevance, format compliance). Alert on Slack when scores drop below thresholds.",
        toolName: "Langfuse",
      },
    ],
  },
  {
    title: "No-Code AI Workflow with n8n and Dify",
    slug: "no-code-ai-workflow-n8n-dify",
    description:
      "Build complex AI automation workflows without writing code using n8n for orchestration and Dify for LLM application logic.",
    problemContext:
      "Not every AI workflow needs custom code. Many common patterns (email processing, content generation, data enrichment) can be built visually.",
    difficulty: "beginner",
    timeSaved: "Days of development time for simple automations",
    outcome:
      "A visual workflow that processes incoming emails, extracts key information with AI, and routes actions to the right team.",
    failureModes:
      "No-code tools hit limits with complex logic. Know when to switch to code. Also test edge cases — visual builders make it easy to miss error paths.",
    submitterName: "Maria Garcia",
    submitterRole: "Automation Engineer @ Zapier",
    isVerified: true,
    isFeatured: false,
    toolRefs: [
      { name: "n8n", role: "Workflow orchestration" },
      { name: "Dify", role: "LLM application builder" },
    ],
    steps: [
      {
        order: 1,
        title: "Design the workflow in n8n",
        description:
          "Create an n8n workflow triggered by incoming emails (via IMAP or webhook). Add nodes for email parsing, AI processing, and routing.",
        toolName: "n8n",
      },
      {
        order: 2,
        title: "Build the AI logic in Dify",
        description:
          "Create a Dify app that takes email text as input and outputs: category, priority, key entities, and suggested response. Use Dify's visual prompt builder.",
        toolName: "Dify",
      },
      {
        order: 3,
        title: "Connect n8n to Dify via API",
        description:
          "Add an HTTP Request node in n8n that calls your Dify app's API with the email content. Parse the structured response.",
        toolName: "n8n",
      },
      {
        order: 4,
        title: "Route and act on results",
        description:
          "Use n8n's Switch node to route based on Dify's classification: create Jira tickets for bugs, Slack messages for urgent items, auto-reply for FAQs.",
        toolName: "n8n",
      },
    ],
  },
  {
    title: "MCP Server for Custom Tool Integration",
    slug: "mcp-server-custom-tool-integration",
    description:
      "Build a Model Context Protocol (MCP) server that exposes your internal APIs and databases as tools that any MCP-compatible AI assistant can use.",
    problemContext:
      "AI assistants can't access your internal systems. Every integration is custom-built and breaks when the AI tool updates.",
    difficulty: "advanced",
    timeSaved: "Weeks of custom integration work",
    outcome:
      "A standardized MCP server that any compatible AI tool (Claude, Cursor, etc.) can connect to for accessing your internal systems.",
    failureModes:
      "Overly permissive tool access. Apply principle of least privilege — only expose read operations initially, and add write operations with confirmation prompts.",
    submitterName: "David Soria Parra",
    submitterRole: "MCP Lead @ Anthropic",
    isVerified: true,
    isFeatured: true,
    toolRefs: [
      { name: "Model Context Protocol", role: "Protocol and SDK" },
      { name: "FastAPI", role: "HTTP transport layer" },
    ],
    steps: [
      {
        order: 1,
        title: "Define your tool schemas",
        description:
          "List the internal operations you want to expose as MCP tools. Start with read-only queries: search users, get order status, fetch metrics.",
        toolName: "Model Context Protocol",
      },
      {
        order: 2,
        title: "Implement the MCP server",
        description:
          "Use the MCP Python SDK to create a server that implements your tools with proper input validation and error handling.",
        toolName: "Model Context Protocol",
        promptText:
          "from mcp.server import Server\nfrom mcp.types import Tool\n\nserver = Server('internal-tools')\n\n@server.tool()\nasync def search_users(query: str) -> list[dict]:\n    '''Search internal user directory'''\n    return await db.search_users(query)",
      },
      {
        order: 3,
        title: "Add authentication and rate limiting",
        description:
          "Wrap the MCP server with authentication middleware. Use API keys for server-to-server and OAuth for user-facing connections.",
        toolName: "FastAPI",
      },
      {
        order: 4,
        title: "Test with Claude and Cursor",
        description:
          "Connect your MCP server to Claude Desktop or Cursor and verify that the tools appear correctly and return expected results.",
        toolName: "Model Context Protocol",
      },
    ],
  },
];

// ─── Seed Logic ───────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function main() {
  console.log("Seeding workflows...\n");

  // Build a name→id map for tools
  const allTools = await db.select({ id: tools.id, name: tools.name }).from(tools);
  const toolMap = new Map(allTools.map((t) => [t.name, t.id]));

  if (toolMap.size === 0) {
    console.error(
      "No tools found in the database. Run `npm run collect:github` first to seed the tools table."
    );
    process.exit(1);
  }

  // Upsert a seed user
  const SEED_FINGERPRINT = "seed-script-workflows-v1";
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.fingerprintHash, SEED_FINGERPRINT))
    .limit(1);

  let seedUserId: number;
  if (existingUser.length > 0) {
    seedUserId = existingUser[0].id;
    console.log(`Using existing seed user (id=${seedUserId})`);
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        displayName: "DevFlow Team",
        fingerprintHash: SEED_FINGERPRINT,
        isVerifiedContributor: true,
      })
      .returning({ id: users.id });
    seedUserId = newUser.id;
    console.log(`Created seed user (id=${seedUserId})`);
  }

  let inserted = 0;
  let skipped = 0;

  for (const wf of seedWorkflows) {
    const slug = wf.slug || slugify(wf.title);

    // Idempotency: skip if slug already exists
    const existing = await db
      .select({ id: workflows.id })
      .from(workflows)
      .where(eq(workflows.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  SKIP: "${wf.title}" (slug already exists)`);
      skipped++;
      continue;
    }

    // Resolve tool names to IDs
    const resolvedTools: { toolId: number; role: string }[] = [];
    for (const ref of wf.toolRefs) {
      const id = toolMap.get(ref.name);
      if (!id) {
        console.warn(`  WARN: Tool "${ref.name}" not found in DB, skipping tool link`);
        continue;
      }
      resolvedTools.push({ toolId: id, role: ref.role });
    }

    // Insert workflow
    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        slug,
        title: wf.title,
        description: wf.description,
        problemContext: wf.problemContext,
        difficulty: wf.difficulty,
        timeSaved: wf.timeSaved,
        outcome: wf.outcome,
        failureModes: wf.failureModes,
        steps: wf.steps,
        proofUrls: [],
        submitterId: seedUserId,
        submitterName: wf.submitterName,
        submitterRole: wf.submitterRole,
        isVerified: wf.isVerified,
        isFeatured: wf.isFeatured,
        upvoteCount: 0,
        viewCount: 0,
      })
      .returning({ id: workflows.id });

    // Insert workflow-tool links
    if (resolvedTools.length > 0) {
      await db.insert(workflowTools).values(
        resolvedTools.map((t, i) => ({
          workflowId: newWorkflow.id,
          toolId: t.toolId,
          usageOrder: i,
          roleInWorkflow: t.role,
        }))
      );
    }

    console.log(`  ADD: "${wf.title}" (${resolvedTools.length} tools linked)`);
    inserted++;
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
