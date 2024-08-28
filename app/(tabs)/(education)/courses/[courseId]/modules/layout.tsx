// courses/[courseId]/modules/layout.tsx
import { Stack } from 'expo-router';

const ModulesLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[moduleId]" options={{ title: 'Module Details' }} />
    </Stack>
  );
}

export default ModulesLayout