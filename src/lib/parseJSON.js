/**
 * Robustly parse AI-generated JSON that may be truncated or wrapped in markdown
 */
export function parseAIJson(text) {
  if (!text) throw new Error('AI 回應為空')

  // Step 1: Strip markdown code fences
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  // Step 2: Try direct parse
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Step 3: Extract first { ... } or [ ... ] block
    const objMatch = cleaned.match(/\{[\s\S]*\}/)
    const arrMatch = cleaned.match(/\[[\s\S]*\]/)
    const match = objMatch || arrMatch
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (e2) {
        // Step 4: Try to fix truncated JSON by closing open brackets
        const fixed = fixTruncatedJson(match[0])
        try {
          return JSON.parse(fixed)
        } catch (e3) {
          throw new Error('JSON 解析失敗，請重新生成。（AI 回應可能被截斷）')
        }
      }
    }
    throw new Error('AI 回應格式錯誤，請重新生成')
  }
}

function fixTruncatedJson(str) {
  // Count open/close braces and brackets to close them
  let fixed = str
  // Remove trailing incomplete string or key
  fixed = fixed.replace(/,?\s*"[^"]*$/, '')
  fixed = fixed.replace(/,?\s*"[^"]*":\s*"[^"]*$/, '')
  fixed = fixed.replace(/,\s*$/, '')

  // Count and close open structures
  const opens = []
  let inString = false
  let escape = false
  for (const ch of fixed) {
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') opens.push('}')
    else if (ch === '[') opens.push(']')
    else if (ch === '}' || ch === ']') opens.pop()
  }

  // Close all open structures in reverse order
  return fixed + opens.reverse().join('')
}
