import { screen, within } from "@testing-library/react";

/**
 * Assert that a form field has an error message
 */
export function expectFieldError(fieldName: string, errorMessage: string) {
  const field = screen.getByLabelText(new RegExp(fieldName, "i"));
  const formField = field.closest("[data-field]") ?? field.parentElement;

  if (!formField) {
    throw new Error(`Could not find form field container for "${fieldName}"`);
  }

  const error = within(formField as HTMLElement).queryByText(errorMessage);
  if (!error) {
    throw new Error(
      `Expected error message "${errorMessage}" not found in field "${fieldName}"`
    );
  }
}

/**
 * Get loading indicator element
 */
export function getLoadingElement(): HTMLElement | null {
  return (
    screen.queryByRole("status") ?? screen.queryByTestId("loading-spinner")
  );
}

/**
 * Get toast notification element
 */
export async function getToastElement(): Promise<HTMLElement> {
  return screen.findByRole("status");
}

/**
 * Get modal dialog element
 */
export function getModalElement(): HTMLElement | null {
  return screen.queryByRole("dialog");
}

/**
 * Check if modal contains text
 */
export function modalContainsText(titleOrLabel: string | RegExp): boolean {
  const dialog = screen.queryByRole("dialog");
  if (!dialog) return false;

  const textElement =
    within(dialog).queryByText(titleOrLabel) ??
    within(dialog).queryByRole("heading", { name: titleOrLabel });

  return textElement !== null;
}
