import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

type Props = {
  content: string;
  onTypingEnd?: () => void;
  renderText?: (visibleContent: string) => React.ReactNode;
};

export default function TypewriterText({ content, onTypingEnd, renderText }: Props) {
  const [displayed, setDisplayed] = useState('');
  const speed = 20;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayed(content.slice(0, index));

      if (index >= content.length) {
        clearInterval(interval);
        onTypingEnd?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content]);

  if (renderText) {
    return <>{renderText(displayed)}</>;
  }

  return <Text style={{ fontSize: 16, lineHeight: 22 }}>{displayed}</Text>;
}