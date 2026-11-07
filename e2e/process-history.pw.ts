import { processHistoryChecks } from '../../desktop/e2e/process-history-checks';
import { processHistoryMergeChecks } from '../../desktop/e2e/process-history-merge-checks';
import { commandHeightChecks } from '../../desktop/e2e/command-height-checks';
import { commandGroupHistoryChecks } from '../../desktop/e2e/command-group-history-checks';

processHistoryChecks(['web']);
processHistoryMergeChecks(['web']);
commandHeightChecks(['web']);
commandGroupHistoryChecks(['web']);
