import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "success", duration = 3000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "90vw", width: "400px" }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const colors = {
    success: {
      bg: "var(--success-muted)",
      border: "var(--success)",
      text: "var(--success)",
      icon: "✓",
    },
    error: {
      bg: "var(--destructive-muted)",
      border: "var(--destructive)",
      text: "var(--destructive)",
      icon: "✕",
    },
    info: {
      bg: "var(--accent)",
      border: "var(--primary)",
      text: "var(--primary)",
      icon: "ℹ",
    },
  };

  const color = colors[toast.type];

  return (
    <div
      className="pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-200"
      style={{
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        opacity: isVisible && !isLeaving ? 1 : 0,
        transform: isVisible && !isLeaving ? "translateY(0)" : "translateY(10px)",
      }}
      onClick={() => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(toast.id), 200);
      }}
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          backgroundColor: color.border,
          color: "white",
        }}
      >
        {color.icon}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        {toast.message}
      </span>
    </div>
  );
}
