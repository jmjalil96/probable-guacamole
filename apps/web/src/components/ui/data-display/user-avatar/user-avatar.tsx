import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  user: { name: string } | null;
  size?: "sm" | "md";
  className?: string;
}

function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const isSystem = !user;
  const initials = user ? getUserInitials(user.name) : "SY";

  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full font-semibold uppercase",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
        isSystem ? "bg-border/70 text-text-muted" : "bg-accent text-primary",
        className
      )}
    >
      {initials}
    </span>
  );
}
