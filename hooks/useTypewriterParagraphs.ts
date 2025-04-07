import { useEffect, useState } from 'react';

/**
 * Splits text into logical chunks and types each paragraph line-by-line.
 */
export const useTypewriterParagraphs = (
  text: string,
  paragraphDelay = 500,
  charDelay = 20
): [string[], boolean] => {
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) return;

    setParagraphs([]);
    setIsTyping(true);

    // 🔍 NEW: Split cleanly by newline or double spaces, NOT capital words like "Allah"
    const chunks = text
      .split(/\n{2,}|\n|\. (?=\w)/g) // split at double newlines or ". " followed by word
      .map(s => s.trim())
      .filter(Boolean);

    let current = 0;

    const typeNextParagraph = () => {
      if (current >= chunks.length) {
        setIsTyping(false);
        return;
      }

      const chunk = chunks[current];
      let typed = '';
      let i = 0;

      const typeChar = () => {
        typed += chunk[i];
        setParagraphs(prev => [...prev.slice(0, current), typed]);

        if (i < chunk.length - 1) {
          i++;
          setTimeout(typeChar, charDelay);
        } else {
          current++;
          setTimeout(typeNextParagraph, paragraphDelay);
        }
      };

      typeChar();
    };

    typeNextParagraph();
  }, [text]);

  return [paragraphs, isTyping];
};