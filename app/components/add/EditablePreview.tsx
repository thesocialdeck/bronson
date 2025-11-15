/**
 * Editable Preview Component
 *
 * Allows parents to review and edit parsed data before saving.
 * Shows structured fields that can be edited inline.
 */

import { useState } from 'react';
import { Edit3, Plus, Clock, Calendar, User, Tag, MapPin, FileText, Repeat } from 'lucide-react';
import type { ParseResponse, FamilyMember } from '~/types';

interface EditablePreviewProps {
  preview: ParseResponse;
  originalInput: string;
  onUpdate: (data: any) => void;
  onEditText: () => void;
  familyMembers: FamilyMember[];
}

export function EditablePreview({
  preview,
  originalInput,
  onUpdate,
  onEditText,
  familyMembers,
}: EditablePreviewProps) {
  const [editedData, setEditedData] = useState(preview.data);
  const [showOptional, setShowOptional] = useState({
    location: !!preview.data.location,
    notes: !!preview.data.notes,
    endTime: !!preview.data.endTime,
  });

  const updateField = (field: string, value: any) => {
    const updated = { ...editedData, [field]: value };
    setEditedData(updated);
    onUpdate(updated);
  };

  const isEvent = preview.type === 'event';
  const isContact = preview.type === 'contact';
  const isChecklist = preview.type === 'checklist';

  // Confidence indicator
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* Original Input - Always Visible */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-600 italic flex-1">"{originalInput}"</p>
          <button
            onClick={onEditText}
            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 flex-shrink-0"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(preview.confidence)}`}>
          {preview.confidence >= 80 && '✓'}
          {preview.confidence >= 60 && preview.confidence < 80 && '⚠️'}
          {preview.confidence < 60 && '!'}
          <span>{preview.confidence}% confident</span>
        </div>
        <div className="text-xs text-gray-500">
          {preview.action} {preview.type}
        </div>
      </div>

      {/* Editable Fields */}
      <div className="space-y-3">
        {/* Event Fields */}
        {isEvent && (
          <>
            {/* Person */}
            <FieldGroup label="Person" icon={User} required>
              <PersonSelector
                value={editedData.person}
                onChange={(value) => updateField('person', value)}
                familyMembers={familyMembers}
              />
            </FieldGroup>

            {/* Activity */}
            <FieldGroup label="Activity" icon={Tag} required>
              <input
                type="text"
                value={editedData.activity || ''}
                onChange={(e) => updateField('activity', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="What is this for?"
              />
            </FieldGroup>

            {/* Date - for one-off events */}
            {!editedData.day && (
              <FieldGroup label="Date" icon={Calendar} required>
                <input
                  type="date"
                  value={editedData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                />
              </FieldGroup>
            )}

            {/* Day - for recurring events */}
            {editedData.day && (
              <FieldGroup label="Repeats" icon={Repeat} required>
                <select
                  value={editedData.day || ''}
                  onChange={(e) => updateField('day', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                >
                  <option value="Monday">Every Monday</option>
                  <option value="Tuesday">Every Tuesday</option>
                  <option value="Wednesday">Every Wednesday</option>
                  <option value="Thursday">Every Thursday</option>
                  <option value="Friday">Every Friday</option>
                  <option value="Saturday">Every Saturday</option>
                  <option value="Sunday">Every Sunday</option>
                </select>
              </FieldGroup>
            )}

            {/* Time */}
            <FieldGroup label="Time" icon={Clock} required>
              <input
                type="time"
                value={editedData.time || ''}
                onChange={(e) => updateField('time', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
              />
            </FieldGroup>

            {/* End Time (Optional) */}
            {showOptional.endTime ? (
              <FieldGroup label="End Time" icon={Clock}>
                <input
                  type="time"
                  value={editedData.endTime || ''}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                />
              </FieldGroup>
            ) : (
              <button
                onClick={() => setShowOptional({ ...showOptional, endTime: true })}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add end time
              </button>
            )}

            {/* Location (Optional) */}
            {showOptional.location ? (
              <FieldGroup label="Location" icon={MapPin}>
                <input
                  type="text"
                  value={editedData.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                  placeholder="Where?"
                />
              </FieldGroup>
            ) : (
              <button
                onClick={() => setShowOptional({ ...showOptional, location: true })}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add location
              </button>
            )}

            {/* Notes (Optional) */}
            {showOptional.notes ? (
              <FieldGroup label="Notes" icon={FileText}>
                <textarea
                  value={editedData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 resize-none"
                  rows={2}
                  placeholder="Any additional details?"
                />
              </FieldGroup>
            ) : (
              <button
                onClick={() => setShowOptional({ ...showOptional, notes: true })}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add notes
              </button>
            )}
          </>
        )}

        {/* Contact Fields */}
        {isContact && (
          <>
            <FieldGroup label="Name" icon={User} required>
              <input
                type="text"
                value={editedData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="Contact name"
              />
            </FieldGroup>

            <FieldGroup label="Relation" icon={Tag}>
              <input
                type="text"
                value={editedData.relation || ''}
                onChange={(e) => updateField('relation', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="Friend, Coach, Teacher, etc."
              />
            </FieldGroup>

            <FieldGroup label="Phone" icon={Clock}>
              <input
                type="tel"
                value={editedData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="(555) 123-4567"
              />
            </FieldGroup>
          </>
        )}

        {/* Checklist Fields */}
        {isChecklist && (
          <>
            <FieldGroup label="Title" icon={Tag} required>
              <input
                type="text"
                value={editedData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="Checklist name"
              />
            </FieldGroup>

            <FieldGroup label="For" icon={User}>
              <PersonSelector
                value={editedData.person}
                onChange={(value) => updateField('person', value)}
                familyMembers={familyMembers}
              />
            </FieldGroup>
          </>
        )}
      </div>

      {/* New Activity Type Notice */}
      {preview.newActivityType && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
          <p className="text-purple-900 font-medium">Creating new activity type:</p>
          <p className="text-purple-700">{preview.newActivityType.id}</p>
        </div>
      )}

      {/* Related Actions */}
      {preview.relatedActions && preview.relatedActions.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-900 font-medium mb-1">Also creating:</p>
          {preview.relatedActions.map((action, idx) => (
            <div key={idx} className="text-blue-700">
              • {action.type === 'contact' ? action.data.name : action.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Field Group Component
interface FieldGroupProps {
  label: string;
  icon: any;
  required?: boolean;
  children: React.ReactNode;
}

function FieldGroup({ label, icon: Icon, required, children }: FieldGroupProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// Person Selector Component
interface PersonSelectorProps {
  value: string;
  onChange: (value: string) => void;
  familyMembers: FamilyMember[];
}

function PersonSelector({ value, onChange, familyMembers }: PersonSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 flex-1">
      {familyMembers.map((member) => (
        <button
          key={member.name}
          onClick={() => onChange(member.name)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            value === member.name
              ? `bg-${member.color}-100 text-${member.color}-700 border-2 border-${member.color}-300`
              : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
          }`}
          style={
            value === member.name
              ? {
                  backgroundColor: `${member.color === 'blue' ? '#dbeafe' : member.color === 'pink' ? '#fce7f3' : member.color === 'emerald' ? '#d1fae5' : '#fef3c7'}`,
                  borderColor: `${member.color === 'blue' ? '#93c5fd' : member.color === 'pink' ? '#f9a8d4' : member.color === 'emerald' ? '#6ee7b7' : '#fcd34d'}`,
                  color: `${member.color === 'blue' ? '#1e40af' : member.color === 'pink' ? '#be185d' : member.color === 'emerald' ? '#047857' : '#b45309'}`,
                }
              : undefined
          }
        >
          {member.avatar} {member.name}
        </button>
      ))}
      <button
        onClick={() => onChange('Family')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          value === 'Family'
            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
        }`}
      >
        👨‍👩‍👧‍👦 Family
      </button>
    </div>
  );
}
