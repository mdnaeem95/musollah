import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

type Props = {
  content: string;
  onTypingEnd?: () => void;
};

export default function TypewriterText({ content, onTypingEnd }: Props) {
  const [displayed, setDisplayed] = useState('');
  const speed = 20;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(content.slice(0, index + 1));
      index++;

      if (index >= content.length) {
        clearInterval(interval);
        onTypingEnd?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content]);

  return <Text style={{ fontSize: 16, lineHeight: 22 }}>{displayed}</Text>;
}
