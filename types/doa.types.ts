export interface DoaAfterPrayer {
  id: string;
  step: number;
  title: string;
  arabicText: string;
  romanized: string;
  englishTranslation: string;
}

export interface DoaItemProps {
  item: DoaAfterPrayer;
  textColor: string;
  secondaryColor: string;
  mutedColor: string;
}

export interface DoaHeaderProps {
  onInfoPress: () => void;
  backgroundColor: string;
  iconColor: string;
}

export interface DoaModalProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor: string;
  textColor: string;
}