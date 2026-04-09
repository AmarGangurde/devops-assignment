const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: QueryResult;
  timestamp: string;
  loading?: boolean;
  error?: string;
}

export interface QueryResult {
  type: 'text' | 'table' | 'chart';
  chartType?: 'line' | 'bar' | 'pie';
  data: any;
  columns?: string[];
  rawRows?: any[];
  summary: string;
  sql?: string;
  rowCount: number;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ message: string; result: QueryResult }> {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function getSchema() {
  const response = await fetch(`${API_URL}/schema`);
  if (!response.ok) throw new Error('Failed to fetch schema');
  return response.json();
}
