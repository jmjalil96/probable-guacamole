import { createFileRoute } from "@tanstack/react-router";
import { Spinner } from "@/components/ui";
import { toast } from "@/lib/utils";

export const Route = createFileRoute("/brand")({
  component: BrandPage,
});

function BrandPage() {
  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {/* Hero */}
      <section className="min-h-screen bg-primary relative flex items-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-50 -right-50 w-150 h-150 rounded-full bg-primary-hover opacity-50" />
        <div className="absolute -bottom-38 -left-38 w-112 h-112 rounded-full bg-primary-dark opacity-60" />
        <div className="absolute right-[15%] top-[35%] w-30 h-30 bg-accent opacity-20 rounded-3xl rotate-45" />
        <div className="absolute left-[20%] bottom-[30%] w-15 h-15 bg-accent opacity-25 rounded-full" />

        <div className="container mx-auto px-6 md:px-15 relative z-10 py-30 text-white">
          <p className="text-xs tracking-[0.3em] uppercase text-sidebar-muted mb-6">
            Brand Guidelines
          </p>
          <h1 className="font-display text-5xl md:text-8xl lg:text-9xl font-normal leading-none mb-4">
            Cotizate<span className="text-accent">Algo</span>
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-sidebar-muted mb-15">
            Claims Manager
          </p>
          <p className="max-w-md text-lg font-light leading-relaxed text-white/85">
            A comprehensive guide to the visual identity, typography, colors,
            and design system that powers our claims management platform.
          </p>
        </div>
      </section>

      {/* Logo Section */}
      <section className="py-40 bg-gradient-to-br from-gray-50 to-background">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="01"
            title="Logo & Identity"
            subtitle="The CotizateAlgo wordmark combines professional authority with approachable warmth through the accent color highlight."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-15">
            <LogoCard variant="dark" label="Primary / Dark Background">
              <span className="text-4xl font-semibold text-white">
                Cotizate<span className="text-accent">Algo</span>
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-white/60">
                Claims Manager
              </span>
            </LogoCard>

            <LogoCard variant="light" label="Light Background">
              <span className="text-4xl font-semibold text-primary">
                Cotizate<span className="text-alert">Algo</span>
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-primary-dark/60">
                Claims Manager
              </span>
            </LogoCard>

            <LogoCard variant="accent" label="Accent Background">
              <span className="text-4xl font-semibold text-primary">
                Cotizate<span className="text-alert">Algo</span>
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-primary-dark/60">
                Claims Manager
              </span>
            </LogoCard>

            <LogoCard variant="dark" label="Collapsed / Favicon">
              <span className="text-4xl font-semibold text-white">
                C<span className="text-accent">A</span>
              </span>
            </LogoCard>
          </div>

          {/* Logo Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-15 mt-25">
            <LogoRule type="do" title="Clear Space">
              Always maintain minimum clear space around the logo equal to the
              height of the &quot;C&quot; character.
            </LogoRule>
            <LogoRule type="do" title="Color Usage">
              The &quot;Algo&quot; portion should always use the accent color on
              dark backgrounds or alert color on light backgrounds.
            </LogoRule>
            <LogoRule type="dont" title="No Modifications">
              Do not stretch, rotate, apply effects, or change the colors beyond
              the approved variants.
            </LogoRule>
            <LogoRule type="dont" title="Minimum Size">
              The wordmark should never appear smaller than 100px wide to
              maintain legibility.
            </LogoRule>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="py-40">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="02"
            title="Color Palette"
            subtitle="A carefully crafted palette that balances professionalism with warmth. Deep blue conveys trust and authority, while coral accents add approachability."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-15">
            <ColorCard
              name="Primary Blue"
              role="Brand identity, navigation, buttons, links"
              hex="#0835a0"
              rgb="RGB 8, 53, 160"
              className="bg-primary sm:col-span-2"
              featured
            />
            <ColorCard
              name="Primary Hover"
              role="Interactive hover states"
              hex="#0a3db8"
              className="bg-primary-hover"
            />
            <ColorCard
              name="Primary Dark"
              role="Deep accents, shadows"
              hex="#062a7a"
              className="bg-primary-dark"
            />
            <ColorCard
              name="Accent Coral"
              role="Highlights, logo accent, decorative"
              hex="#ffd8d8"
              rgb="RGB 255, 216, 216"
              className="bg-accent sm:col-span-2"
              featured
            />
            <ColorCard
              name="Alert Red"
              role="Errors, urgent actions"
              hex="#ed3500"
              className="bg-alert"
            />
            <ColorCard
              name="Success Green"
              role="Confirmations, positive states"
              hex="#16a34a"
              className="bg-success"
            />
            <ColorCard
              name="Warning Amber"
              role="Caution states, pending"
              hex="#d97706"
              className="bg-warning"
            />
            <ColorCard
              name="Background"
              role="Page background, warm white"
              hex="#fffcfb"
              className="bg-background border border-border"
            />
            <ColorCard
              name="Text"
              role="Primary body text"
              hex="#1a1a1a"
              className="bg-text"
            />
            <ColorCard
              name="Text Muted"
              role="Secondary text, captions"
              hex="#666666"
              className="bg-text-muted"
            />
            <ColorCard
              name="Border"
              role="Dividers, input borders"
              hex="#e8e8e8"
              className="bg-border"
            />
            <ColorCard
              name="Sidebar Muted"
              role="Secondary nav text"
              hex="#8a9dc4"
              className="bg-sidebar-muted"
            />
          </div>

          {/* Color Combinations */}
          <div className="mt-25">
            <h3 className="text-2xl font-medium mb-10">
              Recommended Combinations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="h-50 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-medium">
                Primary + White
              </div>
              <div className="h-50 rounded-2xl bg-primary text-accent flex items-center justify-center text-xl font-medium">
                Primary + Accent
              </div>
              <div className="h-50 rounded-2xl bg-background text-primary border border-border flex items-center justify-center text-xl font-medium">
                Background + Primary
              </div>
              <div className="h-50 rounded-2xl bg-accent text-primary-dark flex items-center justify-center text-xl font-medium">
                Accent + Primary Dark
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="py-40 bg-gradient-to-b from-background to-gray-50">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="03"
            title="Typography"
            subtitle="DM Sans provides clarity and professionalism across all interfaces, with excellent legibility at every size."
          />

          {/* DM Sans Specimen */}
          <div className="bg-white rounded-3xl border border-border p-10 md:p-20 mt-15">
            <p className="text-xs tracking-[0.2em] uppercase text-text-light mb-6">
              DM Sans — Primary Typeface
            </p>
            <p className="text-6xl md:text-8xl leading-none mb-10">Aa Bb Cc</p>
            <p className="text-2xl text-text-muted leading-relaxed mb-10">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
              <br />
              abcdefghijklmnopqrstuvwxyz
              <br />
              0123456789 !@#$%^&*()
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-light">Light</span>
                <span className="text-xs text-text-light tracking-wider">
                  300
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-normal">Regular</span>
                <span className="text-xs text-text-light tracking-wider">
                  400
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-medium">Medium</span>
                <span className="text-xs text-text-light tracking-wider">
                  500
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-semibold">Semibold</span>
                <span className="text-xs text-text-light tracking-wider">
                  600
                </span>
              </div>
            </div>
          </div>

          {/* DM Mono Specimen */}
          <div className="bg-white rounded-3xl border border-border p-10 md:p-20 mt-10 font-mono">
            <p className="text-xs tracking-[0.2em] uppercase text-text-light mb-6 font-sans">
              DM Mono — Code & Data
            </p>
            <p className="text-4xl md:text-6xl leading-none mb-10">01234567</p>
            <p className="text-2xl text-text-muted leading-relaxed">
              Used for code snippets, data values,
              <br />
              reference numbers, and technical content.
            </p>
          </div>

          {/* Type Scale */}
          <div className="mt-25">
            <h3 className="text-2xl font-medium mb-10">Type Scale</h3>
            <div className="divide-y divide-border">
              <TypeScaleItem
                label="Display"
                sample="Claims Overview"
                size="48px / 600"
                className="text-5xl font-semibold"
              />
              <TypeScaleItem
                label="H1"
                sample="Page Title"
                size="36px / 600"
                className="text-4xl font-semibold"
              />
              <TypeScaleItem
                label="H2"
                sample="Section Header"
                size="28px / 600"
                className="text-3xl font-semibold"
              />
              <TypeScaleItem
                label="H3"
                sample="Card Title"
                size="20px / 500"
                className="text-xl font-medium"
              />
              <TypeScaleItem
                label="Body"
                sample="The quick brown fox jumps over the lazy dog."
                size="16px / 400"
                className="text-base"
              />
              <TypeScaleItem
                label="Small"
                sample="Secondary text and captions"
                size="14px / 400"
                className="text-sm text-text-muted"
              />
              <TypeScaleItem
                label="Caption"
                sample="Labels, timestamps, metadata"
                size="12px / 400"
                className="text-xs text-text-light"
              />
              <TypeScaleItem
                label="Overline"
                sample="CATEGORY LABEL"
                size="10px / 500 / 0.2em"
                className="text-[10px] font-medium tracking-[0.2em] uppercase text-text-light"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="py-40">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="04"
            title="Spacing & Radii"
            subtitle="Consistent spacing creates rhythm and hierarchy. Our radius system adds softness while maintaining professionalism."
          />

          {/* Spacing Visual */}
          <div className="flex flex-wrap gap-10 mt-15">
            {[
              { size: 4, label: "4px", name: "xs" },
              { size: 8, label: "8px", name: "sm" },
              { size: 12, label: "12px", name: "md" },
              { size: 16, label: "16px", name: "base" },
              { size: 24, label: "24px", name: "lg" },
              { size: 32, label: "32px", name: "xl" },
              { size: 48, label: "48px", name: "2xl" },
              { size: 64, label: "64px", name: "3xl" },
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center gap-4">
                <div
                  className="bg-primary rounded-lg"
                  style={{ width: item.size * 2, height: item.size * 2 }}
                />
                <span className="font-mono text-xs text-text-muted text-center">
                  {item.label}
                  <br />
                  {item.name}
                </span>
              </div>
            ))}
          </div>

          {/* Radius Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-25">
            {[
              { radius: "rounded-md", value: "6px", name: "Small — Buttons" },
              { radius: "rounded-lg", value: "8px", name: "Medium — Cards" },
              { radius: "rounded-xl", value: "10px", name: "Large — Modals" },
              { radius: "rounded-2xl", value: "12px", name: "XL — Sections" },
            ].map((item) => (
              <div
                key={item.value}
                className={`${item.radius} border-2 border-primary h-35 flex flex-col items-center justify-center gap-4 hover:bg-primary hover:text-white transition-colors group`}
              >
                <span className="font-mono text-sm">{item.value}</span>
                <span className="text-xs text-text-light group-hover:text-sidebar-muted">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className="py-40 bg-gray-50">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="05"
            title="UI Components"
            subtitle="Core building blocks that maintain consistency across the application while providing clear visual hierarchy."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-15">
            {/* Buttons */}
            <div className="bg-white rounded-2xl p-12 border border-border flex flex-col gap-8">
              <span className="text-[11px] tracking-[0.15em] uppercase text-text-light">
                Buttons
              </span>
              <div className="flex flex-wrap gap-3">
                <button className="px-7 py-3.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  Primary
                </button>
                <button className="px-7 py-3.5 bg-white text-primary border-[1.5px] border-primary rounded-xl text-sm font-medium hover:bg-primary hover:text-white transition-all">
                  Secondary
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-7 py-3.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all">
                  Success
                </button>
                <button className="px-7 py-3.5 bg-alert text-white rounded-xl text-sm font-medium hover:bg-red-700 hover:-translate-y-0.5 transition-all">
                  Alert
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-2xl p-12 border border-border flex flex-col gap-8">
              <span className="text-[11px] tracking-[0.15em] uppercase text-text-light">
                Status Badges
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  New
                </span>
                <span className="px-3.5 py-1.5 bg-success-light text-success rounded-full text-xs font-medium">
                  Approved
                </span>
                <span className="px-3.5 py-1.5 bg-warning-light text-warning rounded-full text-xs font-medium">
                  Pending
                </span>
                <span className="px-3.5 py-1.5 bg-alert-light text-alert rounded-full text-xs font-medium">
                  Urgent
                </span>
              </div>
            </div>

            {/* Input */}
            <div className="bg-white rounded-2xl p-12 border border-border flex flex-col gap-8">
              <span className="text-[11px] tracking-[0.15em] uppercase text-text-light">
                Text Input
              </span>
              <input
                type="text"
                placeholder="Enter claim reference..."
                className="w-full px-4.5 py-3.5 border-[1.5px] border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-light"
              />
            </div>

            {/* Avatars */}
            <div className="bg-white rounded-2xl p-12 border border-border flex flex-col gap-8">
              <span className="text-[11px] tracking-[0.15em] uppercase text-text-light">
                Avatars
              </span>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent text-primary flex items-center justify-center text-base font-semibold">
                  JD
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-base font-semibold">
                  CA
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-light text-success flex items-center justify-center text-base font-semibold">
                  MK
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning-light text-warning flex items-center justify-center text-base font-semibold">
                  RS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Loading Components Section */}
      <section className="py-40 bg-gradient-to-br from-gray-50 to-background">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="07"
            title="Loading States"
            subtitle="Consistent loading indicators for async operations and page transitions."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-15">
            {/* Spinner Sizes */}
            <div className="bg-white rounded-2xl p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <h3 className="text-lg font-semibold mb-6">Spinner Sizes</h3>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Spinner size="sm" />
                  <p className="text-xs text-text-muted mt-3">Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-xs text-text-muted mt-3">Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="text-xs text-text-muted mt-3">Large</p>
                </div>
              </div>
            </div>

            {/* Button Loading */}
            <div className="bg-white rounded-2xl p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <h3 className="text-lg font-semibold mb-6">Button Loading</h3>
              <button className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-3 font-medium">
                <Spinner
                  size="sm"
                  className="border-white border-t-transparent"
                />
                Loading...
              </button>
            </div>

            {/* Loading Screen Preview */}
            <div className="bg-white rounded-2xl p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <h3 className="text-lg font-semibold mb-6">Full Screen</h3>
              <div className="bg-background rounded-xl p-8 flex flex-col items-center justify-center border border-border">
                <Spinner size="lg" />
                <p className="text-text-muted text-sm font-medium mt-4">
                  Loading your data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error States Section */}
      <section className="py-40 bg-white">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="08"
            title="Error States"
            subtitle="Consistent error handling for route failures and service unavailability."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-15">
            {/* Route Error */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-lg font-semibold mb-6">Route Error</h3>
              <div className="bg-background rounded-xl p-8 border border-border">
                <div className="text-center">
                  <div className="w-12 h-12 bg-alert-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-alert text-xl">!</span>
                  </div>
                  <h4 className="text-lg font-semibold text-text mb-1">
                    Something went wrong
                  </h4>
                  <p className="text-text-muted text-sm mb-4">
                    An unexpected error occurred
                  </p>
                  <button className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium">
                    Try again
                  </button>
                </div>
              </div>
            </div>

            {/* Service Unavailable */}
            <div className="bg-gray-50 rounded-2xl p-10">
              <h3 className="text-lg font-semibold mb-6">
                Service Unavailable
              </h3>
              <div className="bg-background rounded-xl p-8 border border-border">
                <div className="text-center">
                  <div className="w-12 h-12 bg-alert-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-alert text-xl">!</span>
                  </div>
                  <h4 className="text-lg font-semibold text-text mb-1">
                    Service unavailable
                  </h4>
                  <p className="text-text-muted text-sm mb-4">
                    Unable to connect to the server. Please try again.
                  </p>
                  <button className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium">
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notifications Section */}
      <section className="py-40 bg-gradient-to-br from-gray-50 to-background">
        <div className="container mx-auto px-6 md:px-15">
          <SectionHeader
            number="09"
            title="Toast Notifications"
            subtitle="Feedback notifications for user actions and system events."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-15">
            <button
              onClick={() => toast.success("Action completed successfully")}
              className="bg-success-light text-success px-6 py-4 rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Success Toast
            </button>
            <button
              onClick={() =>
                toast.error("Something went wrong", {
                  description: "Please try again later",
                })
              }
              className="bg-alert-light text-alert px-6 py-4 rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Error Toast
            </button>
            <button
              onClick={() => toast.warning("Your session expires in 5 minutes")}
              className="bg-warning-light text-warning px-6 py-4 rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Warning Toast
            </button>
            <button
              onClick={() => toast.info("New claim has been assigned to you")}
              className="bg-primary/10 text-primary px-6 py-4 rounded-xl font-medium hover:opacity-80 transition-opacity"
            >
              Info Toast
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <button
              onClick={() =>
                toast.success("Claim deleted", {
                  action: {
                    label: "Undo",
                    onClick: () => toast.info("Undo clicked!"),
                  },
                })
              }
              className="bg-white border border-border text-text px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Toast with Action
            </button>
            <button
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 2000)),
                  {
                    loading: "Saving changes...",
                    success: "Changes saved successfully!",
                    error: "Failed to save changes",
                  }
                )
              }
              className="bg-white border border-border text-text px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Promise Toast (2s delay)
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-primary py-25 text-white">
        <div className="container mx-auto px-6 md:px-15 flex flex-wrap justify-between gap-15">
          <div className="max-w-md">
            <div className="text-3xl font-semibold mb-4">
              Cotizate<span className="text-accent">Algo</span>
            </div>
            <p className="text-[10px] tracking-[0.2em] text-sidebar-muted mb-6">
              CLAIMS MANAGER
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              These brand guidelines ensure consistent visual identity across
              all touchpoints. For questions or asset requests, contact the
              design team.
            </p>
          </div>
          <div className="text-xs text-sidebar-muted">
            <span className="font-mono px-3 py-1 bg-white/10 rounded-md inline-block mb-2">
              v1.0.0
            </span>
            <p>Brand Guidelines</p>
            <p>Last updated: January 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-20">
      <p className="font-display text-sm text-text-light mb-4">{number}</p>
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-tight mb-6">
        {title}
      </h2>
      <p className="text-lg font-light text-text-muted max-w-xl leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

function LogoCard({
  variant,
  label,
  children,
}: {
  variant: "dark" | "light" | "accent";
  label: string;
  children: React.ReactNode;
}) {
  const baseClasses =
    "relative p-20 rounded-3xl flex flex-col items-center justify-center min-h-80 transition-transform hover:-translate-y-2";
  const variantClasses = {
    dark: "bg-primary shadow-[0_20px_60px_rgba(8,53,160,0.3)]",
    light:
      "bg-white border border-border shadow-[0_20px_60px_rgba(0,0,0,0.06)]",
    accent: "bg-accent shadow-[0_20px_60px_rgba(255,216,216,0.5)]",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="flex flex-col items-center gap-2">{children}</div>
      <span
        className={`absolute bottom-6 left-6 text-[11px] tracking-wider ${variant === "light" ? "text-text-light" : "text-white/50"}`}
      >
        {label}
      </span>
    </div>
  );
}

function LogoRule({
  type,
  title,
  children,
}: {
  type: "do" | "dont";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-10 bg-white rounded-2xl border border-border">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-3">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${type === "do" ? "bg-success-light text-success" : "bg-alert-light text-alert"}`}
        >
          {type === "do" ? "✓" : "✗"}
        </span>
        {title}
      </h4>
      <p className="text-sm text-text-muted leading-relaxed">{children}</p>
    </div>
  );
}

function ColorCard({
  name,
  role,
  hex,
  rgb,
  className,
  featured,
}: {
  name: string;
  role: string;
  hex: string;
  rgb?: string;
  className: string;
  featured?: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all">
      <div className={`${className} ${featured ? "h-55" : "h-40"}`} />
      <div className="p-6">
        <h3 className="text-base font-semibold mb-1">{name}</h3>
        <p className="text-xs text-text-muted mb-4">{role}</p>
        <div className="flex flex-wrap gap-4">
          <span className="font-mono text-xs px-3 py-1.5 bg-gray-100 rounded-md text-text-muted">
            {hex}
          </span>
          {rgb && (
            <span className="font-mono text-xs px-3 py-1.5 bg-gray-100 rounded-md text-text-muted">
              {rgb}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeScaleItem({
  label,
  sample,
  size,
  className,
}: {
  label: string;
  sample: string;
  size: string;
  className: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] items-baseline py-8 gap-4 md:gap-10">
      <span className="font-mono text-xs text-text-light">{label}</span>
      <span className={className}>{sample}</span>
      <span className="font-mono text-xs text-text-light whitespace-nowrap">
        {size}
      </span>
    </div>
  );
}
