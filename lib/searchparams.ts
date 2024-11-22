import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  q: parseAsString,
  gender: parseAsString,
  mj_id: parseAsString,
  status: parseAsString,
  categories: parseAsString,
  token_name: parseAsString,
  model_name: parseAsString,
  channel: parseAsString,
  username: parseAsString,
  type: parseAsString,
  start_timestamp: parseAsString,
  end_timestamp: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
