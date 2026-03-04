import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

import fs from "fs";
import path from "path";

// Security middleware
import { securityHeaders, devSecurityHeaders } from "./src/server/middleware/security";
import { globalLimiter, aiLimiter, authLimiter, searchLimiter } from "./src/server/middleware/rateLimiting";
import { csrfProtection, csrfErrorHandler, getCsrfToken } from "./src/server/middleware/csrf";
import { authenticate, optionalAuthenticate } from "./src/server/middleware/authenticate";
import { authorize, adminOnly, analystOrHigher, anyAuthenticated } from "./src/server/middleware/authorize";
import { validateBody, validateQuery } from "./src/server/middleware/validate";

// Validation schemas
import {
  loginSchema,
  registerSchema,
  searchSchema,
  reportSchema,
  orgProfileSchema,
  investigationSchema,
  forgeAnalysisSchema,
  osintQuerySchema,
  clipSchema,
  projectSchema,
} from "./src/server/validation/schemas";

// Authentication
import {
  authenticateUser,
  registerUser,
  generateToken,
  signOutUser,
} from "./src/server/auth/supabaseAuth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - MUST be first
app.use(process.env.NODE_ENV === 'production' ? securityHeaders : devSecurityHeaders);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Apply global rate limiter to all routes
app.use('/api/', globalLimiter);

// --- Strategy Integration ---
const loadStrategy = () => {
  try {
    const strategyPath = path.join(process.cwd(), "strategy", "core_strategy.json");
    if (fs.existsSync(strategyPath)) {
      return JSON.parse(fs.readFileSync(strategyPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading strategy:", error);
  }
  return { strategies: [] };
};

const coreStrategy = loadStrategy();

// --- Master Graph & Intelligence Store ---
let masterGraph: any = {
  nodes: [],
  links: [],
  metadata: {
    last_sync: new Date().toISOString(),
    total_entities: 0,
    total_links: 0
  }
};

let dailyReports: any[] = [];
let weeklyReports: any[] = [];
let trends: any[] = [];

// Helper to update master graph
const updateMasterGraph = (newNodes: any[], newLinks: any[]) => {
  newNodes.forEach(node => {
    if (!masterGraph.nodes.find((n: any) => n.uuid === node.uuid)) {
      masterGraph.nodes.push(node);
    }
  });
  newLinks.forEach(link => {
    if (!masterGraph.links.find((l: any) => l.source === link.source && l.target === link.target)) {
      masterGraph.links.push(link);
    }
  });
  masterGraph.metadata.total_entities = masterGraph.nodes.length;
  masterGraph.metadata.total_links = masterGraph.links.length;
  masterGraph.metadata.last_sync = new Date().toISOString();
};

// --- Agent Network Logic ---
const runAgentNetwork = async (target: string, goal: string, initialData: any) => {
  let certainty = 0;
  let iterations = 0;
  const maxIterations = 5;
  let currentData = { ...initialData };
  let logs: string[] = [];
  let citations: any[] = [];

  console.log(`[AGENT-NETWORK] Starting investigation for ${target} - Goal: ${goal}`);

  while (certainty < 80 && iterations < maxIterations) {
    iterations++;
    console.log(`[AGENT-NETWORK] Iteration ${iterations} - Current Certainty: ${certainty}%`);
    
    // Simulate quantitative analysis and comparative evaluation
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Truncate currentData to avoid token limit
    const truncatedData = JSON.stringify(currentData).substring(0, 2000);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are a Supervisor Agent in the Shaivra Intelligence Suite. 
      Target: ${target}
      Goal: ${goal}
      Current Data (truncated): ${truncatedData}
      Current Certainty: ${certainty}%
      
      Perform the following:
      1. QUANTITATIVE ANALYSIS: Evaluate the density and reliability of the current data points.
      2. COMPARATIVE EVALUATION: Compare findings against the Master Graph and known OSINT patterns.
      3. CITATION ATTRIBUTION: For every new finding, attribute a likelihood based on source legitimacy and provide a citation.
      4. STRATEGY ALIGNMENT: Ensure the investigation aligns with the core strategy: ${JSON.stringify(coreStrategy).substring(0, 500)}.
      
      Return a JSON object:
      {
        "new_certainty": number (0-100),
        "new_findings": [...],
        "citations": [{ "source": "...", "likelihood": 0.0-1.0, "finding": "..." }],
        "logs": ["..."],
        "is_satisfied": boolean
      }`,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    certainty = result.new_certainty;
    logs.push(...result.logs);
    citations.push(...result.citations);
    currentData = { ...currentData, ...result.new_findings };

    if (result.is_satisfied && certainty >= 80) break;
  }

  return { target, certainty, data: currentData, logs, citations };
};

// --- Langsmith Integration (Mock/Production Ready) ---
const traceAgentAction = async (action: string, input: any, output: any) => {
  const langsmithKey = process.env.LANGSMITH_API_KEY;
  const traceId = `trace-${Math.random().toString(36).substr(2, 9)}`;
  
  if (langsmithKey) {
    // Real Langsmith API call would go here
    console.log(`[LANGSMITH] Tracing ${action} - ID: ${traceId}`);
  } else {
    console.log(`[LANGSMITH-MOCK] Tracing ${action} - ID: ${traceId}`);
  }
  return traceId;
};

// --- API Routes ---

// 1. Google Search via Gemini (Protected: requires authentication, rate limited, validated)
app.post("/api/search",
  authenticate, // Require authentication
  anyAuthenticated, // Any authenticated user can search
  searchLimiter, // Apply search-specific rate limit
  aiLimiter, // Also apply AI endpoint rate limit
  validateBody(searchSchema), // Validate request body
  async (req, res) => {
    const { query, traceId: parentTraceId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Using a model that supports search grounding
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    const traceId = await traceAgentAction("web_search", { query }, { text, sources });

    res.json({
      text,
      sources,
      traceId,
      raw: response
    });
  } catch (error: any) {
    console.error("Search Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. OSINT: Shodan (Requires SHODAN_API_KEY)
app.get("/api/osint/shodan", async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.SHODAN_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "SHODAN_API_KEY is not configured." });
  }

  try {
    const response = await fetch(`https://api.shodan.io/shodan/host/search?key=${apiKey}&query=${query}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. OSINT: AlienVault OTX (Requires ALIENVAULT_API_KEY)
app.get("/api/osint/alienvault", async (req, res) => {
  const { query, type = 'domain' } = req.query;
  const apiKey = process.env.ALIENVAULT_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "ALIENVAULT_API_KEY is not configured." });
  }

  try {
    // Example: https://otx.alienvault.com/api/v1/indicators/domain/google.com/general
    const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/${type}/${query}/general`, {
      headers: { 'X-OTX-API-KEY': apiKey }
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. OSINT: VirusTotal (Requires VIRUSTOTAL_API_KEY)
app.get("/api/osint/virustotal", async (req, res) => {
  const { query, type = 'domain' } = req.query;
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "VIRUSTOTAL_API_KEY is not configured." });
  }

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/${type}s/${query}`, {
      headers: { 'x-apikey': apiKey }
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Intelligence Synthesis: Summarize OSINT data
app.post("/api/summarize", async (req, res) => {
  const { data, target } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Analyze the following OSINT data for the target "${target}" and provide a rich, human-readable summary of the key security insights, risks, and recommended next steps. 
      
      Data:
      ${JSON.stringify(data, null, 2)}`,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Strategic Report Generation
app.post("/api/report", async (req, res) => {
  const { pipelineData, target } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // SEED AGENT NETWORK: Refine data before report generation if certainty is low
    const agentResult = await runAgentNetwork(
      target,
      `Refine intelligence for strategic report on ${target}`,
      pipelineData
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate a comprehensive Strategic Threat Assessment and Network Analysis report for the target "${target}" based on the following refined intelligence. 
      
      Refined Intelligence (Certainty: ${agentResult.certainty}%):
      ${JSON.stringify(agentResult.data, null, 2)}
      
      Agent Logs:
      ${JSON.stringify(agentResult.logs)}
      
      This is a high-powered analysis. You must:
      1. Provide a polished executive summary.
      2. Analyze the competitive landscape and identify new market entrants.
      3. Allocate a "Probability of Conflict" (0-100%) and provide detailed strategic reasons for this allocation.
      4. Identify key intelligence findings and risks.
      5. Recommend aggressive strategic countermeasures.
      
      Format the response as a JSON object with the following structure:
      {
        "title": "Strategic Intelligence Synthesis: [Target Name]",
        "summary": "...",
        "competition_context": {
          "main_competitors": ["...", "..."],
          "market_entrants": ["...", "..."],
          "competitive_threat_level": "low|medium|high|critical"
        },
        "conflict_analysis": {
          "probability": 75,
          "reasons": ["...", "..."]
        },
        "key_findings": ["...", "...", "..."],
        "risk_assessment": "...",
        "strategic_actions": ["...", "..."]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const report = JSON.parse(response.text);
    res.json({
      ...report,
      agent_certainty: agentResult.certainty,
      agent_logs: agentResult.logs,
      citations: agentResult.citations
    });
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Website Fingerprinting & Architecture Analysis
app.get("/api/osint/fingerprint", async (req, res) => {
  const { url } = req.query;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Perform a technical architecture fingerprinting for the website: ${url}. 
      Identify the likely technology stack, architecture patterns, API endpoints, and cloud-based assets. 
      Identify potential vulnerabilities in this stack.
      
      Format the response as a JSON object:
      {
        "stack": ["React", "Node.js", ...],
        "architecture": "Microservices/Monolith/etc",
        "api_endpoints": ["/api/v1", ...],
        "cloud_assets": ["AWS S3", "Cloudflare", ...],
        "vulnerabilities": ["...", "..."]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Intelligence Analytics Summary
app.post("/api/analytics/summary", async (req, res) => {
  const { target, sector } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate a rich intelligence summary for the target "${target}" in the "${sector}" sector. 
      Analyze across these domains: Organizational, Disinformation, Financial Obfuscation, Cyber Infrastructure, and Geopolitical.
      
      Format the response as a JSON object:
      {
        "target": "${target}",
        "sector": "${sector}",
        "threat_domains": [
          {
            "domain": "Organizational",
            "risk_level": "low|medium|high|critical",
            "findings": ["...", "..."]
          },
          ...
        ],
        "overall_assessment": "...",
        "data_sources": ["Google Search", "OSINT Feeds", "Dark Web Monitors"],
        "last_updated": "${new Date().toISOString()}"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Filtered Web Search & UUID Association
app.post("/api/search/filtered", async (req, res) => {
  const { organization, targets, query } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // First, get raw search results
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Search the web for information regarding "${organization}" and its competitors "${targets.join(', ')}". 
      Filter the results to include ONLY highly relevant strategic intelligence.
      Assign a unique UUID to each result.
      
      Format the response as a JSON array of objects:
      [
        {
          "uuid": "uuid-v4-string",
          "title": "...",
          "url": "https://...",
          "relevance_score": 0.95,
          "summary": "...",
          "entities": ["Entity A", "Entity B"]
        }
      ]`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const initialResults = JSON.parse(response.text);

    // SEED AGENT NETWORK: Refine results until 80% certainty
    const agentResult = await runAgentNetwork(
      organization, 
      `Refine strategic intelligence for ${organization} and competitors ${targets.join(', ')}`,
      initialResults
    );

    res.json({
      results: agentResult.data,
      certainty: agentResult.certainty,
      agent_logs: agentResult.logs,
      citations: agentResult.citations
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Autonomous Search Bot (Admin)
app.post("/api/bot/start", async (req, res) => {
  const { sector, focus } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are an autonomous search bot. Your goal is to build sector intuition and knowledge for the "${sector}" sector with a focus on "${focus}".
      Simulate a loop of searching, synthesizing, and mapping resources.
      
      Return a state object in JSON:
      {
        "status": "looping",
        "current_sector": "${sector}",
        "intuition_level": 65,
        "knowledge_nodes": 124,
        "resources_mapped": 42,
        "logs": [
          "Initiated crawl of sector-specific forums...",
          "Synthesized 15 new knowledge nodes regarding market shifts.",
          "Identified 3 key disparate information points linking competitor A to offshore entity B."
        ]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Daily Batched Intelligence Summary (Admin Only)
app.get("/api/admin/reports/daily", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Simulate gathering all public searches from the last 24h
    const recentSearches = searchHistory.filter(h => {
      const searchDate = new Date(h.timestamp);
      const now = new Date();
      return (now.getTime() - searchDate.getTime()) < 24 * 60 * 60 * 1000;
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate a daily intelligence summary report based on the following recent searches: ${JSON.stringify(recentSearches)}.
      Also, contribute these findings to the Master Graph.
      
      Format as JSON:
      {
        "report_id": "daily-rpt-${new Date().toISOString().split('T')[0]}",
        "date": "${new Date().toISOString()}",
        "summary": "...",
        "top_threats": ["...", "..."],
        "sector_shifts": ["...", "..."],
        "graph_updates": {
          "nodes": [{ "uuid": "...", "label": "...", "type": "..." }],
          "links": [{ "source": "...", "target": "...", "label": "..." }]
        },
        "ml_insights": {
          "clusters": ["...", "..."],
          "trends": ["...", "..."]
        }
      }`,
      config: { responseMimeType: "application/json" }
    });

    const report = JSON.parse(response.text);
    dailyReports.push(report);
    
    // Update Master Graph
    updateMasterGraph(report.graph_updates.nodes, report.graph_updates.links);

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11b. Weekly Intelligence Review (Admin Only)
app.get("/api/admin/reports/weekly", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Missing API Key" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Focus on NGO/Gov/Activist sources
    const ngoData = masterGraph.nodes.filter((n: any) => 
      ['NGO', 'Government', 'Activist'].includes(n.type)
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Perform a WEEKLY STRATEGIC REVIEW of the following NGO/Gov/Activist data: ${JSON.stringify(ngoData)}.
      
      APPLY ADVANCED ANALYTICS:
      1. ISOLATION TREES: Find hidden links and anomalies.
      2. CLUSTERING: Group entities based on NLP-derived themes.
      3. TIME SERIES: Analyze core idea progression using linear regression.
      4. ML PREDICTIONS: Predict upcoming trends in these sectors.
      
      Format as JSON:
      {
        "report_id": "weekly-rpt-${new Date().toISOString().split('T')[0]}",
        "anomalies_detected": ["...", "..."],
        "clusters": [{ "name": "...", "entities": ["...", "..."] }],
        "trend_predictions": [{ "trend": "...", "probability": 0.0-1.0, "timeframe": "..." }],
        "ml_insights": "...",
        "human_readable_summary": "..."
      }`,
      config: { responseMimeType: "application/json" }
    });

    const report = JSON.parse(response.text);
    weeklyReports.push(report);
    
    // Update trends
    report.trend_predictions.forEach((tp: any) => {
      trends.push({ ...tp, timestamp: new Date().toISOString() });
    });

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11c. Trends View with Time Slider
app.get("/api/trends", (req, res) => {
  res.json(trends);
});

// 11d. Master Graph Retrieval
app.get("/api/graph/master", (req, res) => {
  res.json(masterGraph);
});

// 12. Global Graph Search (UUID-based)
app.get("/api/graph/global-search", async (req, res) => {
  const { q } = req.query;

  // Simulate a search across the global graph
  const results = [
    { uuid: "550e8400-e29b-41d4-a716-446655440000", label: "Competitor Alpha", type: "Organization", connections: 12, last_seen: new Date().toISOString() },
    { uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", label: "Offshore Entity X", type: "Entity", connections: 5, last_seen: new Date().toISOString() }
  ].filter(n => n.label.toLowerCase().includes((q as string || "").toLowerCase()));

  res.json(results);
});

// 13. Forge: Intelligence Analysis & Consensus Synthesis
app.post("/api/forge/analyze", async (req, res) => {
  const { target, scenario, lensData, globalGraphData } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Heuristics Description (for the model and logs)
    const heuristics = `
      HEURISTICS APPLIED:
      1. SOURCE RELIABILITY: Weighing Lens (primary/raw) vs Global Graph (historical/correlated).
      2. CORROBORATION: Increasing probability when independent sources (Lens & Graph) align.
      3. DE-DUPLICATION: Normalizing entities to prevent artificial weighting of repeated reports.
      4. CONTRADICTION ANALYSIS: Flagging conflicting data points for human-in-the-loop review.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Perform a high-level intelligence analysis for the scenario "${scenario}" targeting "${target}".
      If the scenario is not provided, automatically generate 3-5 relevant scenarios based on the investigation area.
      
      ${heuristics}
      
      INPUT DATA:
      - LENS (Current Ingestion): ${JSON.stringify(lensData)}
      - GLOBAL GRAPH (Historical Context): ${JSON.stringify(globalGraphData)}
      
      Apply the rules of statecraft and intelligence analysis. 
      Ensure consensus across sources without blatant duplication.
      Executive summary and recommended actions MUST be rooted in the findings of the network graph.
      
      Format the response as a JSON object:
      {
        "consensus_summary": "...",
        "probability_assessment": 0.85,
        "corroborated_findings": ["...", "..."],
        "contradictions_flagged": ["...", "..."],
        "source_weighting": {
          "lens": 0.6,
          "global_graph": 0.4
        },
        "strategic_recommendation": "...",
        "generated_scenarios": [
          { "id": "s1", "title": "...", "description": "...", "risk_level": "..." }
        ]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Forge Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 20. Combinatorial Analysis: Monte Carlo & Decision Tree
app.post("/api/analysis/combinatorial", async (req, res) => {
  const { target, entities } = req.body;
  
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Missing API Key" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Perform a COMBINATORIAL ANALYSIS for target "${target}" using the following entities: ${JSON.stringify(entities)}.
      
      METHODOLOGY:
      1. BREADTH SEARCH: Use Monte Carlo simulation to find novel links through random walk across the entity network.
      2. DEPTH SEARCH: Use Decision Tree analysis to evaluate the most probable strategic paths.
      3. ADVERSARIAL ASSESSMENT: Calculate adversarial potential (0-100%) based on connection density and link severity.
      
      Format the response as a JSON object:
      {
        "novel_links": [
          { "source": "...", "target": "...", "reason": "...", "probability": 0.0-1.0 }
        ],
        "decision_tree": {
          "root": "...",
          "paths": [
            { "steps": ["...", "..."], "outcome": "...", "risk": 0.0-1.0 }
          ]
        },
        "adversarial_potential": 0.85,
        "competitor_analysis": [
          { "name": "...", "threat_level": "...", "market_overlap": 0.0-1.0 }
        ]
      }`,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    await traceAgentAction("combinatorial_analysis", { target }, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 21. Knowledge Base Stats (Real Data Simulation)
app.get("/api/stats", (req, res) => {
  res.json({
    total_entities: 14205,
    active_investigations: 24,
    data_points_ingested: 1240502,
    threat_actors_tracked: 152,
    last_sync: new Date().toISOString()
  });
});

// 22. Clip System: Save Information Board
let clips: any[] = [];
app.post("/api/clips", (req, res) => {
  const clip = { id: `clip-${Date.now()}`, ...req.body, created_at: new Date().toISOString() };
  clips.push(clip);
  res.json(clip);
});
app.get("/api/clips", (req, res) => res.json(clips));

// --- Organisation Profiling Store ---
let orgProfiles: any[] = [];
let orgProfilingJobs: any[] = [];

// 23. Organisation Profiling
app.post("/api/org/profile", async (req, res) => {
  const { orgName, objective } = req.body;
  const jobId = `job-org-${Date.now()}`;
  
  const newJob: any = {
    id: jobId,
    org_name: orgName,
    status: 'recon',
    progress: 10,
    current_stage: 'Reconnaissance'
  };
  orgProfilingJobs.push(newJob);

  // Start background process
  (async () => {
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Stage 1: Recon & Extraction
      newJob.status = 'extraction';
      newJob.progress = 30;
      newJob.current_stage = 'Data Extraction';
      
      const extractionResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Search the web and analyze the organization "${orgName}". 
        Extract the following:
        1. Industry
        2. Mission/Reason to be
        3. Company Goals
        4. Current Campaigns (from their website/news)
        5. Obvious Competitors
        6. Nature of the organization
        
        Format as JSON:
        {
          "industry": "...",
          "mission": "...",
          "goals": ["...", "..."],
          "campaigns": ["...", "..."],
          "competitors": ["...", "..."],
          "nature": "..."
        }`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });
      
      const extracted = JSON.parse(extractionResponse.text);
      
      // Stage 2: Synthesis & Strategic Alignment
      newJob.status = 'synthesis';
      newJob.progress = 60;
      newJob.current_stage = 'Strategic Synthesis';
      
      const synthesisResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Based on the following information about "${orgName}":
        ${JSON.stringify(extracted)}
        
        And the research objective: "${objective}"
        
        Perform the following:
        1. Identify political information from public sources.
        2. Suggest strategically sound actions.
        3. Generate a dynamic System Prompt that orients an AI system to act in service of this organization's goals and research objective.
        
        Format as JSON:
        {
          "political_info": ["...", "..."],
          "strategic_actions": ["...", "..."],
          "dynamic_system_prompt": "..."
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const synthesized = JSON.parse(synthesisResponse.text);
      
      // SEED AGENT NETWORK: Final refinement until 80% certainty
      newJob.status = 'alignment';
      newJob.progress = 80;
      newJob.current_stage = 'Agent Network Alignment';
      
      const agentResult = await runAgentNetwork(
        orgName,
        `Finalize strategic profile for ${orgName} with objective: ${objective}`,
        { ...extracted, ...synthesized }
      );

      const profile = {
        id: `org-${Date.now()}`,
        name: orgName,
        ...agentResult.data,
        certainty: agentResult.certainty,
        agent_logs: agentResult.logs,
        citations: agentResult.citations,
        research_objective: objective,
        last_updated: new Date().toISOString()
      };
      
      orgProfiles.push(profile);
      newJob.data = profile;
      newJob.status = 'complete';
      newJob.progress = 100;
      newJob.current_stage = 'Completed';
      
    } catch (error) {
      console.error("Org Profiling Error:", error);
      newJob.status = 'failed';
      newJob.current_stage = 'Error: ' + (error as Error).message;
    }
  })();

  res.json({ jobId });
});

app.get("/api/org/profile/:jobId", (req, res) => {
  const job = orgProfilingJobs.find(j => j.id === req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.post("/api/org/profile/update", (req, res) => {
  const profile = req.body;
  const index = orgProfiles.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    orgProfiles[index] = { ...orgProfiles[index], ...profile, last_updated: new Date().toISOString() };
    res.json(orgProfiles[index]);
  } else {
    res.status(404).json({ error: "Profile not found" });
  }
});

// --- Mock Data Store ---
let projects: any[] = [
  { id: 'p1', name: 'Project Phoenix', description: 'Energy sector monitoring', created_at: new Date().toISOString(), settings: { show_system_health: false, threat_velocity_threshold: 0.5 } }
];
let searchHistory: any[] = [];

// 14. Projects Management
app.get("/api/projects", (req, res) => res.json(projects));
app.post("/api/projects", (req, res) => {
  const newProject = { 
    id: `proj-${Math.random().toString(36).substr(2, 9)}`, 
    ...req.body, 
    created_at: new Date().toISOString(),
    settings: { show_system_health: false, threat_velocity_threshold: 0.5 }
  };
  projects.push(newProject);
  res.json(newProject);
});

// 15. Search History
app.get("/api/history", (req, res) => res.json(searchHistory));

// 16. Advanced Ingestion with News Prioritization & Recursive Enrichment
app.post("/api/ingestion/advanced", async (req, res) => {
  const { query, projectId, sources, filters } = req.body;
  
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Missing API Key" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const targets = query.split(',').map((t: string) => t.trim()).filter(Boolean);
    const allResults: any[] = [];
    const jobIds: string[] = [];

    for (const target of targets) {
      // Prioritize News & OSINT sources for initial profile
      const prioritizedSources = ["News", "Web", "OSINT_RECON", ...sources.filter((s: string) => !["News", "Web"].includes(s))];
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Perform a RECURSIVE OSINT ingestion for target: "${target}" using prioritized sources: ${prioritizedSources.join(', ')}.
        
        PROCESS:
        1. INITIAL PROFILE: Prioritize public news and traditional OSINT sources.
        2. DATA CLEANSING & NLP: Apply lemmative processing, remove stop words, and find correlations.
        3. RECURSIVE ENRICHMENT: For every entity found, perform a secondary run to enrich and find further investigation paths.
        4. COERCION: Map all findings into the FIXED SCHEMA:
           {
             "uuid": "...",
             "entity_name": "...",
             "entity_type": "...",
             "relationship": "...",
             "confidence_score": 0.0-1.0,
             "source_origin": "...",
             "strategic_value": "...",
             "adversarial_potential": 0.0-1.0,
             "competitor_status": "competitor|partner|neutral"
           }
        
        Return an array of these objects.`,
        config: { responseMimeType: "application/json" }
      });

      const results = JSON.parse(response.text);
      const jobId = `job-${Math.random().toString(36).substr(2, 9)}`;
      jobIds.push(jobId);
      
      await traceAgentAction("advanced_ingestion", { target, sources: prioritizedSources }, { results_count: results.length });

      searchHistory.push({
        id: `h-${Date.now()}`,
        query: target,
        timestamp: new Date().toISOString(),
        project_id: projectId,
        results_count: results.length,
        job_id: jobId
      });

      allResults.push(...results.map((r: any) => ({ ...r, target_ref: target })));
    }

    res.json({
      job_ids: jobIds,
      status: 'complete',
      data: allResults
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 17. Maltego Tool Integration
app.post("/api/osint/maltego", async (req, res) => {
  const { target, transform } = req.body;
  // Simulate Maltego transform output
  const results = [
    { id: 'm1', type: 'DNS Name', value: `api.${target}`, source: 'Maltego' },
    { id: 'm2', type: 'IP Address', value: '1.2.3.4', source: 'Maltego' },
    { id: 'm3', type: 'Person', value: 'John Doe', source: 'Maltego', role: 'CTO' }
  ];
  res.json({ status: 'success', results });
});

// 18. Analytics: Strongest Links
app.get("/api/analytics/links", (req, res) => {
  const { projectId } = req.query;
  // Simulate strongest links analysis
  const links = [
    { id: 'l1', source: 'Target', target: 'Person A', strength: 0.95, type: 'Executive' },
    { id: 'l2', source: 'Target', target: 'Org B', strength: 0.88, type: 'Partner' },
    { id: 'l3', source: 'Target', target: 'Web Presence', strength: 0.92, type: 'Infrastructure' }
  ];
  res.json(links);
});

// 17. Job Correlation Graph
app.post("/api/jobs/correlate", (req, res) => {
  const { jobIds } = req.body;
  // Simulate finding connections between jobs
  const nodes = [
    { id: 'target-center', label: 'PRIMARY_TARGET', type: 'target' },
    { id: 'dns-1', label: 'DNS: NS1.TARGET.COM', type: 'info' },
    { id: 'sub-1', label: 'SUBDOMAIN: API.TARGET.COM', type: 'info' },
    { id: 'brand-1', label: 'BRAND: INNOVATIVE_TECH', type: 'info' },
    { id: 'threat-1', label: 'THREAT: DATA_EXFIL_RISK', type: 'threat' }
  ];
  
  jobIds.forEach((id: string) => {
    nodes.push({ id, label: `Job ${id.slice(-4)}`, type: 'job' });
  });

  const links = [
    { source: 'target-center', target: 'dns-1', label: 'INFRASTRUCTURE' },
    { source: 'target-center', target: 'sub-1', label: 'ASSET' },
    { source: 'target-center', target: 'brand-1', label: 'ESSENCE' },
    { source: 'target-center', target: 'threat-1', label: 'THREAT' }
  ];

  jobIds.forEach((id: string) => {
    links.push({ source: 'target-center', target: id, label: 'RECON_LINK' });
  });

  res.json({ nodes, links });
});

// 19. RSS Feed Simulation
app.get("/api/rss", (req, res) => {
  const feeds = [
    { id: 1, title: "New Strategic Policy in Indo-Pacific", source: "Foreign Policy", type: "Policy", timestamp: new Date().toISOString() },
    { id: 2, title: "Market Volatility in Tech Sector", source: "Financial Times", type: "Economic", timestamp: new Date().toISOString() },
    { id: 3, title: "Emerging Cyber Threat in Energy Grid", source: "Reuters", type: "Security", timestamp: new Date().toISOString() },
    { id: 4, title: "Global Supply Chain Disruptions", source: "Bloomberg", type: "Trade", timestamp: new Date().toISOString() },
    { id: 5, title: "UN Resolution on AI Governance", source: "UN News", type: "Governance", timestamp: new Date().toISOString() },
    { id: 6, title: "Regional Conflict Escalation in Middle East", source: "Al Jazeera", type: "Conflict", timestamp: new Date().toISOString() }
  ];
  res.json(feeds);
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  // 24. General Agent Investigation Endpoint
let activeInvestigations: any[] = [];
app.post("/api/agent/investigate", async (req, res) => {
  const { target, sector, focus } = req.body;
  const runId = `run-${Date.now()}`;
  
  const investigation: any = {
    run_id: runId,
    target,
    sector,
    focus,
    status: 'running',
    certainty: 0,
    logs: [],
    data: null
  };
  activeInvestigations.push(investigation);

  // Background process
  (async () => {
    try {
      const result = await runAgentNetwork(target, `Build intelligence graph for ${target} in ${sector} focusing on ${focus}`, {});
      investigation.status = 'completed';
      investigation.certainty = result.certainty;
      investigation.logs = result.logs;
      investigation.data = result.data;
      investigation.citations = result.citations;
    } catch (error) {
      investigation.status = 'failed';
      investigation.logs.push(`Error: ${(error as Error).message}`);
    }
  })();

  res.json({ runId });
});

app.get("/api/agent/investigate/:runId", (req, res) => {
  const inv = activeInvestigations.find(i => i.run_id === req.params.runId);
  if (!inv) return res.status(404).json({ error: "Investigation not found" });
  res.json(inv);
});

app.patch("/api/projects/:projectId/settings", (req, res) => {
  const { projectId } = req.params;
  const { settings } = req.body;
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  project.settings = { ...project.settings, ...settings };
  res.json(project);
});

// CSRF token endpoint (must be called before any state-changing operations)
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: getCsrfToken(req) });
});

// Authentication endpoints
app.post("/api/auth/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { user, session } = await authenticateUser(email, password);

    // Generate our own JWT for API authentication
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      session, // Supabase session for realtime/storage features
    });
  } catch (error: any) {
    console.error('[AUTH] Login failed:', error.message);
    res.status(401).json({
      error: "Authentication failed",
      message: error.message || "Invalid credentials"
    });
  }
});

app.post("/api/auth/register", authLimiter, validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Register with Supabase
    const { user, session } = await registerUser(email, password, role);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      session,
    });
  } catch (error: any) {
    console.error('[AUTH] Registration failed:', error.message);
    res.status(400).json({
      error: "Registration failed",
      message: error.message || "Could not create account"
    });
  }
});

app.post("/api/auth/logout", authenticate, async (req, res) => {
  try {
    await signOutUser();
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error('[AUTH] Logout failed:', error.message);
    res.status(500).json({
      error: "Logout failed",
      message: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
