import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
//@ts-ignore
import Onboarding from 'react-native-onboarding-swiper';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { defaultStorage } from '../../api/client/storage';
import SignInModal from '../../components/SignInModal';

export default function AssistantOnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const handleDone = () => {
    console.log('✅ Onboarding completed - setting flag');
    defaultStorage.setBoolean('hasSeenOnboarding', true);
    setShowAuthModal(true);
  };

  useEffect(() => {
    if (shouldNavigate && !showAuthModal) {
      router.replace('/(tabs)');
    }
  }, [shouldNavigate, showAuthModal]);

  const styledImage = (img: any) => (
    <Image source={img} style={{ width: 280, height: 280, resizeMode: 'contain' }} />
  );

  return (
    <>
      <Onboarding
        onDone={handleDone}
        onSkip={handleDone}
        containerStyles={{ backgroundColor: theme.colors.primary }}
        titleStyles={{
          fontFamily: 'Outfit_700Bold',
          color: theme.colors.text.primary,
          fontSize: 22,
        }}
        subTitleStyles={{
          fontFamily: 'Outfit_400Regular',
          color: theme.colors.text.secondary,
          fontSize: 15,
        }}
        pages={[
          {
            backgroundColor: theme.colors.primary,
            image: styledImage(require('../../assets/onboarding/ahmadahminahwelcome.png')),
            title: 'Welcome to Rihlah',
            subtitle: "I'm Ahmad the Assistant. Let me show you around.",
          },
          {
            backgroundColor: theme.colors.primary,
            image: styledImage(require('../../assets/onboarding/ahmadprayerQuran.png')),
            title: 'Prayer & Quran',
            subtitle: 'Track daily prayers and continue your Quran journey.',
          },
          {
            backgroundColor: theme.colors.primary,
            image: styledImage(require('../../assets/onboarding/ahmadaminahlocations.png')),
            title: 'Find Halal Spots',
            subtitle: 'Discover halal food, musollahs, bidets, and mosques nearby.',
          },
          {
            backgroundColor: theme.colors.primary,
            image: styledImage(require('../../assets/onboarding/ahmadahminahwelcome.png')),
            title: "Let's Get Started",
            subtitle: 'Log in or create an account to save your Rihlah experience.',
          },
        ]}
      />

      <SignInModal
        visible={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setShouldNavigate(true);
        }}
        allowGuest={true}
      />
    </>
  );
}