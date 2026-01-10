// View (main export for route)
export { InsurerDetailView } from "./components";

// Components
export {
  InsurerDetailLayout,
  InsurerDetailHeader,
  InsurerInfoSection,
} from "./components";
export type {
  InsurerDetailLayoutProps,
  InsurerDetailHeaderProps,
  InsurerInfoSectionProps,
  InsurerDetailViewProps,
} from "./components";

// Edit Components
export {
  InsurerForm,
  InsurerCreateModal,
  InsurerEditModal,
  InsurerDeleteDialog,
} from "./insurer-edit.components";
export type {
  InsurerFormProps,
  InsurerCreateModalProps,
  InsurerEditModalProps,
  InsurerDeleteDialogProps,
} from "./insurer-edit.components";

// Hooks
export {
  useInsurerDetail,
  useModalState,
  useInsurerForm,
  useInsurerCreateForm,
} from "./hooks";

// Types
export type {
  FormError,
  ModalState,
  DeleteState,
  UseInsurerFormReturn,
  UseInsurerDetailReturn,
} from "./types";

// Schema
export { insurerFormSchema } from "./schema";
export type { InsurerFormData } from "./schema";

// Utils
export { extractFormError, mapInsurerToFormValues, mapFormToRequest } from "./utils";
