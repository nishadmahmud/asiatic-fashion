"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { uploadReviewMedia, saveProductReview } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { X, Upload, Star, Loader2 } from "lucide-react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const WriteReviewModal = ({ productId, open, onClose, product, onSubmitted }) => {
    const { user, token } = useAuth();
    const { showToast } = useToast();

    // State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const MAX_CHARS = 2000;

    // Get plain text length from HTML content
    const getPlainTextLength = (html) => {
        if (!html) return 0;
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return (temp.textContent || temp.innerText || "").trim().length;
    };

    const charCount = getPlainTextLength(comment);

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files) {
            // Convert FileList to Array and append to existing files
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    // Remove selected file
    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Submit Handler
    const handleSubmit = async () => {
        if (!rating) {
            setError("Please select a rating.");
            return;
        }
        if (!comment || comment === "<p><br></p>") {
            setError("Please write a review.");
            return;
        }

        if (charCount > MAX_CHARS) {
            setError(`Review is too long. Maximum ${MAX_CHARS} characters allowed.`);
            return;
        }

        setError("");
        setLoading(true);

        try {
            let uploadedPaths = [];

            // Step 1: Upload Files (if any)
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach((f) => formData.append("pictures[]", f));
                formData.append("user_id", String(process.env.NEXT_PUBLIC_USER_ID));

                const uploadRes = await uploadReviewMedia(formData, token);

                if (uploadRes?.success && Array.isArray(uploadRes.path)) {
                    uploadedPaths = uploadRes.path.map((p) => p.path);
                } else {
                    throw new Error("Failed to upload media. Please try again.");
                }
            }

            // Step 2: Submit Review Data
            const payload = {
                product_id: productId,
                sales_id: null,
                customer_id: user?.customer_id || user?.id,
                rating: rating,
                comment: comment,
                images: uploadedPaths
            };

            const response = await saveProductReview(payload, token);

            if (response.success) {
                // Success toast
                showToast({ message: "Review submitted successfully!", type: "success" });
                if (typeof onSubmitted === "function") onSubmitted(productId);
                onClose();
                // Reset form
                setRating(0);
                setComment("");
                setFiles([]);
            } else {
                throw new Error(response.message || "Failed to submit review.");
            }

        } catch (err) {
            console.log("Review submission message:", err.message);

            const message = err.message || "An error occurred.";

            // Check for "already reviewed" and show info toast instead of inline error
            if (message.toLowerCase().includes("already reviewed")) {
                showToast({ message: "You have already reviewed this product.", type: "info" });
                if (typeof onSubmitted === "function") onSubmitted(productId);
                onClose();
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Close modal if not open
    if (!open) return null;

    // React Quill Modules
    const modules = {
        toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
        ],
    };

    // Use Portal to render at document body level
    if (typeof window === 'undefined') return null;

    // We need to access createPortal from react-dom
    const { createPortal } = require('react-dom');

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pt-16 sm:pt-0 pb-20 sm:pb-4 p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white w-full h-[calc(100vh-9rem)] sm:h-auto sm:max-h-[75vh] sm:max-w-2xl sm:rounded-lg shadow-xl flex flex-col overflow-hidden rounded-t-2xl sm:rounded-b-lg"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Write a Review</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-md">{product?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto min-h-0">

                    {/* Error/Info Message */}
                    {error && (
                        <div className={`p-3 text-sm rounded border ${error.toLowerCase().includes("already reviewed")
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                            {error}
                        </div>
                    )}

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Overall Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                    type="button"
                                >
                                    <Star
                                        size={32}
                                        className={`${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300 fill-gray-100"}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="quill-wrapper">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--brand-royal-red)] focus-within:border-transparent transition-all">
                            <ReactQuill
                                theme="snow"
                                value={comment}
                                onChange={setComment}
                                modules={modules}
                                placeholder="Share your experience with this product..."
                                className="h-40 mb-12" // mb-12 to account for toolbar
                            />
                        </div>
                        <p className={`text-xs mt-1 text-right ${charCount > MAX_CHARS ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {charCount} / {MAX_CHARS} characters
                        </p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Add Photos & Videos</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <div className="p-3 bg-gray-100 rounded-full text-gray-500">
                                    <Upload size={24} />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Click to upload images or videos</span>
                                <span className="text-xs text-gray-500">Supports JPG, PNG, MP4</span>
                            </div>
                        </div>

                        {/* File Previews */}
                        {files.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {files.map((file, index) => (
                                    <div key={index} className="relative aspect-square bg-gray-100 rounded border border-gray-200 overflow-hidden group">
                                        {file.type.startsWith('video') ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs">
                                                Video
                                            </div>
                                        ) : (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-[var(--brand-royal-red)] text-white font-bold rounded hover:bg-[#a01830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .quill-wrapper .ql-container {
                    border: none !important;
                    font-size: 16px; /* Must be 16px+ to prevent iOS Safari zoom on focus */
                }
                .quill-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    background: #f9fafb;
                }
                .quill-wrapper .ql-editor {
                    min-height: 160px;
                    font-size: 16px; /* Prevent iOS zoom */
                }
                .quill-wrapper .ql-editor.ql-blank::before {
                    font-size: 16px; /* Placeholder text too */
                }
            `}</style>
        </div>,
        document.body
    );
};

export default WriteReviewModal;
