export interface InstallationStats {
  totalInstalled: number;
  registeredCount: number;
}

/**
 * Validates installation parameters
 *
 * @throws {Error} When registered count exceeds total installed
 */
export function validateInstallationParams(params: InstallationStats) {
  if (params.registeredCount > params.totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }
}
