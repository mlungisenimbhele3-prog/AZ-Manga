import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Pencil, Trash2, AlertCircle, Loader2, Lock } from 'lucide-react';
import {
  UserProfile,
  DEFAULT_USER_PROFILE,
  saveMyProfileChanges,
} from '../../services/userProfile';
import type { OververseAuthUser } from '../../services/oververseAuth';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaved?: (updatedProfile: UserProfile, updatedUser: OververseAuthUser) => void;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaved,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('');
  const [avatarData, setAvatarData] = useState<string | undefined>(undefined);
  const [avatarFileName, setAvatarFileName] = useState<string | undefined>(undefined);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName((profile.displayName || profile.penName || '').slice(0, 30));
    setStudioName((profile.studioName || '').slice(0, 30));
    setBio((profile.bio || '').slice(0, 150));
    setAvatarPreviewUrl(profile.avatarUrl || DEFAULT_USER_PROFILE.avatarUrl);
    setAvatarData(undefined);
    setAvatarFileName(undefined);
    setRemoveAvatar(false);
    setDisplayNameError(null);
    setAvatarError(null);
    setSubmitError(null);
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);
    const mime = (file.type || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedExt = ext === 'jpg' || ext === 'jpeg' || ext === 'png';
    if (!ALLOWED_MIME_TYPES.has(mime) && !isAllowedExt) {
      setAvatarError('Please upload a JPG or PNG image.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = String(evt.target?.result || '');
      if (!result) {
        setAvatarError('Could not read the selected image.');
        return;
      }
      setAvatarPreviewUrl(result);
      setAvatarData(result);
      setAvatarFileName(file.name);
      setRemoveAvatar(false);
    };
    reader.onerror = () => {
      setAvatarError('Could not read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarError(null);
    setAvatarData(undefined);
    setAvatarFileName(undefined);
    setRemoveAvatar(true);
    setAvatarPreviewUrl(DEFAULT_USER_PROFILE.avatarUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setDisplayNameError('Display Name is required.');
      return;
    }
    if (trimmedName.length > 30) {
      setDisplayNameError('Display Name must be 30 characters or less.');
      return;
    }
    setDisplayNameError(null);

    if (studioName.trim().length > 30) {
      setSubmitError('Studio Name must be 30 characters or less.');
      return;
    }
    if (bio.trim().length > 150) {
      setSubmitError('Bio must be 150 characters or less.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveMyProfileChanges({
        displayName: trimmedName,
        studioName: studioName.trim(),
        bio: bio.trim(),
        avatarData,
        avatarFileName,
        removeAvatar,
      });

      if (!res.success || !res.profile || !res.user) {
        setSubmitError(res.error || 'Failed to update profile.');
        return;
      }

      onSaved?.(res.profile, res.user);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      id="edit-profile-modal-overlay"
      className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Profile"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        id="edit-profile-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-[#0d1017] text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Edit Profile</h2>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
            aria-label="Close Edit Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {submitError && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="relative shrink-0">
              <img
                src={avatarPreviewUrl || DEFAULT_USER_PROFILE.avatarUrl}
                alt={displayName || 'Profile avatar'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 bg-slate-900"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg border-2 border-[#0d1017] transition"
                title="Upload profile photo"
                aria-label="Upload profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-xs font-bold text-white">Profile Photo</div>
              <p className="text-[11px] text-slate-400">
                JPG or PNG, max 2MB. Preview updates before saving.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-white transition"
                >
                  Choose Photo
                </button>
                {(avatarData || (profile.avatarUrl && !removeAvatar && profile.avatarUrl !== DEFAULT_USER_PROFILE.avatarUrl)) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-[11px] font-medium text-slate-400 hover:text-rose-300 transition inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              {avatarError && (
                <p className="text-[11px] text-rose-400 font-medium">{avatarError}</p>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-profile-display-name" className="text-xs font-bold text-slate-300">
                Display Name *
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {displayName.length}/30
              </span>
            </div>
            <input
              id="edit-profile-display-name"
              type="text"
              required
              maxLength={30}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value.slice(0, 30));
                if (displayNameError) setDisplayNameError(null);
              }}
              placeholder="e.g. Nkosinathi"
              className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                displayNameError
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-800 focus:border-amber-500'
              }`}
            />
            {displayNameError && (
              <p className="text-[11px] text-rose-400 font-medium">{displayNameError}</p>
            )}
          </div>

          {/* Studio Name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-profile-studio-name" className="text-xs font-bold text-slate-300">
                Studio Name
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {studioName.length}/30
              </span>
            </div>
            <input
              id="edit-profile-studio-name"
              type="text"
              maxLength={30}
              value={studioName}
              onChange={(e) => setStudioName(e.target.value.slice(0, 30))}
              placeholder="e.g. Nkosinathi Studio (optional)"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-profile-bio" className="text-xs font-bold text-slate-300">
                Bio
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {bio.length}/150
              </span>
            </div>
            <textarea
              id="edit-profile-bio"
              rows={3}
              maxLength={150}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Tell readers a bit about yourself or your stories (optional)..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none transition"
            />
          </div>

          {/* Read-only Email */}
          <div className="space-y-1">
            <label htmlFor="edit-profile-email" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Email</span>
            </label>
            <input
              id="edit-profile-email"
              type="email"
              value={profile.email}
              disabled
              readOnly
              className="w-full rounded-xl bg-slate-900/60 border border-slate-800/80 px-3.5 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500">Email cannot be changed here</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="edit-profile-save-btn"
              type="submit"
              disabled={isSaving}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
