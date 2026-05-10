"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AuthDrawer() {
  const { authDrawerOpen, authDrawerMode, closeAuthDrawer, setAuthDrawerMode, login, register } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    password: "",
    password_confirmation: ""
  });

  if (!authDrawerOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login({ email: loginForm.identifier }, loginForm.password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    
    const res = await register(registerForm);
    if (res.success) {
      setSuccessMsg(res.message);
      setRegisterForm({
        first_name: "",
        last_name: "",
        email: "",
        mobile_number: "",
        password: "",
        password_confirmation: ""
      });
      // Switch to login after a brief delay
      setTimeout(() => {
        setAuthDrawerMode('login');
        setSuccessMsg("");
      }, 2000);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-[90] transition-opacity"
        onClick={closeAuthDrawer}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-[#F8F8F6] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${authDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-8 h-[72px] border-b border-[#E5E5E5] bg-white shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
            {authDrawerMode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button onClick={closeAuthDrawer} className="p-2 -mr-2 text-[#1A1A1A] hover:opacity-70">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-10">
          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-xs font-bold tracking-wide uppercase">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 border border-green-200 bg-green-50 text-green-600 text-xs font-bold tracking-wide uppercase">
              {successMsg}
            </div>
          )}

          {authDrawerMode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({...loginForm, identifier: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                  placeholder="Enter your password"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase mt-4 hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="mt-6 border-t border-[#E5E5E5] pt-6 text-center">
                <span className="text-xs text-[#6B6B6B]">New to Asiatic Fashion? </span>
                <button 
                  type="button" 
                  onClick={() => { setAuthDrawerMode('register'); setError(""); setSuccessMsg(""); }}
                  className="text-xs font-bold text-[#1A1A1A] tracking-wide uppercase hover:underline underline-offset-4"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={registerForm.first_name}
                    onChange={(e) => setRegisterForm({...registerForm, first_name: e.target.value})}
                    className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={registerForm.last_name}
                    onChange={(e) => setRegisterForm({...registerForm, last_name: e.target.value})}
                    className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={registerForm.mobile_number}
                  onChange={(e) => setRegisterForm({...registerForm, mobile_number: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  value={registerForm.password_confirmation}
                  onChange={(e) => setRegisterForm({...registerForm, password_confirmation: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase mt-4 hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <div className="mt-6 border-t border-[#E5E5E5] pt-6 text-center">
                <span className="text-xs text-[#6B6B6B]">Already have an account? </span>
                <button 
                  type="button" 
                  onClick={() => { setAuthDrawerMode('login'); setError(""); setSuccessMsg(""); }}
                  className="text-xs font-bold text-[#1A1A1A] tracking-wide uppercase hover:underline underline-offset-4"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
