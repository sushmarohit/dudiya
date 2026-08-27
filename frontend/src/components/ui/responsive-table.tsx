import { cn } from "@/lib/utils";

export function ResponsiveTable({
  children,
  className,
  minWidth = "640px",
}: {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0",
        className,
      )}
    >
      <div
        className="inline-block min-w-full align-middle"
        style={{ minWidth }}
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 break-words sm:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-slate-600 break-words sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
