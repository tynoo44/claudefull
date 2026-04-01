// Shared utilities for Edge Functions
import { EdgeFunctionResponse } from './types.ts';

export function createSuccessResponse<T>(data: T): Response {
  const response: EdgeFunctionResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function createErrorResponse(error: string, statusCode = 400): Response {
  const response: EdgeFunctionResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function sanitizeInput(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Trim and limit length
  let sanitized = input.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Basic HTML/script sanitization
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return sanitized;
}

export function logSecurely(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    message,
    // Only log non-sensitive metadata
    metadata: data
      ? {
          userId: data.userId || 'anonymous',
          conversationId: data.conversationId?.substring(0, 8) + '...' || undefined,
          action: data.action || undefined,
          model: data.model || undefined,
          // Never log actual messages or API responses
        }
      : undefined,
  };

  console.log(JSON.stringify(logData));
}

export async function handleCors(request: Request): Promise<Response | null> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  return null;
}
