import { Request, Response } from 'express';
import {
  documentListQuerySchema,
  documentMetadataSchema,
  uploadSlotSchema,
} from '../../shared/validators';
import { ok, fail } from '../../shared/utils';
import { AuthenticatedRequest } from '../../shared/types';
import * as service from './service';

/** Maps a service failure onto a status code and a message the user can act on. */
function failFor(res: Response, error: service.DocumentError): void {
  switch (error) {
    case 'NOT_FOUND':
      fail(res, 'Not found', 404);
      return;
    case 'UNSUPPORTED_TYPE':
      fail(res, 'That file type is not accepted for this document', 422);
      return;
    case 'FILE_TOO_LARGE':
      fail(res, 'That file is larger than the limit for this document', 422);
      return;
    case 'PAYMENT_REQUIRED':
      fail(res, 'A paymentId is required for proof of payment', 422);
      return;
    case 'PAYMENT_NOT_FOUND':
      fail(res, 'Payment not found', 404);
      return;
    case 'PROFILE_NOT_FOUND':
      fail(res, 'User profile not found', 404);
      return;
    case 'UPLOAD_NOT_FOUND':
      // The row exists but the bytes never arrived, so the client should retry leg 2.
      fail(res, 'No uploaded file found for this document. Upload it and confirm again.', 409);
      return;
    case 'STORAGE_FAILED':
      fail(res, 'Storage is unavailable, please try again', 502);
      return;
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const parsed = documentListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { org } = req as AuthenticatedRequest;
  ok(res, await service.listDocuments(org.id, parsed.data));
}

export async function createUploadSlot(req: Request, res: Response): Promise<void> {
  const parsed = uploadSlotSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { org, profile } = req as AuthenticatedRequest;
  const result = await service.createUploadSlot(org.id, profile.id, parsed.data);
  if ('error' in result) {
    failFor(res, result.error);
    return;
  }
  ok(res, result, 201);
}

export async function confirm(req: Request, res: Response): Promise<void> {
  const { org, profile } = req as AuthenticatedRequest;
  const result = await service.confirmUpload(req.params.id as string, org.id, profile.orgRole);
  if ('error' in result) {
    failFor(res, result.error);
    return;
  }
  ok(res, result.document);
}

export async function downloadUrl(req: Request, res: Response): Promise<void> {
  const { org } = req as AuthenticatedRequest;
  const result = await service.createDownloadUrl(req.params.id as string, org.id);
  if ('error' in result) {
    failFor(res, result.error);
    return;
  }
  ok(res, result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = documentMetadataSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed', 422, parsed.error.flatten());
    return;
  }
  const { org } = req as AuthenticatedRequest;
  const result = await service.updateDocument(req.params.id as string, org.id, parsed.data);
  if ('error' in result) {
    failFor(res, result.error);
    return;
  }
  ok(res, result.document);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { org, profile } = req as AuthenticatedRequest;
  const result = await service.deleteDocument(
    req.params.id as string,
    org.id,
    profile.id,
    profile.orgRole,
  );
  if ('error' in result) {
    failFor(res, result.error);
    return;
  }
  ok(res, null);
}
