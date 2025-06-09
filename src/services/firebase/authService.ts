import { auth } from '@/services/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        console.error("Google Sign-In Error:", error.message);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Sign Out Error:", error);
        throw error;
    }
} 