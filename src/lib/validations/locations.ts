// Re-export location and loan types from inventory
// This file exists for backward compatibility and cleaner imports

export {
  // Location schemas
  locationSchema,
  locationPatchSchema,
  type LocationFormData,
  type LocationPatchData,
  type InventoryLocation,

  // Loan schemas
  loanSchema,
  returnSchema,
  RETURN_CONDITION,
  RETURN_CONDITION_CONFIG,
  type LoanFormData,
  type ReturnFormData,
  type ReturnCondition,
  type InventoryLoan,
} from "./inventory"
