// Schema
export { newClaimSchema } from "./schema";
export type { NewClaimForm } from "./schema";

// Types
export type {
  FormState,
  HeaderState,
  HeaderHandlers,
  CascadingSelectsState,
  FileUploadState,
  ExitDialogState,
  UseNewClaimReturn,
  NewClaimLayoutProps,
  InsuredInfoCardProps,
  ClaimDetailsCardProps,
} from "./types";

// Hooks
export { useNewClaimForm, useCascadingSelects } from "./hooks";
export type {
  UseCascadingSelectsOptions,
  UseCascadingSelectsReturn,
} from "./hooks";

// Components
export {
  NewClaimView,
  NewClaimLayout,
  NewClaimHeader,
  InsuredInfoCard,
  ClaimDetailsCard,
  ImportantInfoPanel,
  // UI Components
  StepCard,
  InfoItem,
  CascadingSelectField,
} from "./components";
export type {
  NewClaimHeaderProps,
  ImportantInfoPanelProps,
  StepCardProps,
  StepCardVariant,
  InfoItemProps,
  CascadingSelectFieldProps,
} from "./components";
