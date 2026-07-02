import React from "react";

interface HighlightTextProps {
  text: string;
  highlight: string;
}

/**
 * Renders text with case-insensitive highlighted search query matches.
 * Escapes regex characters to avoid application crashes on special characters.
 */
export const HighlightText: React.FC<HighlightTextProps> = React.memo(({ text, highlight }) => {
  const trimmed = highlight.trim();
  if (!trimmed) return <>{text}</>;

  // Escape special regex characters
  const escaped = trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  
  try {
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <span key={index} className="bg-primary/25 text-primary font-extrabold px-0.5 rounded-sm">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (err) {
    // Fail-safe: return un-highlighted text if regex parsing somehow fails
    return <>{text}</>;
  }
});

HighlightText.displayName = "HighlightText";

export default HighlightText;
