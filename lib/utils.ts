import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEventDescription(description: string | undefined | null): string {
  if (!description) return '';

  // Replace HTML line breaks and paragraphs with newlines
  let formatted = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/li>/gi, '')
    .replace(/<li>/gi, '• ')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive newlines
    .trim();

  // Extract and format links
  formatted = formatted.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi,
    (_, href, text) => `[${text}](${href})`
  );

  // Remove any remaining HTML tags
  formatted = formatted.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  formatted = formatted
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  formatted = formatted
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n');

  return formatted;
}
