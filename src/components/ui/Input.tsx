import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 ${
          error ? "border-red-400 dark:border-red-500" : "border-zinc-300 dark:border-zinc-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-y ${
          error ? "border-red-400 dark:border-red-500" : "border-zinc-300 dark:border-zinc-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 ${
          error ? "border-red-400 dark:border-red-500" : "border-zinc-300 dark:border-zinc-700"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
