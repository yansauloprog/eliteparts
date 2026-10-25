import { db, check } from "../lib/supabase";
import type { Database } from "../types/database";
export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];
const bucket = () => db().storage.from("elite-product-images");
export const imageURL = (path: string) =>
  bucket().getPublicUrl(path).data.publicUrl;
export async function images(productId: string) {
  const { data, error } = await db()
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position")
    .order("id");
  check(error);
  return data!;
}
export async function processImage(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
  )
    throw new Error("Escolha uma imagem JPEG, PNG, WebP ou AVIF.");
  if (file.size > 10 * 1024 * 1024 || file.size === 0)
    throw new Error("A imagem deve ter entre 1 byte e 10 MB.");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    if (bitmap.width * bitmap.height > 40000000)
      throw new Error(
        "A fotografia ultrapassa 40 megapixels. Reduza a resolução antes do envio.",
      );
    async function resize(max: number) {
      const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Seu navegador não permite processar imagens.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b && b.type === "image/webp"
              ? resolve(b)
              : reject(new Error("Não foi possível gerar WebP.")),
          "image/webp",
          0.86,
        ),
      );
      return blob;
    }
    return { full: await resize(1600), thumb: await resize(480) };
  } finally {
    bitmap.close();
  }
}
async function cleanup(paths: string[]) {
  const { error } = await bucket().remove(paths);
  if (error)
    throw new Error(
      `Falha na limpeza de arquivos. Informe ao suporte estes caminhos: ${paths.join(", ")}`,
    );
}
export async function uploadImage(
  productId: string,
  file: File,
  position: number,
  replace?: ProductImage,
) {
  const processed = await processImage(file);
  const token = crypto.randomUUID();
  const full_path = `${productId}/${token}.webp`,
    thumb_path = `${productId}/${token}-480.webp`;
  const uploaded: string[] = [];
  const checksum = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
    ),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  try {
    for (const [path, blob] of [
      [full_path, processed.full],
      [thumb_path, processed.thumb],
    ] as const) {
      const { error } = await bucket().upload(path, blob, {
        contentType: "image/webp",
        upsert: false,
      });
      check(error);
      uploaded.push(path);
    }
    const value = {
      product_id: productId,
      full_path,
      thumb_path,
      original_filename: file.name,
      checksum_sha256: checksum,
      position,
    };
    const result = replace
      ? await db()
          .from("product_images")
          .update(value)
          .eq("id", replace.id)
          .eq("product_id", productId)
          .select()
          .single()
      : await db()
          .from("product_images")
          .insert({ ...value, is_cover: false })
          .select()
          .single();
    check(result.error);
  } catch (error) {
    if (uploaded.length) await cleanup(uploaded);
    throw error;
  }
  if (replace) await cleanup([replace.full_path, replace.thumb_path]);
}
export async function removeImage(image: ProductImage) {
  const { error } = await db()
    .from("product_images")
    .delete()
    .eq("id", image.id)
    .eq("product_id", image.product_id)
    .select()
    .single();
  check(error);
  await cleanup([image.full_path, image.thumb_path]);
}
export async function orderImages(
  productId: string,
  ordered: ProductImage[],
  coverId: string,
) {
  const { error } = await db().rpc("elite_order_images", {
    product_uuid: productId,
    ordered_ids: ordered.map((i) => i.id),
    cover_id: coverId,
  });
  check(error);
}
