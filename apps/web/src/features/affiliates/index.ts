// =============================================================================
// Affiliates Feature - Public API
// =============================================================================

// API Layer
export { affiliateKeys, useListAffiliates, useAffiliate } from "./api";

// Shared
export {
  ACTIVE_STYLES,
  ACTIVE_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  PORTAL_ACCESS_OPTIONS,
  AFFILIATE_FIELD_LABELS,
  AffiliatesErrorState,
  AffiliatesFetchingOverlay,
  AffiliateDetailError,
} from "./shared";
export type {
  AffiliatesErrorStateProps,
  AffiliateDetailErrorProps,
} from "./shared";

// Browse
export {
  affiliatesSearchSchema,
  affiliatesColumns,
  useAffiliatesUrlState,
  useAffiliatesFilters,
  useAffiliatesTableState,
  useAffiliatesList,
  AffiliatesViewLayout,
  AffiliatesFilterChips,
  AffiliatesFiltersInline,
  AffiliatesFiltersSheet,
  AffiliatesListHeader,
  AffiliatesTable,
  AffiliatesListView,
} from "./browse";
export type {
  AffiliatesSearch,
  ActiveFilter,
  UseAffiliatesUrlStateReturn,
  UseAffiliatesTableStateReturn,
  AffiliatesFilters,
  UseAffiliatesFiltersReturn,
  UseAffiliatesListReturn,
  AffiliatesViewLayoutProps,
  FilterState,
  FilterHandlers,
  SheetState,
  AffiliatesFilterChipsProps,
  AffiliatesFiltersInlineProps,
  AffiliatesFiltersSheetProps,
  AffiliatesListHeaderProps,
  AffiliatesTableProps,
} from "./browse";

// Detail
export {
  useAffiliateDetail,
  AffiliateDetailHeader,
  AffiliateMainTab,
  AffiliateDetailLayout,
  AffiliateDetailView,
} from "./detail";
export type {
  UseAffiliateDetailReturn,
  AffiliateDetailLayoutProps,
  AffiliateDetailHeaderProps,
  AffiliateMainTabProps,
  AffiliateDetailViewProps,
} from "./detail";
