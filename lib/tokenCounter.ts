/**
 * Simple token counter utility
 * This is a basic approximation - for production use, consider using a proper tokenizer
 */

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Simple approximation: ~4 characters per token for English text
  // This is a rough estimate and may vary based on the actual tokenizer used
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 4);
  
  // Add some overhead for special tokens and formatting
  return Math.max(estimatedTokens, 1);
}

export function calculateTokensPerSecond(tokenCount: number, responseTimeSeconds: number): number {
  if (responseTimeSeconds <= 0) return 0;
  return Math.round((tokenCount / responseTimeSeconds) * 100) / 100; // Round to 2 decimal places
}

export function formatResponseMetrics(responseTimeSeconds: number, tokenCount: number, tokensPerSecond: number): string {
  const responseTimeMs = Math.round(responseTimeSeconds * 1000);
  const tokensPerSec = Math.round(tokensPerSecond);
  
  return `RESPONDED IN ${responseTimeMs}MS (${tokensPerSec} TOKENS/SEC)`;
}
