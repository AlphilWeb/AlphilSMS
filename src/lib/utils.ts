import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

// lib/utils.ts
export class ActionError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'ActionError';
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ActionError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// Optional: Helper function to handle errors in your actions
export function handleActionError(error: unknown): { error: string } {
  if (error instanceof ActionError) {
    return { error: error.message };
  }
  if (error instanceof Error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
  console.error('Unknown error:', error);
  return { error: 'An unknown error occurred' };
}