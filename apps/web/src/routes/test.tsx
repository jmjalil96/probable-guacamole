import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  Input,
  PasswordInput,
  FormField,
  Logo,
} from "@/components/ui";
import { ArrowRight, Mail, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/test")({
  component: TestPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TestPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-2xl font-semibold text-text">Components</h1>

        {/* BUTTON */}
        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <span className="mx-2 text-border">|</span>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-5 w-5" />
            </Button>
            <span className="mx-2 text-border">|</span>
            <Button>
              <Mail className="h-4 w-4" />
              With Icon
            </Button>
            <Button disabled>Disabled</Button>
            <Button
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
            >
              {loading ? "Loading..." : "Click me"}
            </Button>
          </div>
        </Section>

        {/* INPUT */}
        <Section title="Input">
          <div className="grid grid-cols-4 gap-3">
            <Input placeholder="Default" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Error state" error />
            <Input defaultValue="With value" />
          </div>
        </Section>

        {/* PASSWORD INPUT */}
        <Section title="PasswordInput">
          <div className="grid grid-cols-4 gap-3">
            <PasswordInput placeholder="Password" />
            <PasswordInput defaultValue="secret123" />
            <PasswordInput placeholder="Disabled" disabled />
            <PasswordInput placeholder="Error" error />
          </div>
        </Section>

        {/* FORM FIELD */}
        <Section title="FormField">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Email" htmlFor="f1">
              <Input id="f1" placeholder="tu@empresa.com" />
            </FormField>
            <FormField label="Password" htmlFor="f2" error="Required">
              <PasswordInput id="f2" error />
            </FormField>
            <FormField
              label="Password"
              htmlFor="f3"
              labelAction={
                <Link
                  to="/test"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Forgot?
                </Link>
              }
            >
              <PasswordInput id="f3" placeholder="With action" />
            </FormField>
          </div>
        </Section>

        {/* LOGO */}
        <Section title="Logo">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
            <div className="rounded-lg bg-primary px-4 py-2">
              <Logo variant="light" size="lg" />
            </div>
            <div className="rounded-lg bg-primary px-4 py-2">
              <Logo variant="light" size="lg" showTagline />
            </div>
          </div>
        </Section>

        {/* COMPLETE FORM EXAMPLE */}
        <Section title="Example Form">
          <div className="max-w-sm space-y-4 rounded-xl border border-border bg-white p-6">
            <FormField label="Email" htmlFor="ex-email">
              <Input id="ex-email" type="email" placeholder="tu@empresa.com" />
            </FormField>
            <FormField
              label="Password"
              htmlFor="ex-pw"
              labelAction={
                <Link
                  to="/test"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </Link>
              }
            >
              <PasswordInput id="ex-pw" placeholder="Enter password" />
            </FormField>
            <Button className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
