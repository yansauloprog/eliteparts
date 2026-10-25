import { useRef, useState } from "react";
import {
  images,
  imageURL,
  uploadImage,
  orderImages,
  removeImage,
  type ProductImage,
} from "../services/productImages";
import { useLoad, Notice, Loading, LoadError } from "./shared";
import { message } from "../lib/supabase";
export function ImageManager({ productId }: { productId: string }) {
  const result = useLoad(() => images(productId), [productId]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [replacement, setReplacement] = useState<ProductImage | undefined>();
  const input = useRef<HTMLInputElement>(null);
  async function operation(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      setSuccess("Galeria atualizada.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
      result.reload();
    }
  }
  async function files(fileList: FileList | null) {
    if (!fileList?.length) return;
    const selected = Array.from(fileList);
    await operation(async () => {
      const current = await images(productId);
      let position =
        current.reduce((max, i) => Math.max(max, i.position), -1) + 1;
      for (const file of selected) {
        await uploadImage(
          productId,
          file,
          replacement?.position ?? position++,
          replacement,
        );
        if (replacement) break;
      }
      const updated = await images(productId);
      if (updated.length && !updated.some((i) => i.is_cover))
        await orderImages(productId, updated, updated[0].id);
    });
    setReplacement(undefined);
    if (input.current) input.current.value = "";
  }
  function move(index: number, direction: number) {
    void operation(async () => {
      const ordered = [...result.data!];
      [ordered[index], ordered[index + direction]] = [
        ordered[index + direction],
        ordered[index],
      ];
      await orderImages(
        productId,
        ordered,
        ordered.find((i) => i.is_cover)?.id ?? ordered[0].id,
      );
    });
  }
  return (
    <section className="a-panel">
      <div className="a-title">
        <div>
          <h2>Fotografias do produto</h2>
          <p>
            Recomendamos 3 a 5 imagens. Até 10 MB cada. Galeria e miniatura em
            WebP.
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => {
            setReplacement(undefined);
            if (input.current) {
              input.current.multiple = true;
              input.current.click();
            }
          }}
        >
          + Adicionar fotos
        </button>
      </div>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(e) => void files(e.target.files)}
      />
      <Notice error={error} success={success} />
      {busy && <p role="status">Processando e salvando imagens…</p>}
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <LoadError error={result.error} retry={result.reload} />
      ) : (
        <div className="a-gallery">
          {result.data?.map((i, n) => (
            <article key={i.id}>
              <img
                src={imageURL(i.thumb_path)}
                alt={`Fotografia ${n + 1} do produto`}
              />
              <div>
                <span className="a-badge">
                  {i.is_cover ? "Capa" : `Foto ${n + 1}`}
                </span>
                <div className="a-image-actions">
                  <button
                    disabled={busy || i.is_cover}
                    onClick={() =>
                      void operation(() =>
                        orderImages(productId, result.data!, i.id),
                      )
                    }
                  >
                    Definir capa
                  </button>
                  <button
                    disabled={busy || n === 0}
                    aria-label={`Mover foto ${n + 1} para antes`}
                    onClick={() => move(n, -1)}
                  >
                    ←
                  </button>
                  <button
                    disabled={busy || n === result.data!.length - 1}
                    aria-label={`Mover foto ${n + 1} para depois`}
                    onClick={() => move(n, 1)}
                  >
                    →
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setReplacement(i);
                      if (input.current) {
                        input.current.multiple = false;
                        input.current.click();
                      }
                    }}
                  >
                    Substituir
                  </button>
                  <button
                    className="a-danger"
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Remover esta fotografia permanentemente?"))
                        void operation(async () => {
                          await removeImage(i);
                          const remaining = await images(productId);
                          if (i.is_cover && remaining.length)
                            await orderImages(
                              productId,
                              remaining,
                              remaining[0].id,
                            );
                        });
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!result.loading && !result.data?.length && !result.error && (
        <p className="a-empty">Este produto ainda não possui fotografias.</p>
      )}
    </section>
  );
}
