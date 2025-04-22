import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

const getStatusColor = (status: any, theme: any) => {
  switch (status.toLowerCase()) {
    case 'ok':
      return theme.colors.text.success;
    case 'caution':
      return theme.colors.accent;
    case 'avoid':
      return theme.colors.text.error;
    default:
      return theme.colors.text.muted;
  }
};

const getStatusIcon = (status: any) => {
  switch (status.toLowerCase()) {
    case 'ok':
      return 'circle-check';
    case 'caution':
      return 'triangle-exclamation';
    case 'avoid':
      return 'circle-xmark';
    default:
      return 'circle-question';
  }
};

export const AnimatedIngredientCard = ({ ingredient, index, theme }: { ingredient: any, index: any, theme: any}) => {
  const color = getStatusColor(ingredient.status, theme);
  console.log(ingredient, color);
  const icon = getStatusIcon(ingredient.status);
  console.log(ingredient, icon);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -10 }}
      transition={{
        delay: index * 100,
        type: 'timing',
        duration: 400,
      }}
      style={[styles.ingredientCard, { backgroundColor: theme.colors.secondary }]}
    >
      <Text style={[styles.ingredientName, { color: theme.colors.text.primary }]}>
        {ingredient.name}
      </Text>

      <View style={[styles.pill, { backgroundColor: color + '20' }]}>
        <FontAwesome6 name={icon} size={14} color={color} />
        <Text style={[styles.pillText, { color }]}>{ingredient.status}</Text>
      </View>

      {ingredient.description && (
        <Text style={[styles.ingredientDesc, { color: theme.colors.text.secondary }]}>
          {ingredient.description}
        </Text>
      )}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  ingredientCard: {
    marginHorizontal: 5,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({ ios: { shadowOpacity: 0.1 }, android: { elevation: 3 } }),
  },
  ingredientName: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  ingredientDesc: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'capitalize',
  },
});
