import { ReactNode } from "react";

interface InfoTooltipProps {
  content: string | ReactNode;
  ariaLabel?: string;
}

export function InfoTooltip({ content, ariaLabel }: InfoTooltipProps) {
  return (
    <div className="relative inline-flex items-center ml-1 align-middle group">
      <button
        type="button"
        aria-label={ariaLabel ?? "Informations"}
        title={ariaLabel ?? "Informations"}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-normal leading-none text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-default transition-colors"
      >
        i
      </button>

      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 z-50 mt-2 min-w-[260px] max-w-[340px] rounded-md border border-gray-200 bg-white p-3 text-xs font-normal text-slate-700 shadow-sm whitespace-normal break-words opacity-0 translate-y-1 transition-opacity transition-transform duration-150 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto leading-5"
      >
        {content}
      </div>
    </div>
  );
}
