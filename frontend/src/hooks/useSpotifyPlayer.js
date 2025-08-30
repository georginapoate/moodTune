// src/hooks/useSpotifyPlayer.js
import { useEffect, useRef, useState } from 'react';

export default function useSpotifyPlayer({ getAccessToken, enabled }) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [state, setState] = useState({
        trackUri: null,
        isPlaying: false,
        progress: 0,
        duration: 0,
        title: '',
        artist: '',
        image: ''
    });

    const sdkLoadedRef = useRef(false);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        // load SDK once
        if (!sdkLoadedRef.current) {
            sdkLoadedRef.current = true;
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = async () => {
            const spotifyToken = await getAccessToken(); // MUST be fresh & include 'streaming' + playback scopes

            const p = new window.Spotify.Player({
                name: 'povTunes Player',
                getOAuthToken: async cb => cb(await getAccessToken()),
                volume: 0.8
            });

            p.addListener('ready', ({ device_id }) => {
                setDeviceId(device_id);
                console.log('Spotify Player ready, device ID:', device_id);
            });

            p.addListener('not_ready', ({ device_id }) => {
                console.warn('Device went offline', device_id);
            });

            p.addListener('authentication_error', ({ message }) => {
                console.error('Auth error:', message);
            });

            p.addListener('account_error', ({ message }) => {
                console.error('Account error:', message);
            });

            p.addListener('playback_error', ({ message }) => {
                console.error('Playback error:', message);
            });

            p.addListener('player_state_changed', s => {
                if (!s) return;
                const t = s.track_window.current_track;
                setState({
                    trackUri: t?.uri || null,
                    isPlaying: !s.paused,
                    progress: s.position,
                    duration: s.duration,
                    title: t?.name || '',
                    artist: t?.artists?.map(a => a.name).join(', ') || '',
                    image: t?.album?.images?.[0]?.url || ''
                });
            });

            await p.connect();
            setPlayer(p);
        };

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [enabled, getAccessToken]);

    const playUri = async (deviceIdArg, uri) => {
        const token = await getAccessToken();
        const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdArg}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [uri] })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Spotify play failed ${res.status}: ${txt}`);
        }
    };

    return {
        deviceId,
        player,
        state,
        async toggleTrack(uri) {
            if (!player || !deviceId) return;
            if (state.trackUri === uri && state.isPlaying) {
                await player.pause();
            } else if (state.trackUri === uri && !state.isPlaying) {
                await player.resume();
            } else {
                await playUri(deviceId, uri);
                // `player_state_changed` will update `state` shortly after
            }
        },
        async seek(ms) {
            if (!player) return;
            await player.seek(ms);
        },
        async togglePause() {
            if (!player) return;
            if (state.isPlaying) await player.pause();
            else await player.resume();
        },
        async setVolume(vol) {
            if (player) await player.setVolume(vol); // 0..1
        }
    };
}
