/**
 * Script code validation based on ISO-15924
 * Uses data generated from IANA language subtag registry
 */
import type { ScriptData } from '../../types';
import { scripts } from '../../data/scripts/db';

const SCRIPT_CODES = new Set(scripts.map((s: ScriptData) => s.code));

/**
 * Validates if a script code is a recognized ISO-15924 script code
 */
export function isValidScriptCode(script: string): boolean {
  if (!script || script.length !== 4) return false;
  const normalized = script[0].toUpperCase() + script.slice(1).toLowerCase();
  return SCRIPT_CODES.has(normalized);
}

/**
 * Normalizes a script code to proper title case format
 * Returns null if the script code is invalid
 */
export function normalizeScriptCode(script: string): string | null {
  if (!script || script.length !== 4) return null;
  const normalized = script[0].toUpperCase() + script.slice(1).toLowerCase();
  return isValidScriptCode(normalized) ? normalized : null;
}

/**
 * Get the script data for a given script code
 * Returns null if the script code is invalid
 */
export function getScriptData(script: string): ScriptData | null {
  const normalized = normalizeScriptCode(script);
  if (!normalized) return null;
  return scripts.find((s: ScriptData) => s.code === normalized) || null;
} 