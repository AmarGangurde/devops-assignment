const OpenAI = require('openai');
const { getSchema } = require('./db');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Cache schema for 5 minutes to avoid repeated DB introspection
let schemaCache = null;
let schemaCacheTime = 0;
const SCHEMA_CACHE_TTL = 5 * 60 * 1000;

async function getCachedSchema() {
  if (schemaCache && Date.now() - schemaCacheTime < SCHEMA_CACHE_TTL) {
    return schemaCache;
  }
  schemaCache = await getSchema();
  schemaCacheTime = Date.now();
  return schemaCache;
}

function schemaToText(schema) {
  if (!schema || Object.keys(schema).length === 0) {
    return 'No tables found in the database.';
  }
  return Object.entries(schema)
    .map(([table, cols]) => {
      const colDefs = cols.map(c => `  ${c.column} (${c.type}${c.nullable ? ', nullable' : ''})`).join('\n');
      return `Table: ${table}\nColumns:\n${colDefs}`;
    })
    .join('\n\n');
}

/**
 * Convert natural language to SQL using an LLM.
 * @param {string} naturalLanguageQuery
 * @param {Array} history - [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<{sql: string, chartType: string|null, explanation: string}>}
 */
async function nlToSql(naturalLanguageQuery, history = []) {
  const schema = await getCachedSchema();
  const schemaText = schemaToText(schema);

  const systemPrompt = `You are SupaChat, an expert SQL analyst for a blog analytics PostgreSQL database.

DATABASE SCHEMA:
${schemaText}

Your job is to convert natural language questions into precise PostgreSQL SQL queries.

IMPORTANT RULES:
1. Only generate SELECT queries. Never INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.
2. Always limit results to maximum 1000 rows unless user asks for specific count.
3. Use proper PostgreSQL syntax with date/time functions.
4. For trend queries, use date_trunc() for time grouping.
5. Always alias columns clearly (e.g., COUNT(*) AS total_views).

RESPONSE FORMAT — always respond with valid JSON:
{
  "sql": "SELECT ...",
  "explanation": "This query...",
  "chartType": "line" | "bar" | "pie" | "table" | null
}

chartType selection guide:
- "line": time-series trends, daily/weekly/monthly data
- "bar": comparisons between categories
- "pie": distribution/percentage breakdowns
- "table": detailed records, multi-column results
- null: simple scalar results (single number)`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6), // last 3 exchanges for context
    { role: 'user', content: naturalLanguageQuery },
  ];

  logger.info('Calling LLM for NL-to-SQL', { query: naturalLanguageQuery, model: MODEL });

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  logger.info('LLM response received', { raw });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`LLM returned invalid JSON: ${raw}`);
  }

  if (!parsed.sql) {
    throw new Error('LLM did not return a SQL query');
  }

  // Safety: block non-SELECT queries
  const trimmed = parsed.sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed');
  }

  return {
    sql: parsed.sql,
    chartType: parsed.chartType || 'table',
    explanation: parsed.explanation || '',
  };
}

module.exports = { nlToSql };
