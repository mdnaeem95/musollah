import { useEffect, useState } from 'react';

export const useTypewriter = (text: string, delay = 30): [string, boolean] => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(current));
      current++;
      if (current >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text]);

  return [displayedText, isTyping];
};