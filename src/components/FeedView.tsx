import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPosts,
  getCategories,
  toggleUpvote,
  hasUpvoted,
  deletePost,
} from "@/lib/data";
import { getUserById } from "@/lib/auth";
import type { Post, Category, User } from "@/lib/types";
import { timeAgo, blocksToExcerpt, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BlockRenderer } from "@/components/BlockRenderer";
import {
  ArrowBigUp,
  MessageCircle,
  Eye,
  Trash2,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";
import type { View } from "@/components/Layout";

interface FeedViewProps {
  onNavigate: (view: View) => void;
}

export function FeedView({ onNavigate }: FeedViewProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [upvotedSet, setUpvotedSet] = useState<Set<string>>(new Set());
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [allPosts, cats] = await Promise.all([getPosts(), getCategories()]);
    const published = allPosts.filter((p) => p.status === "published");
    setPosts(published);
    setCategories(cats);

    const authorIds = [...new Set(published.map((p) => p.author_id))];
    const authorMap: Record<string, User> = {};
    await Promise.all(
      authorIds.map(async (id) => {
        const u = await getUserById(id);
        if (u) authorMap[id] = u;
      })
    );
    setAuthors(authorMap);

    if (user) {
      const voted = new Set<string>();
      for (const p of published) {
        if (await hasUpvoted(p.id, user.id)) voted.add(p.id);
      }
      setUpvotedSet(voted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleVote(postId: string) {
    if (!user) return;
    await toggleUpvote(postId, user.id);
    setUpvotedSet((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: upvotedSet.has(postId) ? p.upvotes - 1 : p.upvotes + 1,
            }
          : p
      )
    );
  }

  async function handleDelete(id: string) {
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setPreviewPost(null);
  }

  function getCategoryName(id: string | null): string {
    if (!id) return "General";
    return categories.find((c) => c.id === id)?.name ?? "General";
  }

  function getCategoryColor(id: string | null): string {
    if (!id) return "#71717a";
    return categories.find((c) => c.id === id)?.color ?? "#71717a";
  }

  function getAuthor(post: Post): { name: string; color: string } {
    const author = authors[post.author_id];
    if (author) {
      return {
        name: author.display_name || author.username,
        color: author.avatar_color,
      };
    }
    return { name: "Unknown", color: "#71717a" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Feed</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Latest published posts
          </p>
        </div>
        <Button onClick={() => onNavigate("posts")} size="sm">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">No posts yet</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Create your first post to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const author = getAuthor(post);
            return (
              <PostCard
                key={post.id}
                post={post}
                upvoted={upvotedSet.has(post.id)}
                onVote={() => handleVote(post.id)}
                onPreview={() => setPreviewPost(post)}
                authorName={author.name}
                authorColor={author.color}
                categoryName={getCategoryName(post.category_id)}
                categoryColor={getCategoryColor(post.category_id)}
                canDelete={post.author_id === user?.id}
                onDelete={() => handleDelete(post.id)}
              />
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewPost}
        onClose={() => setPreviewPost(null)}
        title="Preview"
        maxWidth="max-w-2xl"
      >
        {previewPost && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
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
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <ArrowBigUp className="w-4 h-4" />
                {previewPost.upvotes}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <MessageCircle className="w-4 h-4" />
                {previewPost.comment_count}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  upvoted: boolean;
  onVote: () => void;
  onPreview: () => void;
  authorName: string;
  authorColor: string;
  categoryName: string;
  categoryColor: string;
  canDelete: boolean;
  onDelete: () => void;
}

function PostCard({
  post,
  upvoted,
  onVote,
  onPreview,
  authorName,
  authorColor,
  categoryName,
  categoryColor,
  canDelete,
  onDelete,
}: PostCardProps) {
  const excerpt = blocksToExcerpt(post.blocks);

  return (
    <article className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: authorColor }}
        >
          {getInitials(authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
              {authorName}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">{timeAgo(post.created_at)}</span>
          </div>
          <span
            className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {categoryName}
          </span>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-3 cursor-pointer" onClick={onPreview}>
        {post.title && (
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            {post.title}
          </h3>
        )}
        {excerpt && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-4">
            {excerpt}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-800/50">
        <button
          onClick={onVote}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            upvoted
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {upvoted ? (
            <ArrowBigUp className="w-5 h-5 fill-current" />
          ) : (
            <ArrowBigUp className="w-5 h-5" />
          )}
          {post.upvotes}
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {post.comment_count}
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-auto"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>
    </article>
  );
}
