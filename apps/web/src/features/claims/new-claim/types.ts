import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { ClaimFileCategory } from "shared";
import type { SelectOption } from "@/components/ui";
import type {
  UseFileUploadReturn,
  FileCategory,
  CategoryIcons,
} from "@/components/file-uploader";
import type { LookupState } from "../shared";
import type { NewClaimForm } from "./schema";

// =============================================================================
// Form State
// =============================================================================

export interface FormState {
  control: Control<NewClaimForm>;
  errors: FieldErrors<NewClaimForm>;
  handleSubmit: UseFormHandleSubmit<NewClaimForm>;
}

// =============================================================================
// Header State & Handlers
// =============================================================================

export interface HeaderState {
  isBusy: boolean;
  canSubmit: boolean;
}

export interface HeaderHandlers {
  onCancel: () => void;
}

// =============================================================================
// Cascading Selects State
// =============================================================================

export interface CascadingSelectsState {
  clientId: string;
  affiliateId: string;
  clientOptions: SelectOption[];
  affiliateOptions: SelectOption[];
  patientOptions: SelectOption[];
  clients: LookupState;
  affiliates: LookupState;
  patients: LookupState;
}

// =============================================================================
// File Upload State
// =============================================================================

export interface FileUploadState extends UseFileUploadReturn<ClaimFileCategory> {
  categories: FileCategory<ClaimFileCategory>[];
  categoryIcons: CategoryIcons<ClaimFileCategory>;
}

// =============================================================================
// Exit Dialog State
// =============================================================================

export interface ExitDialogState {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseNewClaimReturn {
  formState: FormState;
  headerState: HeaderState;
  headerHandlers: HeaderHandlers;
  selectsState: CascadingSelectsState;
  fileUpload: FileUploadState;
  exitDialog: ExitDialogState;
  onSubmit: (data: NewClaimForm) => Promise<void>;
}

// =============================================================================
// Layout Props
// =============================================================================

export interface NewClaimLayoutProps {
  formState: FormState;
  headerState: HeaderState;
  headerHandlers: HeaderHandlers;
  selectsState: CascadingSelectsState;
  fileUpload: FileUploadState;
  exitDialog: ExitDialogState;
  onSubmit: (data: NewClaimForm) => Promise<void>;
}

// =============================================================================
// Component Props (grouped)
// =============================================================================

export interface InsuredInfoCardProps {
  formState: FormState;
  selectsState: CascadingSelectsState;
}

export interface ClaimDetailsCardProps {
  formState: FormState;
  fileUpload: FileUploadState;
  isBusy: boolean;
}
