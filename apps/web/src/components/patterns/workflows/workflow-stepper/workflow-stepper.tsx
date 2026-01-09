import {
  Check,
  X,
  RotateCcw,
  Clock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button, DropdownMenu } from "@/components/ui";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface WorkflowStep<TStatus extends string = string> {
  /** Status ID for this step. */
  id: TStatus;
  /** Display label for the step. */
  label: string;
}

export interface WorkflowStepperProps<TStatus extends string = string> {
  /** Main path steps to visualize. */
  steps: WorkflowStep<TStatus>[];
  /** Current status (can be on or off the main path). */
  currentStatus: TStatus;
  /** Valid transitions from each status. */
  transitions: Record<TStatus, TStatus[]>;
  /** Statuses with no outgoing transitions. */
  terminalStates: TStatus[];
  /** Transition callback. */
  onTransition?: ((to: TStatus) => void) | undefined;
  /** Whether a transition is in progress. */
  isBusy?: boolean | undefined;
  /** Display labels for statuses. */
  statusLabels?: Partial<Record<TStatus, string>> | undefined;
  /** Display labels for transitions ("FROM->TO" format). */
  transitionLabels?: Record<string, string> | undefined;
  /** Terminal state styling variants. */
  terminalVariants?:
    | Partial<Record<TStatus, "success" | "warning" | "error">>
    | undefined;
  /** Off-path states that should show a badge. */
  offPathDisplay?: Partial<Record<TStatus, { label: string }>> | undefined;
  /** Override primary action logic. */
  getPrimaryAction?:
    | ((currentStatus: TStatus, available: TStatus[]) => TStatus | null)
    | undefined;
  /** Cancel transition ID. */
  cancelStatus?: TStatus | undefined;
  /** Additional class names. */
  className?: string | undefined;
}

type StepState =
  | "completed"
  | "current"
  | "future"
  | "terminal-success"
  | "terminal-warning"
  | "terminal-error";

type TerminalVariant = "success" | "warning" | "error";

// =============================================================================
// Component
// =============================================================================

/**
 * A generic workflow stepper that visualizes state machine progress.
 * Completely data-driven with no domain knowledge.
 *
 * @example
 * ```tsx
 * <WorkflowStepper
 *   steps={[
 *     { id: "DRAFT", label: "Draft" },
 *     { id: "IN_REVIEW", label: "In Review" },
 *     { id: "SETTLED", label: "Settled" },
 *   ]}
 *   currentStatus="IN_REVIEW"
 *   transitions={{
 *     DRAFT: ["IN_REVIEW", "CANCELLED"],
 *     IN_REVIEW: ["SETTLED", "CANCELLED"],
 *     SETTLED: [],
 *     CANCELLED: [],
 *   }}
 *   terminalStates={["SETTLED", "CANCELLED"]}
 *   onTransition={(to) => handleStatusChange(to)}
 * />
 * ```
 */
export function WorkflowStepper<TStatus extends string = string>({
  steps,
  currentStatus,
  transitions,
  terminalStates,
  onTransition,
  isBusy = false,
  statusLabels,
  transitionLabels,
  terminalVariants,
  offPathDisplay,
  getPrimaryAction,
  cancelStatus,
  className,
}: WorkflowStepperProps<TStatus>) {
  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const isTerminal = terminalStates.includes(currentStatus);
  const isOnMainPath = steps.some((s) => s.id === currentStatus);
  const currentMainIndex = steps.findIndex((s) => s.id === currentStatus);
  const offPathConfig = offPathDisplay?.[currentStatus];
  const available = transitions[currentStatus] || [];

  // Compute terminal variant with smart fallback
  const terminalVariant: TerminalVariant =
    terminalVariants?.[currentStatus] ??
    (cancelStatus && currentStatus === cancelStatus ? "error" : "success");

  // For off-path states, find which main step leads to current status
  const getOffPathCompletedIndex = (): number => {
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (!step) continue;
      const stepTransitions = transitions[step.id] || [];
      if (stepTransitions.includes(currentStatus)) {
        return i;
      }
    }
    return -1;
  };

  const offPathCompletedIndex = !isOnMainPath ? getOffPathCompletedIndex() : -1;

  // ---------------------------------------------------------------------------
  // Step state calculation
  // ---------------------------------------------------------------------------

  const getStepState = (stepIndex: number): StepState => {
    const isLastStep = stepIndex === steps.length - 1;

    // Terminal states show on the last step
    if (isTerminal && isLastStep) {
      return `terminal-${terminalVariant}` as StepState;
    }

    // On main path
    if (isOnMainPath) {
      if (stepIndex < currentMainIndex) return "completed";
      if (stepIndex === currentMainIndex) return "current";
      return "future";
    }

    // Off-path (e.g., PENDING_INFO)
    if (offPathCompletedIndex !== -1) {
      if (stepIndex <= offPathCompletedIndex) return "completed";
      return "future";
    }

    return "future";
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const primaryAction: TStatus | null = getPrimaryAction
    ? getPrimaryAction(currentStatus, available)
    : (available.find((t) => t !== cancelStatus) ?? null);

  const secondaryActions = available.filter(
    (t) => t !== primaryAction && t !== cancelStatus
  );

  const canCancel = cancelStatus ? available.includes(cancelStatus) : false;

  const getTransitionLabel = (to: TStatus): string => {
    const key = `${currentStatus}->${to}`;
    return transitionLabels?.[key] || statusLabels?.[to] || to;
  };

  const getStatusLabel = (status: TStatus): string => {
    return statusLabels?.[status] || status;
  };

  // ---------------------------------------------------------------------------
  // Terminal display label (for RETURNED/CANCELLED showing on last step)
  // ---------------------------------------------------------------------------

  const getTerminalDisplayLabel = (stepIndex: number): string => {
    const step = steps[stepIndex];
    if (!step) return "";
    const isLastStep = stepIndex === steps.length - 1;
    if (isTerminal && isLastStep && currentStatus !== step.id) {
      return getStatusLabel(currentStatus);
    }
    return step.label;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      role="group"
      aria-label="Workflow status"
      className={cn(
        "flex items-center justify-between gap-6",
        "rounded-lg border border-border bg-background px-6 py-4",
        className
      )}
    >
      {/* Steps */}
      <div className="flex min-w-0 flex-1 items-center overflow-x-auto">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const isCompleted = state === "completed";
          const isCurrent = state === "current";
          const displayLabel = getTerminalDisplayLabel(index);

          return (
            <div
              key={step.id}
              className="flex items-center"
              style={{ flex: index < steps.length - 1 ? 1 : "none" }}
              {...(isCurrent && { "aria-current": "step" })}
            >
              {/* Step content */}
              <div className="flex items-center gap-2.5">
                {/* Indicator */}
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    isCompleted && "bg-success text-white",
                    isCurrent && "bg-primary text-white ring-4 ring-primary/15",
                    state === "future" && "bg-border text-text-muted",
                    state === "terminal-success" &&
                      "bg-success text-white ring-4 ring-success/15",
                    state === "terminal-warning" &&
                      "bg-warning text-white ring-4 ring-warning/15",
                    state === "terminal-error" &&
                      "bg-alert text-white ring-4 ring-alert/15"
                  )}
                >
                  {isCompleted || state === "terminal-success" ? (
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  ) : state === "terminal-warning" ? (
                    <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                  ) : state === "terminal-error" ? (
                    <X size={14} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "whitespace-nowrap text-[13px] font-medium",
                    isCompleted && "text-success",
                    isCurrent && "font-semibold text-primary",
                    state === "future" && "text-text-muted",
                    state === "terminal-success" &&
                      "font-semibold text-success",
                    state === "terminal-warning" &&
                      "font-semibold text-warning",
                    state === "terminal-error" && "font-semibold text-alert"
                  )}
                >
                  {displayLabel}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 min-w-8 max-w-14 flex-1",
                    isCompleted ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}

        {/* Off-path badge */}
        {offPathConfig && (
          <div className="ml-3 flex items-center gap-1.5 rounded-full bg-warning-light px-3 py-1.5 text-xs font-semibold text-warning-text">
            <Clock size={14} aria-hidden="true" />
            <span>{offPathConfig.label}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {isTerminal ? (
          // Terminal badge
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold",
              terminalVariant === "success" &&
                "bg-success-light text-success-text",
              terminalVariant === "warning" &&
                "bg-warning-light text-warning-text",
              terminalVariant === "error" && "bg-alert-light text-alert"
            )}
          >
            {terminalVariant === "success" && (
              <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
            {terminalVariant === "warning" && (
              <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
            )}
            {terminalVariant === "error" && (
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
            <span>{getStatusLabel(currentStatus)}</span>
          </div>
        ) : (
          <>
            {/* Primary action */}
            {primaryAction && (
              <Button
                disabled={!onTransition || isBusy}
                onClick={() => onTransition?.(primaryAction)}
                className={cn(
                  "gap-1.5 text-[13px] font-semibold",
                  // Use success color for settle action
                  terminalVariants?.[primaryAction] === "success" &&
                    "bg-success hover:bg-success-hover"
                )}
              >
                {getTransitionLabel(primaryAction)}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            )}

            {/* More dropdown */}
            {(secondaryActions.length > 0 || canCancel) && (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="secondary"
                    disabled={!onTransition || isBusy}
                    className="gap-1.5 text-[13px]"
                  >
                    Más
                    <ChevronDown
                      size={16}
                      className="text-text-muted"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  {secondaryActions.map((action) => (
                    <DropdownMenu.Item
                      key={action}
                      disabled={!onTransition || isBusy}
                      onClick={() => onTransition?.(action)}
                    >
                      {getTransitionLabel(action)}
                    </DropdownMenu.Item>
                  ))}
                  {secondaryActions.length > 0 && canCancel && (
                    <DropdownMenu.Separator />
                  )}
                  {canCancel && cancelStatus && (
                    <DropdownMenu.Item
                      destructive
                      disabled={!onTransition || isBusy}
                      onClick={() => onTransition?.(cancelStatus)}
                    >
                      {getTransitionLabel(cancelStatus)}
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu>
            )}
          </>
        )}
      </div>
    </div>
  );
}
