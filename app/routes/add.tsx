import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { X, Sparkles } from 'lucide-react';
import type { ParseResponse } from '~/types';
import { toast } from '~/components/shared/Toast';

export default function AddRoute() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse input');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse input');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: preview.action,
          type: preview.type,
          id: preview.matchedEntry?.id,
          data: preview.data,
          newActivityType: preview.newActivityType,
          relatedActions: preview.relatedActions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const result = await response.json();
      toast.success(result.message || 'Saved successfully! ✨');
      setTimeout(() => navigate(result.redirect || '/'), 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate(-1);
      }}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Quick Add
            </h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {!preview ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you want to remember? Try: 'Oliver has triathlon every Monday at 6am'"
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none resize-none"
              autoFocus
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!input.trim() || loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Parse with AI
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
              <p className="text-lg font-medium text-gray-800 mb-2">
                {preview.confirmationMessage}
              </p>

              {preview.newActivityType && (
                <div className="mt-2 text-sm text-purple-700">
                  Creating new activity type: <strong>{preview.newActivityType.id}</strong>
                </div>
              )}

              {preview.relatedActions && preview.relatedActions.length > 0 && (
                <div className="mt-2 text-sm text-purple-700">
                  <strong>Also creating:</strong>
                  {preview.relatedActions.map((action, idx) => (
                    <div key={idx} className="ml-2">
                      • {action.type === 'contact' && action.data.name
                        ? `${action.data.name} (contact${action.data.birthday ? ' with birthday' : ''})`
                        : `${action.type}`}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <div>
                  <strong>Action:</strong> {preview.action}
                </div>
                <div>
                  <strong>Type:</strong> {preview.type}
                </div>
                <div>
                  <strong>Confidence:</strong> {preview.confidence}%
                </div>
              </div>

              {preview.questions && preview.questions.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    Please clarify:
                  </p>
                  {preview.questions.map((q) => (
                    <div key={q.id} className="text-sm text-yellow-800">
                      {q.question}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                ) : (
                  '✨ Confirm'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
