/**
 * Category Icons Mapping
 * 
 * Maps food categories to Font Awesome icons.
 */

export const CATEGORY_ICONS: Record<string, string> = {
  'Western': 'burger',
  'Malay': 'bowl-rice',
  'Indian': 'pepper-hot',
  'Chinese': 'dragon',
  'Japanese': 'fish',
  'Korean': 'fire',
  'Middle Eastern': 'mosque',
  'Thai': 'leaf',
  'Indonesian': 'seedling',
  'Fusion': 'wand-magic-sparkles',
  'Cafe': 'mug-hot',
  'Fast Food': 'truck-fast',
  'Dessert': 'ice-cream',
  'Seafood': 'shrimp',
  'Vegetarian': 'carrot',
};

export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category] || 'utensils';
};