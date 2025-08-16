// src/hooks/useUnifiedPlayer.js
import { useMemo } from 'react';
import useSpotifyPlayer from './useSpotifyPlayer';
import usePreviewAudio from './usePreviewAudio';

export default function useUnifiedPlayer({ isPremium, getAccessToken }) {
    const spotify = useSpotifyPlayer({ getAccessToken, enabled: !!isPremium });
    const preview = usePreviewAudio();

    const mode = isPremium ? 'sdk' : 'preview';
    const state = isPremium ? spotify.state : preview.state;

    return useMemo(() => ({
        mode,
        state, // { trackUri, isPlaying, progress, duration, title, artist, image }
        toggleTrack: async (uriOrUrl, meta) => {
            if (isPremium) await spotify.toggleTrack(uriOrUrl);
            else await preview.toggleTrack(uriOrUrl, meta);
        },
        seek: async ms => {
            if (isPremium) await spotify.seek(ms);
            else preview.seek(ms);
        },
        togglePause: async () => {
            if (isPremium) await spotify.togglePause();
            else preview.togglePause();
        },
        setVolume: v => {
            if (isPremium) spotify.setVolume(v);
            else preview.setVolume(v);
        }
    }), [isPremium, spotify, preview, state]);
}
