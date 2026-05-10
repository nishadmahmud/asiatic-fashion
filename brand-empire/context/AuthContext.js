"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { customerLogin, customerRegister, updateCustomerProfile } from "@/lib/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
    const router = useRouter();

    // Load user/token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("customer");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const openAuthModal = (mode = 'login') => {
        setAuthModalMode(mode);
        setAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
    };

    const login = async (identifierOrPayload, password) => {
        try {
            const data = await customerLogin(identifierOrPayload, password);
            if (data.token) {
                setToken(data.token);
                setUser(data.customer);

                localStorage.setItem("token", data.token);
                localStorage.setItem("customer", JSON.stringify(data.customer));
                closeAuthModal(); // Close modal on success
                return { success: true };
            } else {
                return { success: false, message: data.message || "Invalid credentials" };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: "An error occurred during login." };
        }
    };

    const register = async (userData) => {
        try {
            const data = await customerRegister(userData);
            if (data.success) {
                // Keep registration and login as two separate steps.
                // Even if backend returns a token, UI should route user to login flow.
                return { success: true, message: data.message || "Registration complete! Please log in." };
            } else {
                return { success: false, message: data.message || "Registration failed" };
            }
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, message: "An error occurred during registration." };
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const data = await updateCustomerProfile(token, profileData);
            if (data.success) {
                // Update local state and storage
                const updatedCustomer = data.data || data.customer;
                const updatedUser = { ...user, ...updatedCustomer };
                setUser(updatedUser);
                localStorage.setItem("customer", JSON.stringify(updatedUser));
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || "Profile update failed" };
            }
        } catch (error) {
            console.error("Profile update error:", error);
            return { success: false, message: "An error occurred during profile update." };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("customer");
        router.push("/"); // Redirect to home (was login page, but now modal based so home is better)
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateProfile,
            authModalOpen,
            authModalMode,
            openAuthModal,
            closeAuthModal,
            setAuthModalMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
