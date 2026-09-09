import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPages,
  createPage,
  updatePage,
  deletePage,
} from "@/lib/data";
import type { Page, Block } from "@/lib/types";
import { timeAgo, blocksToExcerpt } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BlockEditor } from "@/components/BlockEditor";
import { BlockRenderer } from "@/components/BlockRenderer";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

export function PagesView() {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const allPages = await getPages();
    setPages(allPages.filter((p) => p.author_id === user?.id));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNew() {
    setEditingPage(null);
    setShowEditor(true);
  }

  function handleEdit(page: Page) {
    setEditingPage(page);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    await deletePage(id);
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSave(data: {
    title: string;
    blocks: Block[];
    status: "draft" | "published";
  }) {
    if (editingPage) {
      const updated = await updatePage(editingPage.id, data);
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else if (user) {
      const created = await createPage(data.title, user.id, data.blocks);
      // apply status & blocks
      const updated = await updatePage(created.id, data);
      setPages((prev) => [updated, ...prev]);
    }
    setShowEditor(false);
    setEditingPage(null);
  }

  const filtered = pages.filter((p) => {
    const matchesSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus && p.author_id === user?.id;
  });

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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Pages</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pages.length} total · {pages.filter((p) => p.status === "published").length} published
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          New Page
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                statusFilter === s
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            {pages.length === 0 ? "No pages yet" : "No pages match your filters"}
          </p>
          {pages.length === 0 && (
            <Button onClick={handleNew} variant="secondary" size="sm" className="mt-2">
              <Plus className="w-4 h-4" />
              Create your first page
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((page) => (
            <div
              key={page.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={page.status === "published" ? "success" : "warning"}>
                    {page.status}
                  </Badge>
                  <span className="text-xs text-zinc-400 font-mono">/{page.slug}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPreviewPage(page)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {page.author_id === user?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {page.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {blocksToExcerpt(page.blocks, 120)}
              </p>
              <p className="text-xs text-zinc-400 mt-3">
                Updated {timeAgo(page.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <PageEditor
          page={editingPage}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingPage(null);
          }}
        />
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewPage}
        onClose={() => setPreviewPage(null)}
        title="Page Preview"
        maxWidth="max-w-2xl"
      >
        {previewPage && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={previewPage.status === "published" ? "success" : "warning"}>
                {previewPage.status}
              </Badge>
              <span className="text-xs text-zinc-400 font-mono">/{previewPage.slug}</span>
              <span className="text-xs text-zinc-400">
                {timeAgo(previewPage.updated_at)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {previewPage.title}
            </h2>
            <BlockRenderer blocks={previewPage.blocks} />
          </div>
        )}
      </Modal>
    </div>
  );
}

interface PageEditorProps {
  page: Page | null;
  onSave: (data: {
    title: string;
    blocks: Block[];
    status: "draft" | "published";
  }) => Promise<void>;
  onClose: () => void;
}

function PageEditor({ page, onSave, onClose }: PageEditorProps) {
  const [title, setTitle] = useState(page?.title ?? "");
  const [blocks, setBlocks] = useState<Block[]>(page?.blocks ?? []);
  const [status, setStatus] = useState<"draft" | "published">(page?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ title, blocks, status });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={page ? "Edit Page" : "New Page"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Content
          </label>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 min-h-[200px]">
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Page"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
