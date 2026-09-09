export type BlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "code"
  | "list"
  | "divider"
  | "callout";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    level?: number; // heading level 1-3
    listType?: "bullet" | "numbered";
    variant?: "info" | "warning" | "success" | "danger";
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  blocks: Block[];
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  blocks: Block[];
  category_id: string | null;
  status: "draft" | "published";
  author_id: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  userId: string;
  username: string;
}
