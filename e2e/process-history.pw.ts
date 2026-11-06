import { processHistoryChecks } from '../../desktop/e2e/process-history-checks';
import { processHistoryMergeChecks } from '../../desktop/e2e/process-history-merge-checks';

processHistoryChecks(['web']);
processHistoryMergeChecks(['web']);
