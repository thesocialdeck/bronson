import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import type { FamilyMember } from '~/types';

const AVAILABLE_COLORS: FamilyMember['color'][] = [
  'blue', 'pink', 'emerald', 'amber', 'purple', 'rose', 'sky', 'lime'
];

interface FamilySetupStepProps {
  onNext: () => void;
  onBack?: () => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
}

export function FamilySetupStep({ onNext, onBack, familyMembers, setFamilyMembers }: FamilySetupStepProps) {
  const [newMemberName, setNewMemberName] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) return;

    const usedColors = new Set(familyMembers.map(m => m.color));
    const availableColor = AVAILABLE_COLORS.find(c => !usedColors.has(c)) || 'blue';

    const newMember: FamilyMember = {
      name: newMemberName.trim(),
      color: availableColor,
      avatar: newMemberName.trim()[0].toUpperCase(),
    };

    setFamilyMembers([...familyMembers, newMember]);
    setNewMemberName('');
  };

  const removeMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateMemberColor = (index: number, color: FamilyMember['color']) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], color };
    setFamilyMembers(updated);
  };

  const canProceed = familyMembers.length > 0;

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Who's in your family?
        </h2>
        <p className="text-gray-600">
          Add everyone who has events to track (kids, adults, pets!)
        </p>
      </div>

      {/* Add member form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMember()}
            placeholder="Enter a name..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 text-lg"
            autoFocus
          />
          <button
            onClick={addMember}
            disabled={!newMemberName.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: Press Enter to quickly add members
        </p>
      </div>

      {/* Member list */}
      <div className="space-y-3 mb-8 max-h-64 overflow-auto">
        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No family members yet</p>
          </div>
        ) : (
          familyMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-${member.color}-500`}
              >
                {member.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{member.name}</p>
                <div className="flex gap-1 mt-1">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateMemberColor(index, color)}
                      className={`w-6 h-6 rounded-full bg-${color}-500 border-2 ${
                        member.color === color ? 'border-gray-900' : 'border-transparent'
                      } hover:scale-110 transition-transform`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeMember(index)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
