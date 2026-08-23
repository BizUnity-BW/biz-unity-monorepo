import { Request, Response } from 'express';
import { statementQuerySchema } from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { csvFileName, toCsv } from '../../shared/utils/csv';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

/** ISO date only, so the CSV sorts and parses predictably in a spreadsheet. */
function isoDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : '';
}

export async function statement(req: Request, res: Response): Promise<void> {
  const parsed = statementQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }

  const { org } = req as AuthenticatedRequest;
  const { format, ...query } = parsed.data;
  const result = await service.getStatement(org.id, query);

  if (!result) {
    fail(res, 'Not found', 404);
    return;
  }

  if (format === 'json') {
    ok(res, result);
    return;
  }

  const csv = toCsv(result.rows, [
    { header: 'Date paid', value: (row) => isoDate(row.paidAt) },
    { header: 'Invoice', value: (row) => row.invoiceNumber },
    { header: 'Customer', value: (row) => row.customerName },
    { header: 'Method', value: (row) => row.method },
    { header: 'Reference', value: (row) => row.reference },
    {
      header: `Amount (${result.organisation.currency})`,
      value: (row) => (row.amountCents / 100).toFixed(2),
    },
    { header: 'Verified on', value: (row) => isoDate(row.verifiedAt) },
    { header: 'Verified by', value: (row) => row.verifiedBy },
    { header: 'Proof documents', value: (row) => row.proofCount },
  ]);

  const name = csvFileName(
    `verified-payments-${result.customer?.name ?? 'all-customers'}-${query.from}-to-${query.to}`,
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.status(200).send(csv);
}
