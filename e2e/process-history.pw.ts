import { processHistoryChecks } from '../../desktop/e2e/process-history-checks';
import { processHistoryMergeChecks } from '../../desktop/e2e/process-history-merge-checks';
import { commandHeightChecks } from '../../desktop/e2e/command-height-checks';

processHistoryChecks(['web']);
processHistoryMergeChecks(['web']);
commandHeightChecks(['web']);
