import { auth } from '@/auth';

export const serverFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const session = await auth();

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.user?.accessToken}`
    },
    ...options
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  try {
    const response = await fetch(baseUrl + url, defaultOptions);
    return response;
  } catch (error) {
    throw error;
  }
};
