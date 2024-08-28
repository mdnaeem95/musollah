// courses/[courseId]/modules/layout.tsx
import { Stack } from 'expo-router';

export default function ModulesLayout() {
  return (
    <Stack>
      <Stack.Screen name="[moduleId]" options={{ title: 'Module Details' }} />
    </Stack>
  );
}
