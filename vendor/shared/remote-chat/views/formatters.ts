import { getLanguage } from '../../localization/browserClient';
import { contextUsageLabel as formatContextUsage } from '../contextUsage';
import type { ThreadTokenUsage } from './types';

export { formatTurnDuration } from '../../conversation/turnTiming';
export const contextUsageLabel = (usage?: ThreadTokenUsage) => formatContextUsage(usage, getLanguage());
