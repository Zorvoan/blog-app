import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Check, Loader2 } from "lucide-react";

const AVATAR_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export function SettingsView() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color ?? "#3b82f6");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        display_name: displayName,
        bio,
        avatar_color: avatarColor,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Settings</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Manage your profile and preferences
      </p>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Profile
          </h2>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {(displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {displayName || user.username}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Avatar color
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    className={`w-9 h-9 rounded-full transition-transform ${
                      avatarColor === color
                        ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Account
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Username</dt>
              <dd className="text-zinc-900 dark:text-zinc-100 font-medium">@{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="text-zinc-900 dark:text-zinc-100 font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
              <dd className="text-zinc-900 dark:text-zinc-100 font-medium">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
