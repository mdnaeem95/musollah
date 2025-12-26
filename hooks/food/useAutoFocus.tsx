import React from "react";
import { InteractionManager, TextInput } from "react-native";

export default function useAutoFocus(autoFocus = true) {
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      if (inputRef.current) {
        InteractionManager.runAfterInteractions(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [autoFocus, inputRef]);

  return inputRef;
}