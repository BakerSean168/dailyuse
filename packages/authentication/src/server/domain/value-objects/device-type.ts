import { DeviceType as DeviceTypeContract, type DeviceType as IDeviceType } from '@dailyuse/contracts/authentication';

/**
 * Device Type - classification of login devices.
 *
 * Branded Type: string at runtime, with compile-time type safety.
 */
export type DeviceType = IDeviceType & { readonly __brand: unique symbol };

/**
 * Valid value set - Single Source of Truth
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IDeviceType[] = Object.values(DeviceTypeContract);

/**
 * Companion object - provides static methods and behavior logic.
 */
export const DeviceType = {
  // ================= Constants =================

  Desktop: 'Desktop' as DeviceType,
  Mobile: 'Mobile' as DeviceType,
  Tablet: 'Tablet' as DeviceType,
  Browser: 'Browser' as DeviceType,
  Api: 'Api' as DeviceType,
  Unknown: 'Unknown' as DeviceType,

  // ================= Factory Methods =================

  /**
   * Factory method: validates and converts to DeviceType.
   */
  of(value: string): DeviceType {
    if (!this.isValid(value)) {
      throw new Error(`Invalid device type: ${value}`);
    }
    return value as DeviceType;
  },

  // ================= Type Guards =================

  /**
   * Type guard: runtime type check.
   */
  isValid(value: string): value is DeviceType {
    return VALUES.includes(value as IDeviceType);
  },

  /**
   * Returns all available values.
   */
  getAll(): DeviceType[] {
    return VALUES as DeviceType[];
  },

  // ================= Behavior Methods (State Logic) =================

  /**
   * Checks if the type is a mobile device (iOS or Android).
   */
  isMobile(type: DeviceType): boolean {
    return type === this.Mobile;
  },

  /**
   * Checks if the type is a web browser.
   */
  isBrowser(type: DeviceType): boolean {
    return type === this.Browser;
  },

  /**
   * Checks if the type is a desktop application.
   */
  isDesktop(type: DeviceType): boolean {
    return type === this.Desktop;
  },

  /**
   * Checks if the type is a tablet device.
   */
  isTablet(type: DeviceType): boolean {
    return type === this.Tablet;
  },

  /**
   * Checks if the type is a small-screen device (mobile or tablet).
   */
  isSmallScreen(type: DeviceType): boolean {
    return this.isMobile(type) || this.isTablet(type);
  },
};
