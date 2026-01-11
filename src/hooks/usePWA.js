import { useState, useEffect } from 'react';

export function usePWA() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState({ isIOS: false, isSafari: false });

    useEffect(() => {
        // Detect if already installed (standalone mode)
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;
            setIsInstalled(isStandalone);
        };

        checkInstalled();

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
        setPlatform({ isIOS, isSafari });

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
            console.log('PWA: install prompt saved');
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log(`PWA: User choice outcome: ${outcome}`);
        setInstallPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, isInstalled, platform, installApp };
}
