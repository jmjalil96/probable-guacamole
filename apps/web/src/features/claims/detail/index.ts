// View (main export for route)
export { ClaimDetailView } from "./components";

// Components
export {
  ClaimDetailLayout,
  ClaimDetailHeader,
  ClaimDetailTabs,
  ClaimWorkflowStepper,
  ClaimGeneralTab,
  TransitionModal,
} from "./components";
export type {
  ClaimDetailLayoutProps,
  ClaimDetailHeaderProps,
  ClaimDetailTabsProps,
  ClaimWorkflowStepperProps,
  ClaimGeneralTabProps,
  TransitionModalProps,
} from "./components";

// Edit Components
export { ClaimEditModal, ClaimEditForm } from "./claim-edit.components";
export type {
  ClaimEditModalProps,
  ClaimEditFormProps,
} from "./claim-edit.components";

// Hooks
export {
  useClaimDetail,
  useTabState,
  useModalState,
  useTransitions,
  usePolicyLookup,
  useEditClaimForm,
} from "./hooks";

// Types (grouped interfaces)
export type {
  ClaimDetailTab,
  TabState,
  ModalState,
  TransitionModalConfig,
  TransitionState,
  TransitionHandlers,
  FormError,
  EditFormState,
  EditFormHandlers,
  PolicyLookupState,
  UseClaimDetailReturn,
  TransitionError,
} from "./types";

// Schema
export { editClaimSchema } from "./schema";
export type { EditClaimForm } from "./schema";

// Utils
export {
  extractTransitionError,
  extractFormError,
  mapClaimToFormValues,
  mapFormToRequest,
} from "./utils";

// Invoices Tab
export {
  ClaimInvoicesTab,
  InvoicesTabHeader,
  InvoicesTable,
  InvoiceRowActions,
  InvoiceModal,
  InvoiceForm,
  InvoiceDeleteDialog,
  useInvoicesTab,
  useInvoiceForm,
  invoiceFormSchema,
} from "./invoices";
export type {
  InvoiceFormData,
  UseInvoicesTabReturn,
  UseInvoiceFormReturn,
  ClaimInvoicesTabProps,
} from "./invoices";

// Documents Tab
export {
  ClaimDocumentsTab,
  DocumentsTabHeader,
  DocumentsTable,
  DocumentRowActions,
  DocumentUploadModal,
  DocumentDeleteDialog,
  useDocumentsTab,
  useDocumentUpload,
} from "./documents";
export type {
  UseDocumentsTabReturn,
  ClaimDocumentsTabProps,
} from "./documents";

// Notes Tab
export {
  ClaimNotesTab,
  NotesFeed,
  NoteFeedItem,
  NoteEditModal,
  NoteEditForm,
  NoteDeleteDialog,
  useNotesTab,
  useNoteForm,
  noteFormSchema,
} from "./notes";
export type {
  NoteFormData,
  UseNotesTabReturn,
  ClaimNotesTabProps,
} from "./notes";
