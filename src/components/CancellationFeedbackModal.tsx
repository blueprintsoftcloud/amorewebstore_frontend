import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export interface SurveyItemSnapshot {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

export interface CancellationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  triggerSource?: string;
  orderId?: string;
  items?: SurveyItemSnapshot[];
  totalAmount?: number;
  onSubmitted?: () => void;
}

interface SurveyConfig {
  isEnabled: boolean;
  headerTitle: string;
  urgencyBanner: string;
  question: string;
  options: string[];
  allowCustomNote: boolean;
  customNotePlaceholder: string;
  skipButtonText: string;
  submitButtonText: string;
}

const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  isEnabled: true,
  headerTitle: "Sorry To See You Go..",
  urgencyBanner: "Products In huge demand might run Out of Stock",
  question: "What stopped you from completing your purchase?",
  options: [
    "Found a better deal elsewhere",
    "Technical issues with the website",
    "I changed my mind",
    "Have issues with coupons",
    "Shipping charge too high",
    "Delivery takes too long",
  ],
  allowCustomNote: true,
  customNotePlaceholder: "Others (please specify)",
  skipButtonText: "Skip and exit",
  submitButtonText: "Submit Feedback",
};

export default function CancellationFeedbackModal({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  customerPhone,
  paymentMethod = "ONLINE",
  triggerSource = "CHECKOUT_CANCELLED",
  orderId,
  items = [],
  totalAmount = 0,
  onSubmitted,
}: CancellationFeedbackModalProps) {
  useBodyScrollLock(isOpen);

  const [config, setConfig] = useState<SurveyConfig>(DEFAULT_SURVEY_CONFIG);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch active survey config from backend
  useEffect(() => {
    if (!isOpen) return;

    api
      .get("/purchase-feedback/config")
      .then(({ data }) => {
        if (data && typeof data === "object") {
          setConfig({
            isEnabled: data.isEnabled !== false,
            headerTitle: data.headerTitle || DEFAULT_SURVEY_CONFIG.headerTitle,
            urgencyBanner: data.urgencyBanner || DEFAULT_SURVEY_CONFIG.urgencyBanner,
            question: data.question || DEFAULT_SURVEY_CONFIG.question,
            options:
              Array.isArray(data.options) && data.options.length > 0
                ? data.options
                : DEFAULT_SURVEY_CONFIG.options,
            allowCustomNote: data.allowCustomNote !== false,
            customNotePlaceholder:
              data.customNotePlaceholder || DEFAULT_SURVEY_CONFIG.customNotePlaceholder,
            skipButtonText: data.skipButtonText || DEFAULT_SURVEY_CONFIG.skipButtonText,
            submitButtonText:
              data.submitButtonText || DEFAULT_SURVEY_CONFIG.submitButtonText,
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const isOthersSelected =
    selectedReasons.some((r) => r.toLowerCase().includes("other")) ||
    config.allowCustomNote;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedReasons.length === 0 && !customNote.trim()) {
      toast.error("Please select a reason or write a quick note.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/purchase-feedback", {
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        triggerSource,
        orderId,
        items,
        totalAmount,
        selectedReasons,
        customNote: customNote.trim(),
      });

      toast.success("Thank you for your feedback!", { icon: "🙏" });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!config.isEnabled) return null;

  const hasSelections = selectedReasons.length > 0 || customNote.trim().length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[151] overflow-y-auto p-4 flex min-h-full items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{
                type: "spring",
                damping: 26,
                stiffness: 350,
                mass: 0.8,
              }}
              className="pointer-events-auto relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 transition-shadow"
            >
              {/* Header Bar */}
              <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {config.headerTitle}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Urgency Highlight Banner */}
              {config.urgencyBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.2 }}
                  className="mx-6 mb-4 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold"
                >
                  <span className="line-clamp-2 leading-relaxed">
                    {config.urgencyBanner.replace(/^✨\s*/, "")}
                  </span>
                </motion.div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-3">
                    {config.question}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scroll">
                    {config.options.map((option) => {
                      const isChecked = selectedReasons.includes(option);
                      return (
                        <label
                          key={option}
                          onClick={() => toggleReason(option)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none ${
                            isChecked
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.01]"
                              : "bg-gray-50/70 hover:bg-gray-100/80 border-gray-200 text-gray-800 hover:scale-[1.005]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isChecked
                                ? "bg-white border-white text-slate-900"
                                : "border-gray-400 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="leading-snug">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Note / Others Input */}
                {isOthersSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <textarea
                      rows={2}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder={config.customNotePlaceholder}
                      className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition resize-none"
                    />
                  </motion.div>
                )}

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={submitting || !hasSelections}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {config.submitButtonText}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-2xl border border-gray-200 hover:bg-gray-100 text-gray-600 py-2.5 text-xs font-semibold transition cursor-pointer"
                  >
                    {config.skipButtonText}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
