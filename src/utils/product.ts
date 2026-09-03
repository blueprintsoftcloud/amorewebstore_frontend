import { resolveAssetUrl } from "./category";

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
};

const normalizeCategoryRef = (category: unknown) => {
  if (!category || typeof category !== "object") return category;

  const raw = category as Record<string, unknown>;
  const id = pickString(raw.id, raw._id);
  const name = pickString(raw.name, raw.title);

  return {
    ...raw,
    ...(id ? { id, _id: id } : {}),
    ...(name ? { name } : {}),
  };
};

export const normalizeProduct = <T extends Record<string, unknown>>(input: T) => {
  const raw = input ?? ({} as T);
  const nested =
    raw && typeof raw._doc === "object" && raw._doc !== null
      ? (raw._doc as Record<string, unknown>)
      : {};

  const id = pickString(raw.id, raw._id, nested.id, nested._id);
  const image = pickString(raw.image, nested.image);
  const images = [...(Array.isArray(raw.images) ? raw.images : []), ...(Array.isArray(nested.images) ? nested.images : [])]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => resolveAssetUrl(value) ?? value);

  const normalizedCategory = normalizeCategoryRef(raw.category ?? nested.category);

  return {
    ...raw,
    ...nested,
    ...(id ? { id, _id: id } : {}),
    name: pickString(raw.name, nested.name) ?? "",
    image: resolveAssetUrl(image),
    images,
    category: normalizedCategory,
    categoryName:
      pickString(
        raw.categoryName,
        nested.categoryName,
        typeof normalizedCategory === "object" && normalizedCategory !== null
          ? (normalizedCategory as Record<string, unknown>).name
          : undefined,
      ) ?? "",
  };
};
