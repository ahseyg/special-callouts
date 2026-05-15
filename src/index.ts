/**
 * Special Callouts - Module Index
 * Re-exports all public modules for convenience
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Parser
export * from './parser';

// Processor
export { CalloutProcessor } from './processor';

// Modals
export { CustomCalloutSuggester } from './modals/SuggesterModal';
export { showMetadataReference } from './modals/MetadataModal';
export { showHowToUse } from './modals/HowToModal';

// Settings
export { SpecialCalloutsSettingTab } from './settings/SettingsTab';
