import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loader2 } from 'lucide-react'; // Added Loader2

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Check if Firebase is properly configured
const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY &&
    !import.meta.env.VITE_FIREBASE_API_KEY.includes('YOUR_');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        if (isFirebaseConfigured) {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                try {
                    setUser(user);
                    if (user) {
                        setProfileLoading(true);
                        const docRef = doc(db, 'users', user.uid);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            setProfile(docSnap.data());
                        } else {
                            const initialData = {
                                email: user.email,
                                isPremium: false,
                                onboardingCompleted: false,
                                createdAt: new Date(),
                            };
                            await setDoc(docRef, initialData);
                            setProfile(initialData);
                        }
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("Auth State Check Error:", error);
                    setProfile(null);
                } finally {
                    setLoading(false);
                    setProfileLoading(false);
                }
            });
            return unsubscribe;
        } else {
            // MOCK_MODE: Load mock user from localStorage
            const mockSession = localStorage.getItem('fitai_mock_session');
            if (mockSession) {
                const sessionData = JSON.parse(mockSession);
                setUser(sessionData.user);
                setProfile(sessionData.profile);
            }
            setLoading(false);
        }
    }, []);

    const loginWithGoogle = async () => {
        if (isFirebaseConfigured) {
            return signInWithPopup(auth, googleProvider);
        } else {
            // Mock Login
            const mockUser = { uid: 'mock-123', email: 'test@example.com', displayName: 'Usuario FitAI' };
            const mockProfile = { isPremium: true, email: 'test@example.com' };
            localStorage.setItem('fitai_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
            setUser(mockUser);
            setProfile(mockProfile);
            return { user: mockUser };
        }
    };

    const loginWithEmail = async (email, password) => {
        if (isFirebaseConfigured) {
            return signInWithEmailAndPassword(auth, email, password);
        } else {
            // Any email/password is valid in Mock Mode
            const mockUser = { uid: 'mock-123', email, displayName: email.split('@')[0] };
            const mockProfile = { isPremium: true, email };
            localStorage.setItem('fitai_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
            setUser(mockUser);
            setProfile(mockProfile);
            return { user: mockUser };
        }
    };

    const signupWithEmail = async (email, password, displayName) => {
        if (isFirebaseConfigured) {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) {
                await updateProfile(result.user, { displayName });
            }
            return result;
        } else {
            const mockUser = { uid: 'mock-123', email, displayName };
            const mockProfile = { isPremium: true, email };
            localStorage.setItem('fitai_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
            setUser(mockUser);
            setProfile(mockProfile);
            return { user: mockUser };
        }
    };

    const resetPassword = async (email) => {
        if (isFirebaseConfigured) {
            return sendPasswordResetEmail(auth, email);
        }
        return true;
    };

    const logout = async () => {
        if (isFirebaseConfigured) {
            await signOut(auth);
        }
        localStorage.removeItem('fitai_mock_session');
        setUser(null);
        setProfile(null);
    };

    const updateUserProfile = async (profileData) => {
        if (isFirebaseConfigured) {
            if (!user) {
                console.error("Intento de actualizar perfil sin usuario autenticado");
                throw new Error("Debes iniciar sesión para guardar tu perfil");
            }
            try {
                const docRef = doc(db, 'users', user.uid);
                const newData = { ...profileData };

                // Si hay un cambio de peso, registrar en el historial
                if (profileData.weight && profileData.weight !== profile?.weight) {
                    const weightEntry = {
                        weight: profileData.weight,
                        date: new Date().toISOString(),
                    };
                    newData.weightHistory = [...(profile?.weightHistory || []), weightEntry].slice(-50); // Mantener últimos 50
                    newData.lastWeightUpdate = new Date().toISOString();
                }

                await setDoc(docRef, { ...profile, ...newData }, { merge: true });
                setProfile(prev => ({ ...prev, ...newData }));
            } catch (error) {
                console.error("Error actualizando perfil en Firestore:", error);
                throw error;
            }
        } else {
            // MOCK MODE: Save to localStorage
            const updatedProfile = { ...profile, ...profileData };
            setProfile(updatedProfile);
            const session = JSON.parse(localStorage.getItem('fitai_mock_session') || '{}');
            localStorage.setItem('fitai_mock_session', JSON.stringify({ ...session, profile: updatedProfile }));
        }
    };

    const checkPremium = () => {
        return profile?.isPremium === true;
    };

    const value = {
        user,
        profile,
        loading,
        isPremium: profile?.isPremium || false,
        checkPremium,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        logout,
        updateProfile: updateUserProfile,
        profileLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-slate-950">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                        <p className="text-slate-400 font-medium animate-pulse">Iniciando FitAI...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
