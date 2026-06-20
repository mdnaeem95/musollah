import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import AppLayout from './app/_layout'
import { playbackService } from './constants/playbackService'

export default function App() {
    return <AppLayout />
}

registerRootComponent(App);

// Wire the lock-screen / Control Center / notification remote controls to the
// player. Without this the remote Play/Pause/Skip buttons have no handler, so
// pausing from the lock screen never actually pauses the track.
TrackPlayer.registerPlaybackService(() => playbackService);
