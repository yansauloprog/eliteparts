import { useState } from "react";
import type { CatalogImage } from "../../data/demo-catalog";
export function ProductImage({
  image,
  name,
  eager = false,
  className = "",
}: {
  image?: CatalogImage;
  name: string;
  eager?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return image && !failed ? (
    <img
      className={`${className} ${image.presentation === "context" ? "shop-photo-context" : ""}`.trim()}
      src={image.src}
      srcSet={
        image.thumbnail
          ? `${image.thumbnail} ${image.thumbnailWidth}w, ${image.src} ${image.width}w`
          : undefined
      }
      sizes={
        eager
          ? "(max-width:650px) 92vw, 600px"
          : "(max-width:639px) 90vw, (max-width:1023px) 45vw, 300px"
      }
      alt={image.alt}
      width={image.width ?? 1000}
      height={image.height ?? 800}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`shop-photo-placeholder ${className}`}
      role="img"
      aria-label={`Fotografia de ${name} ainda não disponível`}
    >
      <img
        src="/images/brand/elite-parts-symbol.png"
        width="256"
        height="256"
        alt=""
        aria-hidden="true"
      />
      <small>IMAGEM EM ATUALIZAÇÃO</small>
    </div>
  );
}
