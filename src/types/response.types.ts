export type ErrorDetails = {
  message: string;
  code: string;
  path?: string[];
  details?: unknown;
};

export type DefaultSuccessResponse<T> = {
  status: 'success' | 'error';
  data: T;
  errors: null;
};

export type DefaultErrorResponse = {
  status: 'error';
  data: null;
  errors: ErrorDetails[];
};
