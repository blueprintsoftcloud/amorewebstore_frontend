// src/products/AddProductModal.tsx
// Modal version of the former standalone "Add Product" page — launched from the
// unified Catalog browser (Listcategory.tsx) instead of navigating away. Same form,
// validation, and API call as before, just rendered over the browser.

import React, { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Type,
  RefreshCw,
  Zap,
  Tag,
  IndianRupee,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { compressImage } from "../utils/compressImage";

interface ValidationField {
  isValid: boolean;
  message: string;
}

interface ProductFormData {
  categoryCode: string;
  productCode: string;
  productName: string;
  brand: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  purchasePrice: string;
  price: string;
  stock: string;
  discount: string;
  image: File | null;
  additionalImages: File[];
}

interface ProductValidation {
  category: ValidationField;
  productCode: ValidationField;
  productName: ValidationField;
  description: ValidationField;
  purchasePrice: ValidationField;
  price: ValidationField;
  image: ValidationField;
  stock: ValidationField;
  discount: ValidationField;
}

/** Human-readable label per validation key, used to name the specific field(s)
 * blocking submission — see handleSubmit's invalid-fields toast below. */
const FIELD_LABELS: Record<keyof ProductValidation, string> = {
  category: "Category",
  productCode: "Product Code",
  productName: "Product Name",
  description: "Description",
  purchasePrice: "Purchase Price",
  price: "Selling Price",
  image: "Product Image",
  stock: "Stock",
  discount: "Discount",
};

interface CategoryAttr {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  values: { id: string; value: string }[];
}

/** One row of the "add options" builder — a raw, not-yet-parsed axis name + its
 * comma-separated values, kept as free text while the admin is still typing. Same
 * shape as ProductVariantsModal.tsx's OptionGroupInput, since it's the same builder
 * pattern reused here so a variant product can be fully set up in one pass instead of
 * needing a second trip through Manage Variants after saving. */
interface OptionGroupInput {
  name: string;
  values: string;
  /** When on (the default), generating this option also creates/reuses a matching
   * Category Filter attribute and tags each variant with it (see backend/src/utils/
   * optionFilterSync.ts) — no separate trip through Category Management needed. */
  isFilterable?: boolean;
}

/** Per-combination edits the admin makes in the live preview table, keyed by the
 * combo's canonical options key (see computeOptionsKeyClient) — kept separate from
 * the combos themselves so retyping an option's values doesn't wipe out edits for
 * combinations that still exist after the change. */
interface DraftVariantEdit {
  stock?: string;
  priceOverride?: string;
  purchasePriceOverride?: string;
  discountOverride?: string;
  /** Defaults to true (unset) — every new ProductVariant row starts active; this only
   * ever gets set to false, when the admin explicitly flips a combo's toggle off. */
  isActive?: boolean;
}

/** Client-side mirror of backend/src/utils/productVariant.ts's computeOptionsKey —
 * must stay byte-for-byte identical so a combo computed here matches the same combo's
 * optionsKey once the backend actually creates it (that's how submitted draft edits
 * get matched back up to their real variant id after generateVariants runs). */
const computeOptionsKeyClient = (options: Record<string, string>): string =>
  Object.entries(options)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => [k.trim(), String(v).trim()] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");

const ValidationIndicator = ({ isValid, message }: { isValid: boolean; message: string }) => (
  <div className="flex items-center gap-2 mt-1">
    {isValid ? (
      <CheckCircle className="h-3 w-3 text-emerald-500" />
    ) : (
      <AlertCircle className="h-3 w-3 text-amber-500" />
    )}
    <span className="text-xs text-slate-500">{message}</span>
  </div>
);

const emptyForm = (categoryCode: string): ProductFormData => ({
  categoryCode,
  productCode: "",
  productName: "",
  brand: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  purchasePrice: "",
  price: "",
  stock: "",
  discount: "",
  image: null,
  additionalImages: [],
});

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Drill-down context from Listcategory.tsx's "Add Product Here" button — the
   * category is always fixed by whichever leaf node the browser is drilled into,
   * so there's no in-form picker to change it, just this fixed context. */
  categoryId?: string;
  categoryName?: string;
  /** Full ancestor chain from root down to (and including) this category, e.g.
   * ["Triumph", "Early Bird Discount"], for the breadcrumb shown in the header. */
  categoryPath?: string[];
  /** Called after a successful create — use it to close the modal and refresh the list. */
  onSuccess: () => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryPath,
  onSuccess,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(() => emptyForm(categoryId ?? ""));
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttr[]>([]);
  const [attrsLoading, setAttrsLoading] = useState(false);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Whether this product is being created as a plain single-SKU item or one with its
  // own purchasable options (see backend/src/models/mongoose.ts's ProductVariant).
  // "variants" swaps the Stock field for a live preview built from optionGroups below,
  // combining what used to be a separate trip through Manage Variants after saving.
  const [variantMode, setVariantMode] = useState<"none" | "variants">("none");
  const [optionGroups, setOptionGroups] = useState<OptionGroupInput[]>([{ name: "", values: "", isFilterable: true }]);
  const [draftVariants, setDraftVariants] = useState<Record<string, DraftVariantEdit>>({});
  // Once variant mode is on, Category Filters moves out of the right column and joins
  // Options in a tabbed section below — with many attributes AND many combinations
  // both on screen at once the form could grow to several screens tall otherwise.
  const [addSectionTab, setAddSectionTab] = useState<"filters" | "options">("options");

  const [validation, setValidation] = useState<ProductValidation>({
    category: { isValid: false, message: "Category is required" },
    productCode: { isValid: false, message: "Alphanumeric only" },
    productName: { isValid: false, message: "Letters, numbers & basic symbols" },
    description: { isValid: false, message: "Minimum 10 characters" },
    purchasePrice: { isValid: true, message: "Optional — cost/purchase price" },
    price: { isValid: false, message: "Price must be greater than 0" },
    image: { isValid: false, message: "Image required" },
    stock: { isValid: true, message: "Optional — default stock is 0" },
    discount: { isValid: true, message: "Optional — 0% to 100%" },
  });

  // Reset form whenever the modal is (re)opened
  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm(categoryId ?? ""));
      setAttrValues({});
      setCategoryAttrs([]);
      setImagePreview(null);
      setAdditionalPreviews([]);
      setCharCount(0);
      setVariantMode("none");
      setOptionGroups([{ name: "", values: "", isFilterable: true }]);
      setDraftVariants({});
      setAddSectionTab("options");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categoryId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!formData.categoryCode) {
      setCategoryAttrs([]);
      setAttrsLoading(false);
      setAttrValues({});
      return;
    }
    setAttrsLoading(true);
    api
      .get(`/category/${formData.categoryCode}/attributes`)
      .then((res) => {
        // RATING/PRICE are informational entries admins can add for visibility in the
        // filter list (see CategoryAttributes.tsx) — the storefront's actual Rating/
        // Price filtering is global and built into every product's own rating/price
        // fields, not something tagged per-product here, so there's no input to render.
        const attrs: CategoryAttr[] = (res.data.attributes ?? []).filter(
          (a: CategoryAttr) => a.type !== "RATING" && a.type !== "PRICE",
        );
        setCategoryAttrs(attrs);
        setAttrValues({});
      })
      .catch(() => {})
      .finally(() => setAttrsLoading(false));
  }, [formData.categoryCode]);

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  useEffect(() => {
    const { categoryCode, productCode, productName, description, purchasePrice, price, stock, image } = formData;

    setValidation({
      category: {
        isValid: !!categoryCode,
        message: categoryCode ? "Category selected ✓" : "Category is required",
      },
      productCode: {
        isValid: /^[a-zA-Z0-9\s\-_/]+$/.test(productCode) && productCode.length > 0 && productCode.length <= 20,
        message:
          productCode.length === 0
            ? "Product code is required"
            : productCode.length > 20
              ? "Max 20 characters allowed"
              : !/^[a-zA-Z0-9\s\-_/]+$/.test(productCode)
                ? "Letters, numbers, spaces, -, _, and / only"
                : "Alphanumeric code ✓",
      },
      productName: {
        isValid:
          /^[a-zA-Z0-9\s&_\-,'()/]+$/.test(productName) && productName.trim().length > 0 && productName.length <= 100,
        message:
          productName.length === 0
            ? "Product name is required"
            : productName.length > 100
              ? "Max 100 characters allowed"
              : !/^[a-zA-Z0-9\s&_\-,'()/]+$/.test(productName)
                ? "Only letters, numbers, spaces, and basic symbols"
                : "Product name ✓",
      },
      description: {
        isValid: description.length >= 10,
        message: `${description.length}/10 characters minimum`,
      },
      purchasePrice: {
        isValid:
          purchasePrice === "" ||
          (!isNaN(parseFloat(purchasePrice)) && parseFloat(purchasePrice) >= 0 && parseFloat(purchasePrice) <= 999999999),
        message:
          purchasePrice === ""
            ? "Optional — cost/purchase price"
            : parseFloat(purchasePrice) > 999999999
              ? "Max cost price is ₹99 Crores"
              : !isNaN(parseFloat(purchasePrice)) && parseFloat(purchasePrice) >= 0
                ? "Valid purchase price ✓"
                : "Must be a non-negative number",
      },
      price: {
        // In variant mode, Selling Price isn't a field the admin fills in here at all
        // (see the Options card's preview table) — the base price gets derived from
        // whatever's entered there at submit time, so this field has nothing to
        // validate until it's actually shown again.
        isValid:
          variantMode === "variants" ||
          (!isNaN(parseFloat(price)) && parseFloat(price) > 0 && parseFloat(price) <= 999999999),
        message:
          price === ""
            ? "Price must be greater than 0"
            : parseFloat(price) > 999999999
              ? "Max selling price is ₹99 Crores"
              : !isNaN(parseFloat(price)) && parseFloat(price) > 0
                ? "Valid selling price ✓"
                : "Price must be greater than 0",
      },
      stock: {
        isValid:
          stock === "" || (!isNaN(Number(stock)) && Number(stock) >= 0 && Number(stock) <= 999999 && Number.isInteger(+stock)),
        message:
          stock === ""
            ? "Optional — default stock is 0"
            : Number(stock) > 999999
              ? "Max stock limit is 999,999 units"
              : !isNaN(Number(stock)) && Number(stock) >= 0 && Number.isInteger(+stock)
                ? "Valid stock count ✓"
                : "Stock must be a positive whole number",
      },
      discount: {
        isValid:
          formData.discount === "" ||
          (!isNaN(parseFloat(formData.discount)) && parseFloat(formData.discount) >= 0 && parseFloat(formData.discount) <= 100),
        message:
          formData.discount === ""
            ? "Optional — 0% to 100%"
            : !isNaN(parseFloat(formData.discount)) && parseFloat(formData.discount) >= 0 && parseFloat(formData.discount) <= 100
              ? "Valid discount % ✓"
              : "Discount must be between 0% and 100%",
      },
      image: {
        isValid: image !== null,
        message: image ? "Image selected ✓" : "Image required",
      },
    });

    setCharCount(description.length);
  }, [formData, variantMode]);

  if (!isOpen) return null;

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;

    if (name === "purchasePrice" || name === "price") {
      if (value !== "" && parseFloat(value) > 999999999) return;
    }
    if (name === "stock") {
      if (value !== "" && parseFloat(value) > 999999) return;
    }
    if (name === "discount") {
      if (value !== "" && parseFloat(value) > 100) return;
    }

    if (name === "image") {
      const file = files?.[0];
      if (file) {
        const compressed = await compressImage(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        const url = URL.createObjectURL(compressed);
        setFormData((prev) => ({ ...prev, image: compressed }));
        setImagePreview(url);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdditionalImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    const remaining = 5 - formData.additionalImages.length;
    const allowed = newFiles.slice(0, remaining);
    const compressed = await Promise.all(allowed.map(compressImage));

    const newUrls = compressed.map((f) => URL.createObjectURL(f));
    setFormData((prev) => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...compressed],
    }));
    setAdditionalPreviews((prev) => [...prev, ...newUrls]);
    e.target.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    URL.revokeObjectURL(additionalPreviews[index]);
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
  };

  const handleReset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    additionalPreviews.forEach(URL.revokeObjectURL);
    setFormData(emptyForm(categoryId ?? ""));
    setAttrValues({});
    setCategoryAttrs([]);
    setImagePreview(null);
    setAdditionalPreviews([]);
    setCharCount(0);
    setVariantMode("none");
    setOptionGroups([{ name: "", values: "" }]);
    setDraftVariants({});
    setAddSectionTab("options");

    const input = document.getElementById("addProductImageUpload") as HTMLInputElement | null;
    if (input) input.value = "";
    const addInput = document.getElementById("addProductAdditionalImagesUpload") as HTMLInputElement | null;
    if (addInput) addInput.value = "";
  };

  const addOptionGroupRow = () => setOptionGroups((prev) => [...prev, { name: "", values: "", isFilterable: true }]);
  const removeOptionGroupRow = (index: number) =>
    setOptionGroups((prev) => prev.filter((_, i) => i !== index));
  const updateOptionGroupRow = (index: number, field: "name" | "values", value: string) =>
    setOptionGroups((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const toggleOptionGroupFilterable = (index: number) =>
    setOptionGroups((prev) =>
      prev.map((row, i) => (i === index ? { ...row, isFilterable: !(row.isFilterable ?? true) } : row)),
    );

  // Cartesian product across every named-and-valued row, exactly matching
  // productVariant.controller.ts's generateVariants — recomputed on every keystroke so
  // the preview table below always reflects what submitting right now would create.
  const parsedOptionGroups = optionGroups
    .map((row) => ({
      name: row.name.trim(),
      values: [...new Set(row.values.split(",").map((v) => v.trim()).filter(Boolean))],
      isFilterable: row.isFilterable ?? true,
    }))
    .filter((g) => g.name && g.values.length > 0);

  let previewCombos: Array<{ key: string; options: Record<string, string> }> = [];
  if (parsedOptionGroups.length > 0) {
    let combos: Array<Record<string, string>> = [{}];
    for (const group of parsedOptionGroups) {
      combos = combos.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value })));
    }
    previewCombos = combos.map((options) => ({ key: computeOptionsKeyClient(options), options }));
  }
  const previewTotalStock = previewCombos.reduce(
    (sum, c) => sum + (parseInt(draftVariants[c.key]?.stock ?? "") || 0),
    0,
  );

  // Once a product has variants, any category attribute whose name matches one of the
  // option axes being typed below (e.g. "Color") gets its value set automatically from
  // the option itself once the product is created (see backend/src/utils/
  // optionFilterSync.ts) — showing it here too would just be a second, manually-set
  // place for the same attribute to disagree with the option driving it. Only relevant
  // once variants are on; a plain single-SKU product has no options to collide with.
  const optionAxisNames = new Set(parsedOptionGroups.map((g) => g.name.trim().toLowerCase()));
  const visibleCategoryAttrs =
    variantMode === "variants" ? categoryAttrs.filter((attr) => !optionAxisNames.has(attr.name.trim().toLowerCase())) : categoryAttrs;

  // Shared between the two places Category Filters can render — nested in the right
  // column for a plain product, or its own card in the Filters/Options tab once
  // variant mode is on (see addSectionTab).
  const categoryFilterFields = (
    <div className="space-y-4">
      {visibleCategoryAttrs.map((attr) => (
        <div key={attr.id}>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {attr.name}
            {attr.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {attr.type === "SELECT" && (
            <select
              value={attrValues[attr.id] ?? ""}
              onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">— Select {attr.name} —</option>
              {attr.values.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.value}
                </option>
              ))}
            </select>
          )}
          {attr.type === "MULTISELECT" && (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((v) => {
                const selected = (attrValues[attr.id] ?? "").split(",").filter(Boolean).includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      const cur = (attrValues[attr.id] ?? "").split(",").filter(Boolean);
                      const next = selected ? cur.filter((id) => id !== v.id) : [...cur, v.id];
                      setAttrValues((prev) => ({ ...prev, [attr.id]: next.join(",") }));
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      selected ? "bg-gray-900 text-white border-gray-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          )}
          {attr.type === "BOOLEAN" && (
            <div className="flex gap-3">
              {attr.values.map((v) => {
                const active = attrValues[attr.id] === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setAttrValues((prev) => ({ ...prev, [attr.id]: active ? "" : v.id }))}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          )}
          {(attr.type === "TEXT" || attr.type === "NUMBER" || attr.type === "DATE") && (
            <input
              type={attr.type === "NUMBER" ? "number" : attr.type === "DATE" ? "date" : "text"}
              value={attrValues[attr.id] ?? ""}
              onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
              placeholder={`Enter ${attr.name.toLowerCase()}…`}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          )}
        </div>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variantMode === "variants" && previewCombos.length === 0) {
      toast.error("Add at least one option (a name and its values) below, or switch back to “No variants”.", {
        id: "no-variant-options",
      });
      return;
    }

    const invalidFields = (Object.keys(validation) as (keyof ProductValidation)[]).filter(
      (key) => !validation[key].isValid,
    );
    if (invalidFields.length > 0) {
      const names = invalidFields.map((key) => FIELD_LABELS[key]).join(", ");
      toast.error(`Please fix the following before submitting: ${names}.`, { id: "fill all feilds" });
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      data.append("category", formData.categoryCode);
      data.append("code", formData.productCode);
      data.append("name", formData.productName);
      if (formData.brand.trim()) data.append("brand", formData.brand.trim());
      data.append("description", formData.description);
      if (formData.metaTitle.trim()) data.append("metaTitle", formData.metaTitle.trim());
      if (formData.metaDescription.trim()) data.append("metaDescription", formData.metaDescription.trim());
      if (formData.image) data.append("image", formData.image);
      formData.additionalImages.forEach((img) => data.append("images", img));

      if (variantMode === "variants") {
        // Purchase Price / Selling Price / Stock / Discount aren't filled in here at
        // all (see the Options card's per-combination Defaults) — a `price` still has
        // to be sent to satisfy the backend's required field, so use the cheapest
        // price actually entered below as a starting point. syncProductFromVariants
        // (backend/src/utils/productVariant.ts) immediately recomputes the real
        // Product.price/purchasePrice/discount once the variants exist, so this value
        // only matters for the brief moment before that runs.
        const enteredPrices = previewCombos
          .map((c) => parseFloat(draftVariants[c.key]?.priceOverride ?? ""))
          .filter((n) => !isNaN(n) && n > 0);
        data.append("price", String(enteredPrices.length > 0 ? Math.min(...enteredPrices) : 1));
      } else {
        if (formData.purchasePrice !== "") data.append("purchasePrice", formData.purchasePrice);
        data.append("price", formData.price);
        if (formData.stock !== "") data.append("stock", formData.stock);
        if (formData.discount !== "") data.append("discount", formData.discount);
      }

      const attrPayload = Object.entries(attrValues)
        .filter(([, v]) => v)
        .map(([attributeId, v]) => {
          const attr = categoryAttrs.find((a) => a.id === attributeId);
          // BOOLEAN stores a real CategoryAttributeValue id too (see its button handler
          // below, which sets attrValues[attr.id] = v.id) — it's id-based like SELECT/
          // MULTISELECT, not free text, despite reading like a plain toggle.
          if (attr && (attr.type === "SELECT" || attr.type === "MULTISELECT" || attr.type === "BOOLEAN")) {
            return { attributeId, attributeValueId: v };
          }
          return { attributeId, textValue: v };
        });
      if (attrPayload.length > 0) data.append("attributeValues", JSON.stringify(attrPayload));

      const res = await api.post("/product/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newProductId: string | undefined = res.data.product?.id ?? res.data.product?._id;

      // Product exists now, so the option groups drawn up in the preview below can
      // actually be created — same two calls Manage Variants itself makes
      // (generateVariants, then updateVariant per row with a value typed in), just run
      // right here instead of needing a second trip back into this product later.
      if (variantMode === "variants" && newProductId && previewCombos.length > 0) {
        const genRes = await api.post(`/product/${newProductId}/variants/generate`, {
          optionGroups: parsedOptionGroups,
        });
        const createdVariants: Array<{ id: string; optionsKey: string }> = genRes.data.variants ?? [];
        for (const variant of createdVariants) {
          const draft = draftVariants[variant.optionsKey];
          if (!draft) continue;
          // isActive only needs sending when explicitly turned off — every new row is
          // already active by default (see ProductVariantSchema), so leaving the
          // toggle untouched means there's nothing to override.
          const hasEdit = draft.stock || draft.priceOverride || draft.purchasePriceOverride || draft.discountOverride || draft.isActive === false;
          if (!hasEdit) continue;
          // No product-level base price to fall back on here — the product doesn't exist
          // yet at the point these combos were being filled in — so a blank price becomes
          // a literal 0 rather than null (which would otherwise inherit whatever
          // fallback price gets set on the product itself, above).
          await api.put(`/product/${newProductId}/variants/${variant.id}`, {
            stock: draft.stock || undefined,
            priceOverride: draft.priceOverride || "0",
            purchasePriceOverride: draft.purchasePriceOverride || "0",
            discountOverride: draft.discountOverride || null,
            isActive: draft.isActive === false ? false : undefined,
          });
        }
      }

      toast.success(res.data.message || "Product added successfully!", { id: "product-added" });
      onSuccess();
    } catch (err) {
      const _e = err as any;
      toast.error(
        _e.response?.data?.message || _e.response?.data?.Error || "Error adding product. Please try again.",
        { id: "error adding product" },
      );
    } finally {
      setLoading(false);
    }
  };

  // Ancestor chain for the header breadcrumb — falls back to just the category name
  // if the caller didn't pass the full path (e.g. a direct categoryName-only usage).
  const pathSegments = categoryId ? (categoryPath?.length ? categoryPath : categoryName ? [categoryName] : []) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-6xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-950">Add New Product</h2>
            {pathSegments.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {pathSegments.map((seg, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />}
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        i === pathSegments.length - 1
                          ? "bg-slate-900 text-white font-semibold"
                          : "bg-white border border-slate-200 text-slate-600"
                      }`}
                    >
                      {seg}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Deploy a new product into the catalog and set its pricing and attributes.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN: Main Form Fields */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        <Tag className="h-4 w-4 text-slate-700" />
                      </div>
                      Product Information
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Define your product details and attributes</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Variant mode */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">Sold as</label>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => setVariantMode("none")}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            variantMode === "none" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Single item
                        </button>
                        <button
                          type="button"
                          onClick={() => setVariantMode("variants")}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            variantMode === "variants" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Multiple options
                        </button>
                      </div>
                      {variantMode === "variants" && (
                        <p className="text-xs text-slate-400 mt-2">
                          Each combination gets its own stock and price.
                        </p>
                      )}
                    </div>

                    {/* Product Code */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-800">Product Code</label>
                        <span className="text-xs font-medium text-slate-500">{formData.productCode.length}/20 chars</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="productCode"
                          maxLength={20}
                          value={formData.productCode}
                          onChange={handleChange}
                          placeholder="PROD-1001"
                          className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validation.productCode.isValid ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : formData.productCode ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : null}
                        </div>
                      </div>
                      <ValidationIndicator isValid={validation.productCode.isValid} message={validation.productCode.message} />
                    </div>

                    {/* Product Name */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-800">Product Name</label>
                        <span className="text-xs font-medium text-slate-500">{formData.productName.length}/100 chars</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="productName"
                          maxLength={100}
                          value={formData.productName}
                          onChange={handleChange}
                          placeholder="Eg: Cotton Silk Saree with Zari Border"
                          className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {validation.productName.isValid ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : formData.productName ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : null}
                        </div>
                      </div>
                      <ValidationIndicator isValid={validation.productName.isValid} message={validation.productName.message} />
                    </div>

                    {/* Brand */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-800">Brand</label>
                        <span className="text-xs font-medium text-slate-500">Optional</span>
                      </div>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder="Eg: Nike, Adidas…"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-800">Description</label>
                        <span className={`text-xs font-medium ${charCount >= 10 ? "text-emerald-600" : "text-slate-500"}`}>
                          {charCount}/10 characters
                        </span>
                      </div>
                      <div className="relative">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Describe this product in detail..."
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <div className="absolute right-3 top-3">
                          {validation.description.isValid ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : formData.description ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : null}
                        </div>
                      </div>
                      <ValidationIndicator isValid={validation.description.isValid} message={validation.description.message} />
                    </div>

                    {/* SEO — both optional; falls back to product name/description when unset. */}
                    <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO <span className="font-normal normal-case text-slate-400">(optional)</span></p>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-800">Meta Title</label>
                          <span className="text-xs font-medium text-slate-500">{formData.metaTitle.length}/70</span>
                        </div>
                        <input
                          type="text"
                          name="metaTitle"
                          value={formData.metaTitle}
                          onChange={handleChange}
                          maxLength={70}
                          placeholder={formData.productName || "Defaults to the product name"}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-800">Meta Description</label>
                          <span className="text-xs font-medium text-slate-500">{formData.metaDescription.length}/160</span>
                        </div>
                        <textarea
                          name="metaDescription"
                          value={formData.metaDescription}
                          onChange={handleChange}
                          rows={2}
                          maxLength={160}
                          placeholder="Defaults to the description above, trimmed to fit"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200 resize-none"
                        />
                      </div>
                    </div>

                    {/* Pricing / Stock / Discount — only for a plain single-SKU product.
                        For a variant product these move into the Options card below,
                        since that's where they're actually meaningful (defaults for
                        combinations that don't set their own), instead of appearing
                        twice. */}
                    {variantMode === "none" && (
                      <>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Purchase Price */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-slate-800">Purchase Price</label>
                                <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                                  Cost Price
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  name="purchasePrice"
                                  min={0}
                                  max={999999999}
                                  step="any"
                                  value={formData.purchasePrice}
                                  onChange={handleChange}
                                  placeholder="Eg: 1200"
                                  className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-amber-100 bg-amber-50/30 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-transparent transition-all duration-200"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  {validation.purchasePrice.isValid && formData.purchasePrice ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : formData.purchasePrice ? (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <span className="text-xs text-amber-400 font-semibold">₹</span>
                                  )}
                                </div>
                              </div>
                              <ValidationIndicator isValid={validation.purchasePrice.isValid} message={validation.purchasePrice.message} />
                            </div>

                            {/* Selling Price */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-slate-800">Selling Price</label>
                                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  Current Price
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  name="price"
                                  min={0}
                                  max={999999999}
                                  step="any"
                                  value={formData.price}
                                  onChange={handleChange}
                                  placeholder="Eg: 2499"
                                  className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  {validation.price.isValid ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : formData.price ? (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <span className="text-xs text-slate-400 font-semibold">₹</span>
                                  )}
                                </div>
                              </div>
                              <ValidationIndicator isValid={validation.price.isValid} message={validation.price.message} />
                            </div>
                          </div>

                          {/* Profit Indicator */}
                          {formData.purchasePrice !== "" && formData.price !== "" && parseFloat(formData.price) > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 text-sm">
                              <IndianRupee className="h-4 w-4 text-slate-500 shrink-0" />
                              <span className="text-slate-600">Estimated profit:</span>
                              <span
                                className={`font-bold ${
                                  parseFloat(formData.price) - parseFloat(formData.purchasePrice || "0") >= 0
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                ₹{(parseFloat(formData.price) - parseFloat(formData.purchasePrice || "0")).toFixed(2)}
                              </span>
                              <span className="text-slate-400 text-xs">
                                (
                                {parseFloat(formData.purchasePrice || "0") > 0
                                  ? (
                                      ((parseFloat(formData.price) - parseFloat(formData.purchasePrice)) /
                                        parseFloat(formData.purchasePrice)) *
                                      100
                                    ).toFixed(1)
                                  : "—"}
                                % margin)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stock */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-slate-800">Stock</label>
                            <span className="text-xs font-medium text-slate-500">(Update stock)</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              name="stock"
                              min={0}
                              max={999999}
                              step={1}
                              value={formData.stock}
                              onChange={handleChange}
                              placeholder="Eg: 50"
                              className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {validation.stock.isValid && formData.stock ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : formData.stock ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              ) : null}
                            </div>
                          </div>
                          <ValidationIndicator isValid={validation.stock.isValid} message={validation.stock.message} />
                        </div>

                        {/* Discount */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-slate-800">Discount %</label>
                            <span className="text-xs font-medium text-slate-500">Optional — 0 to 100</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              name="discount"
                              value={formData.discount}
                              onChange={handleChange}
                              placeholder="Eg: 10"
                              min={0}
                              max={100}
                              step="any"
                              className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white/50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all duration-200"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {validation.discount.isValid && formData.discount ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : formData.discount ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <span className="text-xs text-slate-400 font-semibold">%</span>
                              )}
                            </div>
                          </div>
                          <ValidationIndicator isValid={validation.discount.isValid} message={validation.discount.message} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Image + Gallery + Attributes */}
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        <ImageIcon className="h-4 w-4 text-slate-700" />
                      </div>
                      Product Image
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Upload a high-quality product image</p>
                  </div>

                  <div className="p-6 border-b border-slate-100">
                    <label htmlFor="addProductImageUpload" className="cursor-pointer transition-all duration-300 block">
                      {imagePreview ? (
                        <div className="relative w-full h-full min-h-[220px] max-h-[280px] overflow-hidden rounded-xl group">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-contain rounded-xl border-2 border-slate-200 bg-white p-2"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 rounded-xl">
                            <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-slate-800 mb-2">
                              Change Image
                            </div>
                            <p className="text-xs text-white/80 text-center max-w-xs">Click to upload a different image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border-3 border-dashed border-slate-300 rounded-xl p-6 text-center bg-gradient-to-b from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center">
                          <div className="p-3 rounded-full bg-slate-100 mb-3">
                            <Upload className="h-6 w-8 text-slate-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-1">Upload Product Image</h4>
                          <p className="text-xs text-slate-500 mb-3 max-w-xs">PNG, JPG, WEBP up to 1MB.</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:shadow-lg transition-all duration-200">
                            <Upload className="h-3 w-3" /> Select Image
                          </div>
                        </div>
                      )}
                    </label>

                    <input type="file" id="addProductImageUpload" name="image" onChange={handleChange} className="hidden" accept="image/*" />

                    <div className="mt-4 space-y-4">
                      <ValidationIndicator isValid={validation.image.isValid} message={validation.image.message} />
                      {formData.image && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-emerald-800 truncate max-w-[140px]">{formData.image!.name}</p>
                                <p className="text-[10px] text-emerald-600">{(formData.image!.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="p-5 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-slate-600" />
                        Gallery Images
                      </h3>
                      <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-bold">
                        {formData.additionalImages.length}/5
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4">Add additional catalog variations or detail views</p>

                    <div className="space-y-4">
                      {additionalPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {additionalPreviews.map((url, i) => (
                            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={url} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(i)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] rounded px-1">{i + 1}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.additionalImages.length < 5 && (
                        <label
                          htmlFor="addProductAdditionalImagesUpload"
                          className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-white transition-all duration-200"
                        >
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-600">
                            {additionalPreviews.length === 0 ? "Add gallery images" : "Add more images"}
                          </span>
                        </label>
                      )}
                      <input
                        type="file"
                        id="addProductAdditionalImagesUpload"
                        multiple
                        accept="image/*"
                        onChange={handleAdditionalImages}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Category Filters — stays here for a plain single-SKU product. Once
                      variant mode is on, it moves into the tabbed section below instead
                      (alongside Options), so the two don't both grow tall on screen at
                      once — see addSectionTab. */}
                  {variantMode === "none" && categoryAttrs.length > 0 && (
                    <div className="p-5 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Tag className="h-3.5 w-3.5 text-slate-600" />
                        Category Filters
                        {attrsLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-1" />}
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-4">
                        Lets customers narrow their search on the category page (e.g. filter by Size). Doesn't set
                        stock or what's actually purchasable — that's the options below, or Manage Variants later.
                      </p>
                      {categoryFilterFields}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filters / Options — tabbed once variant mode is on. Category
                Filters moved out of the right column above (see the "none" check on
                it) since with many attributes AND many option combinations, showing
                both stacked at once is exactly what grows this form to several
                screens tall. */}
            {variantMode === "variants" && (
              <div>
                {visibleCategoryAttrs.length > 0 && (
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 mb-6">
                    {(
                      [
                        { key: "options", label: "Options", count: previewCombos.length },
                        { key: "filters", label: "Category Filters", count: visibleCategoryAttrs.length },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAddSectionTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                          addSectionTab === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        {tab.count > 0 && (
                          <span
                            className={`shrink-0 inline-flex items-center justify-center min-w-[1.25rem] px-1 rounded-full text-[10px] font-bold ${
                              addSectionTab === tab.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {addSectionTab === "filters" && visibleCategoryAttrs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-slate-100">
                        <Tag className="h-4 w-4 text-slate-700" />
                      </div>
                      Category Filters
                      {attrsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 ml-1" />}
                    </h3>
                    <p className="text-sm text-slate-500 mb-5">
                      Lets customers narrow their search on the category page (e.g. filter by Size). Doesn't set
                      stock or what's actually purchasable — that's Options.
                    </p>
                    {categoryFilterFields}
                  </div>
                )}

                {addSectionTab === "options" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Layers className="h-4 w-4 text-slate-700" />
                    </div>
                    Options
                  </h3>

                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Add options</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      E.g. Size, Color, Storage, Weight — whatever fits. Values are comma-separated.
                    </p>
                    <div className="space-y-3">
                      {optionGroups.map((row, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2.5 items-start">
                            <input
                              value={row.name}
                              onChange={(e) => updateOptionGroupRow(index, "name", e.target.value)}
                              placeholder="Option name, e.g. Size"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                            />
                            <input
                              value={row.values}
                              onChange={(e) => updateOptionGroupRow(index, "values", e.target.value)}
                              placeholder="Values, e.g. S, M, L, XL"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => removeOptionGroupRow(index)}
                              disabled={optionGroups.length <= 1}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition self-center sm:self-auto"
                              title="Remove this option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleOptionGroupFilterable(index)}
                            className="inline-flex items-center gap-2 text-xs text-slate-600"
                          >
                            <span
                              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                                row.isFilterable ?? true ? "bg-indigo-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                                  row.isFilterable ?? true ? "translate-x-3.5" : "translate-x-0.5"
                                }`}
                              />
                            </span>
                            Show as filter to customers
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addOptionGroupRow}
                      className="mt-3 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add another option
                    </button>
                  </div>

                  {/* Live preview — recomputed from the rows above on every keystroke,
                      nothing here is saved until Create Product runs. */}
                  {previewCombos.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200">
                      <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm font-medium">
                        Name at least one option above to see its combinations here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Preview — {previewCombos.length} combination{previewCombos.length === 1 ? "" : "s"}, {previewTotalStock} unit{previewTotalStock === 1 ? "" : "s"} total
                      </p>
                      {previewCombos.map((combo) => {
                        const draft = draftVariants[combo.key] ?? {};
                        const isActive = draft.isActive ?? true;
                        const label = Object.entries(combo.options)
                          .map(([axis, value]) => `${axis}: ${value}`)
                          .join(" · ");
                        const setField = (field: keyof DraftVariantEdit, value: string) =>
                          setDraftVariants((prev) => ({ ...prev, [combo.key]: { ...prev[combo.key], [field]: value } }));
                        return (
                          <div key={combo.key} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`text-sm font-semibold ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                                {label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftVariants((prev) => ({ ...prev, [combo.key]: { ...prev[combo.key], isActive: !isActive } }))
                                }
                                title={isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                  isActive ? "bg-indigo-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    isActive ? "translate-x-4" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                  Stock
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={draft.stock ?? ""}
                                  onChange={(e) => setField("stock", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                  Selling price
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="Base price"
                                  value={draft.priceOverride ?? ""}
                                  onChange={(e) => setField("priceOverride", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                  Purchase price
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="Base cost"
                                  value={draft.purchasePriceOverride ?? ""}
                                  onChange={(e) => setField("purchasePriceOverride", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                  Discount %
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  placeholder="0"
                                  value={draft.discountOverride ?? ""}
                                  onChange={(e) => setField("discountOverride", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[11px] text-slate-400 pt-1">
                        Only Stock needs a number per option — Selling price/Purchase price/Discount can be left blank
                        and will fall back to whichever combination's price is lowest.
                      </p>
                    </div>
                  )}
                </div>
              </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-4 px-6 md:px-8 py-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
