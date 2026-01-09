import { CheckCircle, XCircle, Mail, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui";

// =============================================================================
// AuthLayout
// =============================================================================

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  brandContent?: React.ReactNode;
  footer?: React.ReactNode;
}

function DecorativeShapes() {
  return (
    <div className="absolute inset-0">
      {/* Large circle - top right */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-hover/50" />

      {/* Medium circle - bottom left */}
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-dark/40" />

      {/* Rotated square */}
      <div className="absolute right-24 top-1/3 h-32 w-32 rotate-45 rounded-3xl bg-accent/20" />

      {/* Small dot */}
      <div className="absolute bottom-1/3 left-1/4 h-16 w-16 rounded-full bg-accent/30" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

function BrandPanel({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="relative hidden w-[45%] overflow-hidden bg-primary lg:block">
      <DecorativeShapes />

      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        {/* Logo */}
        <Logo variant="light" size="lg" showTagline />

        {/* Custom content (tagline, stats, etc.) */}
        {children}
      </div>
    </aside>
  );
}

function FormPanel({
  children,
  title,
  subtitle,
  footer,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string | undefined;
  footer: React.ReactNode | undefined;
}) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      {/* Mobile header - hidden on desktop */}
      <header className="flex items-center justify-between p-6 lg:hidden">
        <Logo variant="dark" size="md" />
      </header>

      {/* Form container */}
      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-96">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight text-text">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
            )}
          </div>

          {/* Form content */}
          {children}

          {/* Footer (e.g., "Don't have account?") */}
          {footer && (
            <div className="mt-8 text-center text-sm text-text-muted">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between px-6 py-4 text-xs text-text-light">
        <p>© {new Date().getFullYear()} CotizateAlgo. All rights reserved.</p>
        <nav className="flex gap-4">
          <a href="#" className="transition-colors hover:text-text-muted">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-text-muted">
            Terms
          </a>
        </nav>
      </footer>
    </main>
  );
}

export function AuthLayout({
  children,
  title,
  subtitle,
  brandContent,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <BrandPanel>{brandContent}</BrandPanel>
      <FormPanel title={title} subtitle={subtitle} footer={footer}>
        {children}
      </FormPanel>
    </div>
  );
}

// =============================================================================
// BrandContent
// =============================================================================

export interface BrandStat {
  value: string;
  label: string;
}

export interface BrandContentProps {
  title: string;
  subtitle: string;
  stats?: BrandStat[];
}

export function BrandContent({ title, subtitle, stats }: BrandContentProps) {
  return (
    <>
      {/* Tagline */}
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
          {subtitle}
        </p>
      </div>

      {/* Stats (optional) */}
      {stats && stats.length > 0 && (
        <div className="flex gap-12">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-sidebar-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// =============================================================================
// StatusView
// =============================================================================

export type StatusVariant = "success" | "error" | "info";

export interface StatusViewProps {
  variant: StatusVariant;
  icon?: LucideIcon;
  message?: string;
}

const VARIANT_STYLES: Record<
  StatusVariant,
  { bg: string; text: string; Icon: LucideIcon }
> = {
  success: {
    bg: "bg-success/10",
    text: "text-success",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-alert/10",
    text: "text-alert",
    Icon: XCircle,
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    Icon: Mail,
  },
};

/**
 * Reusable status view for auth flows (success, error, info states).
 * Displays a centered icon with optional message.
 */
export function StatusView({ variant, icon, message }: StatusViewProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = icon ?? styles.Icon;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${styles.bg}`}
      >
        <Icon className={`h-8 w-8 ${styles.text}`} />
      </div>
      {message && (
        <p className="text-center text-sm text-text-muted">{message}</p>
      )}
    </div>
  );
}
