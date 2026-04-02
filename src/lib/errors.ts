export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Errors = {
  NOT_FOUND: (resource: string) => new ApiError('NOT_FOUND', 404, `${resource} not found`),
  UNAUTHORIZED: () => new ApiError('UNAUTHORIZED', 401, 'Unauthorized'),
  FORBIDDEN: () => new ApiError('FORBIDDEN', 403, 'Forbidden'),
  BAD_REQUEST: (message: string) => new ApiError('BAD_REQUEST', 400, message),
  INTERNAL: (message: string) => new ApiError('INTERNAL_ERROR', 500, message),
};
