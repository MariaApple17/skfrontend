interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
) => {
  const message = (error as ApiErrorShape).response?.data
    ?.message;

  return typeof message === 'string' ? message : fallback;
};
