import React from "react"

// ============================================================
// PROJ-14: Linkify Utility
// Detects URLs in text and renders them as clickable links.
// ============================================================

/**
 * Regex to match URLs in text.
 * Matches http://, https://, and www. prefixed URLs.
 */
const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi

/**
 * Takes a plain text string and returns React elements
 * where URLs are replaced with clickable <a> tags.
 */
export function linkifyText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(URL_REGEX.source, "gi")

  while ((match = regex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    let url = match[0]
    // Add protocol if missing (www. urls)
    const href = url.startsWith("http") ? url : `https://${url}`

    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 break-all"
      >
        {url}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  // If no URLs found, return the original text
  if (parts.length === 0) {
    return [text]
  }

  return parts
}
