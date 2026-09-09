import { useState, useRef, type KeyboardEvent } from "react";
import {
  Type,
  Heading,
  Quote,
  Code,
  List,
  Minus,
  MessageSquareWarning,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import type { Block, BlockType } from "@/lib/types";
import { generateId } from "@/lib/db";

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "heading", label: "Heading", icon: Heading },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "code", label: "Code", icon: Code },
  { type: "list", label: "List", icon: List },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "callout", label: "Callout", icon: MessageSquareWarning },
];

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  function updateBlock(id: string, updates: Partial<Block>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function addBlock(type: BlockType, index: number) {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: "",
      meta: type === "heading" ? { level: 2 } : type === "list" ? { listType: "bullet" } : type === "callout" ? { variant: "info" } : undefined,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    onChange(newBlocks);
    setShowAddMenu(null);
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  }

  return (
    <div className="space-y-1">
      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-3">No content yet</p>
          <AddBlockButton onAdd={(type) => addBlock(type, 0)} />
        </div>
      )}

      {blocks.map((block, index) => (
        <div key={block.id} className="group relative">
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center gap-0.5 pt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveBlock(block.id, -1)}
                disabled={index === 0}
                className="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30"
                title="Move up"
              >
                <GripVertical className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                onClick={() => moveBlock(block.id, 1)}
                disabled={index === blocks.length - 1}
                className="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30"
                title="Move down"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <BlockInput
                block={block}
                onChange={(updates) => updateBlock(block.id, updates)}
              />
            </div>

            <div className="flex items-center gap-1 pt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() =>
                  setShowAddMenu(showAddMenu === index ? null : index)
                }
                className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Add block below"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeBlock(block.id)}
                className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove block"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showAddMenu === index && (
            <div className="ml-10 mt-1 mb-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg flex flex-wrap gap-1 animate-slide-up">
              {BLOCK_TYPES.map((bt) => {
                const Icon = bt.icon;
                return (
                  <button
                    key={bt.type}
                    onClick={() => addBlock(bt.type, index + 1)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {bt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {blocks.length > 0 && (
        <div className="pt-2">
          <AddBlockButton onAdd={(type) => addBlock(type, blocks.length)} />
        </div>
      )}
    </div>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add block
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg flex flex-wrap gap-1 min-w-[200px] animate-slide-up">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon;
              return (
                <button
                  key={bt.type}
                  onClick={() => {
                    onAdd(bt.type);
                    setOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-full"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {bt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function BlockInput({
  block,
  onChange,
}: {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey && block.type === "list") {
      return;
    }
  }

  const baseClass =
    "w-full bg-transparent border-0 outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:ring-0 px-0";

  if (block.type === "divider") {
    return (
      <div className="py-3">
        <hr className="border-zinc-200 dark:border-zinc-800" />
      </div>
    );
  }

  if (block.type === "heading") {
    const fontSize =
      block.meta?.level === 1
        ? "text-2xl font-bold"
        : block.meta?.level === 3
        ? "text-lg font-semibold"
        : "text-xl font-bold";
    return (
      <div className="flex items-center gap-2 py-1">
        <select
          value={block.meta?.level ?? 2}
          onChange={(e) =>
            onChange({ meta: { ...block.meta, level: Number(e.target.value) } })
          }
          className="text-xs text-zinc-400 dark:text-zinc-600 bg-transparent border-0 outline-none cursor-pointer"
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
        <textarea
          ref={ref}
          rows={1}
          value={block.content}
          onChange={(e) => {
            onChange({ content: e.target.value });
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          onInput={autoResize}
          placeholder="Heading text..."
          className={`${baseClass} ${fontSize}`}
        />
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <div className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-1">
        <textarea
          ref={ref}
          rows={1}
          value={block.content}
          onChange={(e) => {
            onChange({ content: e.target.value });
            autoResize();
          }}
          onInput={autoResize}
          placeholder="Quote text..."
          className={`${baseClass} italic text-zinc-700 dark:text-zinc-300`}
        />
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <textarea
        ref={ref}
        rows={3}
        value={block.content}
        onChange={(e) => onChange({ content: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder="// code here..."
        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    );
  }

  if (block.type === "list") {
    return (
      <div className="py-1">
        <div className="flex items-center gap-2 mb-1">
          <select
            value={block.meta?.listType ?? "bullet"}
            onChange={(e) =>
              onChange({ meta: { ...block.meta, listType: e.target.value as "bullet" | "numbered" } })
            }
            className="text-xs text-zinc-400 dark:text-zinc-600 bg-transparent border-0 outline-none cursor-pointer"
          >
            <option value="bullet">Bullet</option>
            <option value="numbered">Numbered</option>
          </select>
        </div>
        <textarea
          ref={ref}
          rows={2}
          value={block.content}
          onChange={(e) => {
            onChange({ content: e.target.value });
            autoResize();
          }}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={"One item per line\nSecond item\nThird item"}
          className={`${baseClass} pl-4`}
        />
      </div>
    );
  }

  if (block.type === "callout") {
    const variantColors = {
      info: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
      warning: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20",
      success: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
      danger: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
    };
    const variant = block.meta?.variant ?? "info";
    return (
      <div className={`rounded-lg border p-3 ${variantColors[variant]}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <select
            value={variant}
            onChange={(e) =>
              onChange({ meta: { ...block.meta, variant: e.target.value as "info" | "warning" | "success" | "danger" } })
            }
            className="text-xs text-zinc-500 dark:text-zinc-400 bg-transparent border-0 outline-none cursor-pointer capitalize"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="danger">Danger</option>
          </select>
        </div>
        <textarea
          ref={ref}
          rows={2}
          value={block.content}
          onChange={(e) => {
            onChange({ content: e.target.value });
            autoResize();
          }}
          onInput={autoResize}
          placeholder="Callout text..."
          className={`${baseClass} text-sm`}
        />
      </div>
    );
  }

  // paragraph (default)
  return (
    <textarea
      ref={ref}
      rows={2}
      value={block.content}
      onChange={(e) => {
        onChange({ content: e.target.value });
        autoResize();
      }}
      onInput={autoResize}
      onKeyDown={handleKeyDown}
      placeholder="Write something..."
      className={`${baseClass} text-[15px] leading-relaxed`}
    />
  );
}
