import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { Client } from "langsmith";
import { osintAggregator } from "./osintAggregator";

// LangSmith Configuration
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || "shaivra-intelligence-suite";
const LANGSMITH_ENDPOINT = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";

let tracer: LangChainTracer | undefined;

if (LANGSMITH_API_KEY) {
  const client = new Client({
    apiUrl: LANGSMITH_ENDPOINT,
    apiKey: LANGSMITH_API_KEY,
  });

  tracer = new LangChainTracer({
    projectName: LANGSMITH_PROJECT,
    client,
  });
}

// --- OSINT & Recon Tools ---

const lookupEntity = tool(
  async ({ entityName }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return JSON.stringify({
      name: entityName,
      type: "Organization",
      risk_score: 0.85,
      recent_events: ["Negative sentiment spike", "Regulatory inquiry"],
      source: "internal_db"
    });
  },
  {
    name: "lookup_entity",
    description: "Get details and risk score for a specific entity from internal database.",
    schema: z.object({
      entityName: z.string().describe("The name of the entity to look up"),
    }),
  }
);

const searchKnowledgeGraph = tool(
  async ({ query }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return JSON.stringify([
      { source: "HarborBridge Housing", target: "CityWell Foundation", type: "FUNDED_BY", strength: 0.9 },
      { source: "HarborBridge Housing", target: "DCS", type: "REGULATED_BY", strength: 0.95 },
      { source: "Mara Kline", target: "HarborBridge Housing", type: "REPRESENTS", strength: 0.8 },
    ]);
  },
  {
    name: "search_knowledge_graph",
    description: "Search the knowledge graph for relationships and connection strength.",
    schema: z.object({
      query: z.string().describe("The search query for the graph"),
    }),
  }
);

const grepLogs = tool(
  async ({ pattern, context }) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return JSON.stringify([
      { file: "/var/log/syslog", line: 1024, content: `Error: Connection refused to ${pattern}`, timestamp: new Date().toISOString() },
      { file: "/var/log/auth.log", line: 55, content: `Failed login attempt for user admin from 192.168.1.105`, timestamp: new Date().toISOString() }
    ]);
  },
  {
    name: "grep_logs",
    description: "Search system logs for specific patterns or errors to enrich context.",
    schema: z.object({
      pattern: z.string().describe("The regex pattern or string to search for"),
      context: z.string().optional().describe("Additional context like 'auth', 'system', 'network'"),
    }),
  }
);

const dnsLookup = tool(
  async ({ domain }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return JSON.stringify({
      domain: domain,
      a_records: ["104.21.55.2", "172.67.188.11"],
      mx_records: ["aspmx.l.google.com"],
      txt_records: ["v=spf1 include:_spf.google.com ~all"],
      whois: { registrar: "NameCheap", created: "2020-05-15" }
    });
  },
  {
    name: "dns_lookup",
    description: "Perform DNS enumeration and WHOIS lookup for a domain.",
    schema: z.object({
      domain: z.string().describe("The domain name to lookup"),
    }),
  }
);

const webSearch = tool(
  async ({ query }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return JSON.stringify([
      { title: `Recent news about ${query}`, url: "https://news.example.com/article1", snippet: "Allegations of mismanagement have surfaced..." },
      { title: `${query} Financial Report`, url: "https://finance.example.com/report", snippet: "Quarterly earnings show a dip in donations..." }
    ]);
  },
  {
    name: "web_search",
    description: "Search the public web for news, reports, and articles.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

const runOsintScan = tool(
  async ({ target, toolName }) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return JSON.stringify({
      tool: toolName,
      target: target,
      findings: [
        { type: "email", value: `admin@${target}`, source: "theHarvester" },
        { type: "subdomain", value: `vpn.${target}`, source: "Amass" },
        { type: "open_port", value: "8080", service: "http-proxy", source: "Nmap" }
      ]
    });
  },
  {
    name: "run_osint_scan",
    description: "Run a specific OSINT tool (e.g., theHarvester, Amass, Nmap) against a target.",
    schema: z.object({
      target: z.string().describe("The target domain or IP"),
      toolName: z.string().describe("The tool to run (theHarvester, Amass, Nmap)"),
    }),
  }
);

const theHarvesterTool = tool(
  async ({ domain }) => {
    const data = await osintAggregator.fetchFromSource('theHarvester', domain);
    return JSON.stringify(data);
  },
  {
    name: "the_harvester",
    description: "Gather emails and subdomains for a domain using theHarvester.",
    schema: z.object({
      domain: z.string().describe("The domain to scan"),
    }),
  }
);

const shodanTool = tool(
  async ({ query }) => {
    const data = await osintAggregator.fetchFromSource('shodan', query);
    return JSON.stringify(data);
  },
  {
    name: "shodan_search",
    description: "Search Shodan for internet-connected devices.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

const virusTotalTool = tool(
  async ({ domain }) => {
    const data = await osintAggregator.fetchFromSource('virustotal', domain);
    return JSON.stringify(data);
  },
  {
    name: "virustotal_lookup",
    description: "Lookup domain reputation on VirusTotal.",
    schema: z.object({
      domain: z.string().describe("The domain to lookup"),
    }),
  }
);

// --- Agent Setup ---

export const runAgentAnalysis = async (input: string, context: string = "general") => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Agent analysis will be simulated.");
    return "Analysis simulated due to missing API key. Please configure GEMINI_API_KEY in .env.";
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: apiKey,
    temperature: 0,
    maxRetries: 3,
  });

  const tools = [
    lookupEntity, 
    searchKnowledgeGraph, 
    grepLogs, 
    dnsLookup, 
    webSearch, 
    runOsintScan,
    theHarvesterTool,
    shodanTool,
    virusTotalTool
  ];

  // Dynamic System Prompt Builder
  const systemPrompt = `You are a strategic intelligence analyst operating within the Shaivra Intelligence Suite.
  Your mission is to investigate the target using available OSINT and internal tools.
  
  Current Context: ${context}
  
  Guidelines:
  1. Use 'lookup_entity' first to understand the target.
  2. Use 'search_knowledge_graph' to map relationships.
  3. Use 'web_search' and 'run_osint_scan' to gather external intelligence.
  4. Use 'grep_logs' if technical anomalies are suspected.
  5. Use 'dns_lookup' for infrastructure verification.
  6. Synthesize findings into a concise risk assessment.
  
  Always cite your sources (tools used).`;

  // Create LangGraph Agent
  const agent = createReactAgent({
    llm,
    tools,
    stateModifier: systemPrompt,
  });

  const config = tracer ? { callbacks: [tracer] } : {};

  try {
    const result = await agent.invoke(
      { messages: [new HumanMessage(input)] },
      config
    );
    
    // Extract the last message content
    const lastMessage = result.messages[result.messages.length - 1];
    return typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
  } catch (error: any) {
    console.error("Agent execution failed:", error);
    return `Analysis failed: ${error.message}`;
  }
};

export const LangChainService = {
  runAgentAnalysis,
  chunkText: (text: string, size: number) => {
    // Simple chunking for demo
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  },
  storeInVectorDB: async (data: any[]) => {
    // Mock vector storage
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('[VECTORDB] Stored', data.length, 'chunks.');
  }
};
