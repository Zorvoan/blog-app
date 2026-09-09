import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPosts,
  getCategories,
  createPost,
  updatePost,
  deletePost,
} from "@/lib/data";
import type { Post, Category, Block } from "@/lib/types";
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
  Newspaper,
  Loader2,
  Search,
  ArrowBigUp,
  MessageCircle,
} from "lucide-react";

export function PostsView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [allPosts, cats] = await Promise.all([getPosts(), getCategories()]);
    setPosts(allPosts.filter((p) => p.author_id === user?.id));
    setCategories(cats);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNew() {
    setEditingPost(null);
    setShowEditor(true);
  }

  function handleEdit(post: Post) {
    setEditingPost(post);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSave(data: {
    title: string;
    blocks: Block[];
    category_id: string | null;
    status: "draft" | "published";
  }) {
    const body = data.blocks.map((b) => b.content).join("\n").trim();
    if (editingPost) {
      const updated = await updatePost(editingPost.id, {
        title: data.title,
        body,
        blocks: data.blocks,
        category_id: data.category_id,
        status: data.status,
      });
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else if (user) {
      const created = await createPost(
        data.title,
        body,
        data.blocks,
        data.category_id,
        user.id,
        data.status
      );
      setPosts((prev) => [created, ...prev]);
    }
    setShowEditor(false);
    setEditingPost(null);
  }

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus && p.author_id === user?.id;
  });

  function getCategoryName(id: string | null): string {
    if (!id) return "Uncategorized";
    return categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  }

  function getCategoryColor(id: string | null): string {
    if (!id) return "#71717a";
    return categories.find((c) => c.id === id)?.color ?? "#71717a";
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Posts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {posts.length} total · {posts.filter((p) => p.status === "published").length} published
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
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
          <Newspaper className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            {posts.length === 0 ? "No posts yet" : "No posts match your filters"}
          </p>
          {posts.length === 0 && (
            <Button onClick={handleNew} variant="secondary" size="sm" className="mt-2">
              <Plus className="w-4 h-4" />
              Create your first post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge
                      variant={post.status === "published" ? "success" : "warning"}
                    >
                      {post.status}
                    </Badge>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(post.category_id)}20`,
                        color: getCategoryColor(post.category_id),
                      }}
                    >
                      {getCategoryName(post.category_id)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    {post.title || "(untitled)"}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {blocksToExcerpt(post.blocks, 150)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ArrowBigUp className="w-3.5 h-3.5" />
                      {post.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.comment_count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewPost(post)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {post.author_id === user?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <PostEditor
          post={editingPost}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
        />
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewPost}
        onClose={() => setPreviewPost(null)}
        title="Post Preview"
        maxWidth="max-w-2xl"
      >
        {previewPost && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={previewPost.status === "published" ? "success" : "warning"}>
                {previewPost.status}
              </Badge>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${getCategoryColor(previewPost.category_id)}20`,
                  color: getCategoryColor(previewPost.category_id),
                }}
              >
                {getCategoryName(previewPost.category_id)}
              </span>
              <span className="text-xs text-zinc-400">
                {timeAgo(previewPost.created_at)}
              </span>
            </div>
            {previewPost.title && (
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {previewPost.title}
              </h2>
            )}
            <BlockRenderer blocks={previewPost.blocks} />
          </div>
        )}
      </Modal>
    </div>
  );
}

interface PostEditorProps {
  post: Post | null;
  categories: Category[];
  onSave: (data: {
    title: string;
    blocks: Block[];
    category_id: string | null;
    status: "draft" | "published";
  }) => Promise<void>;
  onClose: () => void;
}

function PostEditor({ post, categories, onSave, onClose }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [blocks, setBlocks] = useState<Block[]>(post?.blocks ?? []);
  const [categoryId, setCategoryId] = useState<string>(post?.category_id ?? "");
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title,
        blocks,
        category_id: categoryId || null,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={post ? "Edit Post" : "New Post"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title (optional for quick posts)..."
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Content
          </label>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 min-h-[200px]">
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Post"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
