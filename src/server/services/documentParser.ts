import { createRequire } from 'node:module';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

const require = createRequire(import.meta.url);

/** Lazy-load pdf-parse to avoid browser-only deps (e.g. DOMMatrix) at import in test/env. */
function getPdfParse(): (buffer: Buffer) => Promise<{ text: string; numpages: number }> {
  return require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
}
import { callTrackedGemini, ensureTransactionId, LineageInfo } from './llmClient';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../storage/s3Client';
import { Readable } from 'stream';
import crypto from 'crypto';
import type { File as MulterFile } from 'multer';

const CHUNK_SIZE = 2000; // Characters per chunk for Gemini analysis

export interface ParsedDocument {
  filename: string;
  type: 'pdf' | 'docx' | 'txt';
  text: string;
  metadata: {
    pages?: number;
    words: number;
    characters: number;
    uploaded_at: string;
    s3_key?: string;
  };
}

export interface DocumentAnalysis {
  filename: string;
  summary: string;
  key_findings: string[];
  entities: Array<{
    name: string;
    type: string;
    context: string;
  }>;
  risk_score: number;
  recommendations: string[];
  full_text_length: number;
  analyzed_at: string;
  lineage: {
    chunks: LineageInfo[];
    summary: LineageInfo;
  };
}

/**
 * Parse PDF document
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await getPdfParse()(buffer);

    return {
      filename: 'document.pdf',
      type: 'pdf',
      text: data.text,
      metadata: {
        pages: data.numpages,
        words: data.text.split(/\s+/).length,
        characters: data.text.length,
        uploaded_at: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('[PDF Parser] Failed:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse DOCX document
 */
export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      filename: 'document.docx',
      type: 'docx',
      text: result.value,
      metadata: {
        words: result.value.split(/\s+/).length,
        characters: result.value.length,
        uploaded_at: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('[DOCX Parser] Failed:', error);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}

/**
 * Parse text file
 */
export function parseTXT(buffer: Buffer): ParsedDocument {
  const text = buffer.toString('utf-8');

  return {
    filename: 'document.txt',
    type: 'txt',
    text,
    metadata: {
      words: text.split(/\s+/).length,
      characters: text.length,
      uploaded_at: new Date().toISOString()
    }
  };
}

/**
 * Upload document to S3/R2
 */
export async function uploadDocumentToS3(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    // Generate unique key
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const ext = filename.split('.').pop();
    const key = `documents/${Date.now()}-${hash}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'uploaded-at': new Date().toISOString()
      }
    });

    await s3Client.send(command);

    console.log(`[S3 Upload] Uploaded document to: ${key}`);

    return key;
  } catch (error: any) {
    console.error('[S3 Upload] Failed:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Download document from S3/R2
 */
export async function downloadDocumentFromS3(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as Readable;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error('[S3 Download] Failed:', error);
    throw new Error(`S3 download failed: ${error.message}`);
  }
}

/**
 * Analyze document with Gemini AI (chunk by chunk)
 */
export async function analyzeDocument(
  parsed: ParsedDocument,
  apiKey?: string
): Promise<DocumentAnalysis> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    // Split text into chunks
    const chunks = splitIntoChunks(parsed.text, CHUNK_SIZE);

    console.log(`[Document Analysis] Analyzing ${chunks.length} chunks`);

    // Analyze each chunk
    const chunkAnalyses: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      console.log(`[Document Analysis] Processing chunk ${i + 1}/${chunks.length}`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        },
        contents: `Analyze this document excerpt and extract key information:

Chunk ${i + 1}/${chunks.length}:
${chunk}

Return JSON with:
{
  "key_points": ["point 1", "point 2"],
  "entities": [{"name": "entity", "type": "person|org|location|other", "context": "brief context"}],
  "risks": ["risk 1", "risk 2"]
}`
      });

      chunkAnalyses.push(response.text);
    }

    // Synthesize all chunks into final analysis
    const synthesisPrompt = `Synthesize the following chunk analyses into a comprehensive document analysis.

Document Type: ${parsed.type.toUpperCase()}
Pages/Sections: ${chunks.length}

Chunk Analyses:
${chunkAnalyses.map((analysis, i) => `Chunk ${i + 1}:\n${analysis}`).join('\n\n')}

Generate a final comprehensive analysis with:
{
  "summary": "executive summary (200 words max)",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "entities": [{"name": "entity", "type": "person|org|location|other", "context": "context"}],
  "risk_score": 0-100,
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const finalResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      },
      contents: synthesisPrompt
    });

    const analysis = JSON.parse(finalResponse.text);

    return {
      filename: parsed.filename,
      summary: analysis.summary,
      key_findings: analysis.key_findings || [],
      entities: analysis.entities || [],
      risk_score: analysis.risk_score || 0,
      recommendations: analysis.recommendations || [],
      full_text_length: parsed.text.length,
      analyzed_at: new Date().toISOString(),
      lineage: {
        chunks: [],
        summary: { traceId: 'document-analysis', transactionId: 'doc-' + Date.now(), lineageHash: '' }
      }
    };
  } catch (error: any) {
    console.error('[Document Analysis] Failed:', error);
    throw new Error(`Document analysis failed: ${error.message}`);
  }
}

/**
 * Split text into chunks
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const nextPeriod = text.indexOf('. ', end);
      const nextNewline = text.indexOf('\n', end);

      if (nextPeriod !== -1 && nextPeriod < end + 200) {
        end = nextPeriod + 1;
      } else if (nextNewline !== -1 && nextNewline < end + 200) {
        end = nextNewline;
      }
    }

    chunks.push(text.substring(start, end).trim());
    start = end;
  }

  return chunks;
}

/**
 * Process uploaded document: parse, upload to S3, analyze
 */
export async function processDocument(
  file: MulterFile
): Promise<{
  parsed: ParsedDocument;
  s3_key: string;
  analysis: DocumentAnalysis;
}> {
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  let parsed: ParsedDocument;

  // Parse based on file type
  switch (ext) {
    case 'pdf':
      parsed = await parsePDF(file.buffer);
      break;
    case 'docx':
      parsed = await parseDOCX(file.buffer);
      break;
    case 'txt':
      parsed = parseTXT(file.buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }

  parsed.filename = file.originalname;

  // Upload to S3
  const s3_key = await uploadDocumentToS3(file.buffer, file.originalname, file.mimetype);
  parsed.metadata.s3_key = s3_key;

  // Analyze with Gemini
  const analysis = await analyzeDocument(parsed);

  return {
    parsed,
    s3_key,
    analysis
  };
}
