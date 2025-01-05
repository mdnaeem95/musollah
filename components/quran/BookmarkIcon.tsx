import React, { useRef, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';

interface BookmarkIconProps {
    isBookmarked: boolean;
    onToggle: () => void;
    size?: number; // Optional size for the icon
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ isBookmarked, onToggle, size = 40 }) => {
    const animation = useRef<LottieView>(null);

    useEffect(() => {
        if (isBookmarked) {
            animation.current?.play(0, 60); // Play animation for bookmarked state
        } else {
            animation.current?.reset(); // Reset animation for unbookmarked state
        }

        // Stop the animation on the last frame after it finishes
        setTimeout(() => {
            animation.current?.pause(); // Pause the animation on the last frame
        }, 1000); // Adjust based on your animation duration
    }, [isBookmarked]);

    return (
        <TouchableOpacity onPress={onToggle} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <LottieView
                ref={animation}
                source={require('../../assets/animations/bookmark.json')} // Adjust the path
                loop={false}
                style={{ width: size, height: size }}
            />
        </TouchableOpacity>
    );
};

export default BookmarkIcon;
