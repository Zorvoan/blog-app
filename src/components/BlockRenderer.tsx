import type { Block } from "@/lib/types";

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const level = block.meta?.level ?? 2;
      if (level === 1)
        return <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{block.content}</h1>;
      if (level === 3)
        return <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{block.content}</h3>;
      return <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{block.content}</h2>;
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-1 italic text-zinc-700 dark:text-zinc-300">
          {block.content}
        </blockquote>
      );

    case "code":
      return (
        <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 overflow-x-auto">
          <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {block.content}
          </code>
        </pre>
      );

    case "list": {
      const items = block.content.split("\n").filter(Boolean);
      const listType = block.meta?.listType ?? "bullet";
      if (listType === "numbered") {
        return (
          <ol className="list-decimal pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    case "divider":
      return <hr className="border-zinc-200 dark:border-zinc-800" />;

    case "callout": {
      const variant = block.meta?.variant ?? "info";
      const colors = {
        info: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200",
        warning:
          "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200",
        success:
          "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200",
        danger:
          "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200",
      };
      return (
        <div className={`rounded-lg border p-3 text-sm ${colors[variant]}`}>
          {block.content}
        </div>
      );
    }

    default:
      return (
        <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
          {block.content}
        </p>
      );
  }
}
