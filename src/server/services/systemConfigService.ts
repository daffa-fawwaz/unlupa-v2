import { prisma } from '../db';
import { wsManager } from '../websocket';
import { SystemTierConfig, createDefaultTierConfig } from '../../types';

export const systemConfigService = {
  /**
   * Fetch active tier configuration.
   * If not yet seeded in database, seeds default configuration.
   */
  async getTierConfig(): Promise<SystemTierConfig> {
    try {
      const record = await prisma.systemTierConfig.findUnique({
        where: { id: 'default' },
      });

      if (!record || !record.config) {
        const defaultConfig = createDefaultTierConfig();
        const seeded = await prisma.systemTierConfig.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            config: defaultConfig as any,
            updatedBy: 'System Default',
          },
          update: {
            config: defaultConfig as any,
            updatedBy: 'System Default',
          },
        });
        return {
          ...defaultConfig,
          ...(seeded.config as object),
          updatedAt: seeded.updatedAt.toISOString(),
          updatedBy: seeded.updatedBy || 'System Default',
        };
      }

      const defaults = createDefaultTierConfig();
      const rawConfig = (record.config as any) || {};

      // Deep merge with defaults to ensure all keys exist
      const mergedConfig: SystemTierConfig = {
        freeTier: {
          ...defaults.freeTier,
          ...(rawConfig.freeTier || {}),
        },
        premiumTier: {
          ...defaults.premiumTier,
          ...(rawConfig.premiumTier || {}),
        },
        pricing: {
          ...defaults.pricing,
          ...(rawConfig.pricing || {}),
        },
        updatedAt: record.updatedAt.toISOString(),
        updatedBy: record.updatedBy || 'System',
      };

      return mergedConfig;
    } catch (err) {
      console.error('[SystemConfigService] Error fetching tier config, falling back to defaults:', err);
      return createDefaultTierConfig();
    }
  },

  /**
   * Update system tier limits & broadcast updates to all active clients.
   */
  async updateTierConfig(newConfig: Partial<SystemTierConfig>, updatedBy?: string): Promise<SystemTierConfig> {
    const currentConfig = await this.getTierConfig();

    const updatedConfig: SystemTierConfig = {
      freeTier: {
        ...currentConfig.freeTier,
        ...(newConfig.freeTier || {}),
      },
      premiumTier: {
        ...currentConfig.premiumTier,
        ...(newConfig.premiumTier || {}),
      },
      pricing: {
        ...currentConfig.pricing,
        ...(newConfig.pricing || {}),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || currentConfig.updatedBy || 'Admin',
    };

    const savedRecord = await prisma.systemTierConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        config: updatedConfig as any,
        updatedBy: updatedConfig.updatedBy,
      },
      update: {
        config: updatedConfig as any,
        updatedBy: updatedConfig.updatedBy,
      },
    });

    const finalConfig: SystemTierConfig = {
      ...updatedConfig,
      updatedAt: savedRecord.updatedAt.toISOString(),
      updatedBy: savedRecord.updatedBy || updatedConfig.updatedBy,
    };

    // Broadcast change to all connected WebSocket clients instantly
    try {
      wsManager.broadcastAll({
        type: 'SYSTEM_TIER_CONFIG_UPDATED',
        data: finalConfig,
        timestamp: new Date().toISOString(),
      });
      console.log('[SystemConfigService] Broadcasted tier config update to all connected clients');
    } catch (wsErr) {
      console.warn('[SystemConfigService] WebSocket broadcast warning:', wsErr);
    }

    return finalConfig;
  },
};
