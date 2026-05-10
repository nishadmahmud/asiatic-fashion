"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { customerLogin, customerRegister, updateCustomerProfile, updateCustomerPassword } from "@/lib/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
    const [authDrawerMode, setAuthDrawerMode] = useState('login'); // 'login' or 'register'
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

    const openAuthDrawer = (mode = 'login') => {
        setAuthDrawerMode(mode);
        setAuthDrawerOpen(true);
    };

    const closeAuthDrawer = () => {
        setAuthDrawerOpen(false);
    };

    const login = async (identifierOrPayload, password) => {
        try {
            const data = await customerLogin(identifierOrPayload, password);
            if (data.token) {
                setToken(data.token);
                setUser(data.customer);

                localStorage.setItem("token", data.token);
                localStorage.setItem("customer", JSON.stringify(data.customer));
                closeAuthDrawer(); // Close drawer on success
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
    
    const updatePassword = async (passwordData) => {
        try {
            const data = await updateCustomerPassword(token, passwordData);
            if (data.success) {
                return { success: true, message: data.message || "Password changed successfully!" };
            } else {
                return { success: false, message: data.message || "Password update failed" };
            }
        } catch (error) {
            console.error("Password update error:", error);
            return { success: false, message: "An error occurred during password update." };
        }
    }

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("customer");
        router.push("/");
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
            updatePassword,
            authDrawerOpen,
            authDrawerMode,
            openAuthDrawer,
            closeAuthDrawer,
            setAuthDrawerMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
