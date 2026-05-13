"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user, updateProfile, updatePassword } = useAuth();
  
  // Profile Form
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    address: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      let first = user.first_name || "";
      let last = user.last_name || "";
      if (!first && user.name) {
        const parts = String(user.name).trim().split(/\s+/);
        first = parts[0] || "";
        last = parts.slice(1).join(" ");
      }

      const resolvedPhone =
        user.mobile_number ||
        user.phone ||
        user.mobile ||
        user.contact_no ||
        "";

      const resolvedAddress =
        user.address ||
        [user.address_one, user.address_two].filter(Boolean).join(", ") ||
        "";

      setProfileForm({
        first_name: first,
        last_name: last,
        email: user.email || "",
        mobile_number: resolvedPhone,
        address: resolvedAddress
      });
    }
  }, [user]);

  if (!user) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: "", text: "" });

    const res = await updateProfile({
      id: user.id || user.customer_id,
      ...profileForm,
      phone: profileForm.mobile_number // Backend uses phone
    });

    setProfileMessage({
      type: res.success ? "success" : "error",
      text: res.message
    });
    setProfileLoading(false);
    
    if (res.success) {
      setTimeout(() => setProfileMessage({ type: "", text: "" }), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    const res = await updatePassword({
      email: user.email,
      ...passwordForm
    });

    setPasswordMessage({
      type: res.success ? "success" : "error",
      text: res.message
    });
    setPasswordLoading(false);

    if (res.success) {
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
      setTimeout(() => setPasswordMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-bold tracking-widest uppercase text-[#1A1A1A] mb-8 border-b border-[#E5E5E5] pb-4">
        Account Settings
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Profile Details */}
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-6">Personal Information</h3>
          
          {profileMessage.text && (
            <div className={`mb-6 p-4 text-xs font-bold tracking-wide uppercase border ${
              profileMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">First Name</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                  className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Email Address</label>
              <input 
                type="email" 
                required
                disabled
                value={profileForm.email}
                className="w-full h-12 border border-[#E5E5E5] px-4 text-sm bg-[#E5E5E5] text-[#6B6B6B] cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Phone Number</label>
              <input 
                type="tel" 
                required
                value={profileForm.mobile_number}
                onChange={(e) => setProfileForm({...profileForm, mobile_number: e.target.value})}
                className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Default Address</label>
              <textarea 
                value={profileForm.address}
                onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                className="w-full min-h-[100px] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors resize-y"
                placeholder="Enter your delivery address"
              />
            </div>

            <button 
              type="submit" 
              disabled={profileLoading}
              className="h-12 px-8 bg-[#1A1A1A] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Management */}
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-6 pt-10 lg:pt-0 border-t lg:border-t-0 border-[#E5E5E5]">Change Password</h3>
          
          {passwordMessage.text && (
            <div className={`mb-6 p-4 text-xs font-bold tracking-wide uppercase border ${
              passwordMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Current Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#999] mb-2">Confirm New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.new_password_confirmation}
                onChange={(e) => setPasswordForm({...passwordForm, new_password_confirmation: e.target.value})}
                className="w-full h-12 border border-[#E5E5E5] px-4 text-sm focus:outline-none focus:border-[#1A1A1A] bg-[#F8F8F6] focus:bg-white transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={passwordLoading}
              className="h-12 px-8 bg-white border border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold tracking-widest uppercase hover:bg-[#F8F8F6] transition-colors disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
