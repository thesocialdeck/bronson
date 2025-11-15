import { useState, useEffect } from 'react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { CheckSquare, Edit3, Trash2, Loader2 } from 'lucide-react';
import { getPendingInboxItems } from '~/lib/markdown.server';
import { toast } from '~/components/shared/Toast';
import type { InboxItem, ParseResponse } from '~/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const items = await getPendingInboxItems();
  return json({ items });
}

export default function ReviewRoute() {
  const { items: initialItems } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [parsing, setParsing] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Parse items when component mounts
  useEffect(() => {
    parseAllItems();
  }, []);

  const parseAllItems = async () => {
    const unparsedItems = items.filter(item => !item.parsed);

    for (const item of unparsedItems) {
      setParsing(prev => new Set(prev).add(item.id));

      try {
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: item.rawText }),
        });

        if (response.ok) {
          const parseResult: ParseResponse = await response.json();

          // Update item with parsed data
          await fetch('/api/inbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update',
              id: item.id,
              data: {
                parsed: parseResult,
                parsedAt: new Date().toISOString(),
              },
            }),
          });

          // Update local state
          setItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? { ...i, parsed: parseResult, parsedAt: new Date().toISOString() }
                : i
            )
          );
        }
      } catch (error) {
        console.error('Parse error:', error);
      } finally {
        setParsing(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map(i => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const approveItem = async (item: InboxItem) => {
    if (!item.parsed) return;

    setProcessing(true);
    try {
      // Save the parsed data
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: item.parsed.action,
          type: item.parsed.type,
          data: item.parsed.data,
          newActivityType: item.parsed.newActivityType,
          relatedActions: item.parsed.relatedActions,
        }),
      });

      if (response.ok) {
        // Mark as approved
        await fetch('/api/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: item.id,
            data: {
              status: 'approved',
              reviewedAt: new Date().toISOString(),
            },
          }),
        });

        // Remove from list
        setItems(prev => prev.filter(i => i.id !== item.id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });

        toast.success('Approved! ✓');
      }
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const approveSelected = async () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id) && i.parsed);

    setProcessing(true);
    for (const item of selectedItems) {
      await approveItem(item);
    }
    setProcessing(false);
    deselectAll();
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });

      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const deleteSelected = async () => {
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      await deleteItem(id);
    }
    deselectAll();
  };

  const editItem = (item: InboxItem) => {
    // Navigate to add modal with pre-filled text
    navigate(`/add?text=${encodeURIComponent(item.rawText)}&inboxId=${item.id}`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'border-emerald-200 bg-emerald-50';
    if (confidence >= 60) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-700';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Sort by confidence (high first)
  const sortedItems = [...items].sort((a, b) => {
    const aConf = a.parsed?.confidence || 0;
    const bConf = b.parsed?.confidence || 0;
    return bConf - aConf;
  });

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All caught up!</h2>
          <p className="text-gray-600 mb-6">
            No items to review. Use Quick Add to capture things for later.
          </p>
          <button
            onClick={() => navigate('/add')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Quick Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📥 Review ({items.length})
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quick tick and flick through your captured items
            </p>
          </div>
        </div>

        {/* Batch Actions */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <button
              onClick={selectedIds.size === items.length ? deselectAll : selectAll}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
            </button>

            {selectedIds.size > 0 && (
              <>
                <div className="h-4 w-px bg-gray-300" />
                <button
                  onClick={approveSelected}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckSquare className="w-4 h-4" />
                  Approve {selectedIds.size}
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedIds.size}
                </button>
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border-2 transition-all ${
                item.parsed
                  ? getConfidenceColor(item.parsed.confidence)
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Checkbox + Original Text */}
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-300"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 italic">"{item.rawText}"</p>
                </div>
              </div>

              {/* Parsed Preview or Loading */}
              {parsing.has(item.id) ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 ml-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </div>
              ) : item.parsed ? (
                <div className="ml-8 space-y-2">
                  {/* Confidence Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(item.parsed.confidence)}`}>
                    {item.parsed.confidence >= 80 && '✓'}
                    {item.parsed.confidence >= 60 && item.parsed.confidence < 80 && '⚠️'}
                    {item.parsed.confidence < 60 && '!'}
                    <span>{item.parsed.confidence}% confident</span>
                  </div>

                  {/* Parsed Fields */}
                  <div className="text-sm space-y-1">
                    {item.parsed.type === 'event' && (
                      <>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="font-medium">👤 {item.parsed.data.person}</span>
                          <span>•</span>
                          <span>🏷️ {item.parsed.data.activity}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          {item.parsed.data.date && (
                            <>
                              <span>📅 {item.parsed.data.date}</span>
                              <span>•</span>
                            </>
                          )}
                          {item.parsed.data.day && (
                            <>
                              <span>🔄 {item.parsed.data.day}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>🕐 {item.parsed.data.time}</span>
                        </div>
                      </>
                    )}
                    {item.parsed.type === 'contact' && (
                      <div className="text-gray-700">
                        <span className="font-medium">👤 {item.parsed.data.name}</span>
                        {item.parsed.data.relation && (
                          <span className="text-gray-600"> • {item.parsed.data.relation}</span>
                        )}
                      </div>
                    )}
                    {item.parsed.type === 'checklist' && (
                      <div className="text-gray-700">
                        <span className="font-medium">✓ {item.parsed.data.title}</span>
                        {item.parsed.data.person && (
                          <span className="text-gray-600"> • {item.parsed.data.person}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => approveItem(item)}
                      disabled={processing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => editItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ml-8 text-sm text-gray-500">
                  ⚠️ Couldn't parse - tap Edit to review
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
