import { getDb, generateId, now, slugify } from "./db";
import type { Page, Post, Category, Block } from "./types";

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  const result = await db.query<Category>(
    "SELECT * FROM categories ORDER BY name ASC"
  );
  return result.rows;
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = await getDb();
  const result = await db.query<Category>("SELECT * FROM categories WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function createCategory(
  name: string,
  description: string,
  color: string
): Promise<Category> {
  const db = await getDb();
  const id = generateId();
  const ts = now();
  const slug = slugify(name);
  await db.query(
    `INSERT INTO categories (id, name, slug, description, color, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, slug, description, color, ts, ts]
  );
  return (await getCategory(id))!;
}

export async function updateCategory(
  id: string,
  updates: { name?: string; description?: string; color?: string }
): Promise<Category> {
  const db = await getDb();
  const existing = await getCategory(id);
  if (!existing) throw new Error("Category not found");
  const ts = now();
  const name = updates.name ?? existing.name;
  const slug = updates.name ? slugify(updates.name) : existing.slug;
  await db.query(
    `UPDATE categories SET name = $2, slug = $3, description = $4, color = $5, updated_at = $6 WHERE id = $1`,
    [id, name, slug, updates.description ?? existing.description, updates.color ?? existing.color, ts]
  );
  return (await getCategory(id))!;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM categories WHERE id = $1", [id]);
}

// ---- Pages ----

export async function getPages(): Promise<Page[]> {
  const db = await getDb();
  const result = await db.query<Page>(
    "SELECT * FROM pages ORDER BY updated_at DESC"
  );
  return result.rows.map(parsePageBlocks);
}

export async function getPage(id: string): Promise<Page | null> {
  const db = await getDb();
  const result = await db.query<Page>("SELECT * FROM pages WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  return parsePageBlocks(result.rows[0]);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const db = await getDb();
  const result = await db.query<Page>("SELECT * FROM pages WHERE slug = $1", [slug]);
  if (result.rows.length === 0) return null;
  return parsePageBlocks(result.rows[0]);
}

export async function createPage(
  title: string,
  authorId: string,
  blocks: Block[] = []
): Promise<Page> {
  const db = await getDb();
  const id = generateId();
  const ts = now();
  const slug = slugify(title) || `page-${id}`;
  await db.query(
    `INSERT INTO pages (id, title, slug, status, blocks, author_id, created_at, updated_at)
     VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7)`,
    [id, title, slug, JSON.stringify(blocks), authorId, ts, ts]
  );
  return (await getPage(id))!;
}

export async function updatePage(
  id: string,
  updates: { title?: string; status?: "draft" | "published"; blocks?: Block[] }
): Promise<Page> {
  const db = await getDb();
  const existing = await getPage(id);
  if (!existing) throw new Error("Page not found");
  const ts = now();
  const title = updates.title ?? existing.title;
  const slug = updates.title ? slugify(updates.title) : existing.slug;
  const status = updates.status ?? existing.status;
  const blocks = updates.blocks ?? existing.blocks;
  await db.query(
    `UPDATE pages SET title = $2, slug = $3, status = $4, blocks = $5, updated_at = $6 WHERE id = $1`,
    [id, title, slug, status, JSON.stringify(blocks), ts]
  );
  return (await getPage(id))!;
}

export async function deletePage(id: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM pages WHERE id = $1", [id]);
}

// ---- Posts ----

export async function getPosts(): Promise<Post[]> {
  const db = await getDb();
  const result = await db.query<Post>(
    "SELECT * FROM posts ORDER BY created_at DESC"
  );
  return result.rows.map(parsePostBlocks);
}

export async function getPost(id: string): Promise<Post | null> {
  const db = await getDb();
  const result = await db.query<Post>("SELECT * FROM posts WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  return parsePostBlocks(result.rows[0]);
}

export async function createPost(
  title: string,
  body: string,
  blocks: Block[],
  categoryId: string | null,
  authorId: string,
  status: "draft" | "published" = "draft"
): Promise<Post> {
  const db = await getDb();
  const id = generateId();
  const ts = now();
  await db.query(
    `INSERT INTO posts (id, title, body, blocks, category_id, status, author_id, upvotes, comment_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)`,
    [id, title, body, JSON.stringify(blocks), categoryId, status, authorId, ts, ts]
  );
  return (await getPost(id))!;
}

export async function updatePost(
  id: string,
  updates: {
    title?: string;
    body?: string;
    blocks?: Block[];
    category_id?: string | null;
    status?: "draft" | "published";
  }
): Promise<Post> {
  const db = await getDb();
  const existing = await getPost(id);
  if (!existing) throw new Error("Post not found");
  const ts = now();
  await db.query(
    `UPDATE posts SET title = $2, body = $3, blocks = $4, category_id = $5, status = $6, updated_at = $7 WHERE id = $1`,
    [
      id,
      updates.title ?? existing.title,
      updates.body ?? existing.body,
      JSON.stringify(updates.blocks ?? existing.blocks),
      updates.category_id !== undefined ? updates.category_id : existing.category_id,
      updates.status ?? existing.status,
      ts,
    ]
  );
  return (await getPost(id))!;
}

export async function deletePost(id: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM posts WHERE id = $1", [id]);
}

export async function toggleUpvote(postId: string, userId: string): Promise<void> {
  const db = await getDb();
  const existing = await db.query(
    "SELECT 1 FROM upvotes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );
  const ts = now();
  if (existing.rows.length > 0) {
    await db.query("DELETE FROM upvotes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    await db.query("UPDATE posts SET upvotes = upvotes - 1 WHERE id = $1", [postId]);
  } else {
    await db.query(
      "INSERT INTO upvotes (post_id, user_id, created_at) VALUES ($1, $2, $3)",
      [postId, userId, ts]
    );
    await db.query("UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1", [postId]);
  }
}

export async function hasUpvoted(postId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.query(
    "SELECT 1 FROM upvotes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );
  return result.rows.length > 0;
}

// ---- Helpers ----

function parsePageBlocks(row: Page): Page {
  return { ...row, blocks: safeParseBlocks(row.blocks) };
}

function parsePostBlocks(row: Post): Post {
  return { ...row, blocks: safeParseBlocks(row.blocks) };
}

function safeParseBlocks(raw: string | Block[]): Block[] {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw) as Block[];
  } catch {
    return [];
  }
}
