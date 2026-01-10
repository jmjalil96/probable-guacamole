// View (main export for route)
export { ClientDetailView } from "./components";

// Components
export {
  ClientDetailLayout,
  ClientDetailHeader,
  ClientInfoSection,
} from "./components";
export type {
  ClientDetailLayoutProps,
  ClientDetailHeaderProps,
  ClientInfoSectionProps,
  ClientDetailViewProps,
} from "./components";

// Edit Components
export {
  ClientForm,
  ClientCreateModal,
  ClientEditModal,
  ClientDeleteDialog,
} from "./client-edit.components";
export type {
  ClientFormProps,
  ClientCreateModalProps,
  ClientEditModalProps,
  ClientDeleteDialogProps,
} from "./client-edit.components";

// Hooks
export {
  useClientDetail,
  useModalState,
  useClientForm,
  useClientCreateForm,
} from "./hooks";

// Types
export type {
  FormError,
  ModalState,
  DeleteState,
  UseClientFormReturn,
  UseClientDetailReturn,
} from "./types";

// Schema
export { clientFormSchema } from "./schema";
export type { ClientFormData } from "./schema";

// Utils
export { extractFormError, mapClientToFormValues, mapFormToRequest } from "./utils";
