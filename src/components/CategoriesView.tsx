import { useState, useEffect, useCallback } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPosts,
} from "@/lib/data";
import type { Category } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Loader2,
  Newspaper,
} from "lucide-react";

const CATEGORY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
  "#f97316", "#6366f1", "#14b8a6", "#e11d48",
];

export function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cats, posts] = await Promise.all([getCategories(), getPosts()]);
    setCategories(cats);
    const counts: Record<string, number> = {};
    for (const c of cats) {
      counts[c.id] = posts.filter((p) => p.category_id === c.id).length;
    }
    setPostCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNew() {
    setEditingCategory(null);
    setShowEditor(true);
  }

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
  }

  async function handleSave(data: {
    name: string;
    description: string;
    color: string;
  }) {
    if (editingCategory) {
      const updated = await updateCategory(editingCategory.id, data);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      const created = await createCategory(data.name, data.description, data.color);
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowEditor(false);
    setEditingCategory(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Categories</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20">
          <FolderTree className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">No categories yet</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
            Create categories to organize your posts
          </p>
          <Button onClick={handleNew} variant="secondary" size="sm">
            <Plus className="w-4 h-4" />
            Create your first category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <div
                      className="w-5 h-5 rounded-md"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                  {cat.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Newspaper className="w-3.5 h-3.5" />
                  {postCounts[cat.id] ?? 0} posts
                </span>
                <span>{timeAgo(cat.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
      >
        {deleteTarget && (
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Posts in this category will be moved to "Uncategorized". This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteTarget.id)}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface CategoryEditorProps {
  category: Category | null;
  onSave: (data: { name: string; description: string; color: string }) => Promise<void>;
  onClose: () => void;
}

function CategoryEditor({ category, onSave, onClose }: CategoryEditorProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description, color });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? "Edit Category" : "New Category"}
    >
      <div className="space-y-5">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Technology, News, Updates..."
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this category about?"
          rows={2}
        />
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-transform ${
                  color === c
                    ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900 scale-110"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Category"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
