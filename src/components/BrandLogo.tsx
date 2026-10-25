export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      className={`official-logo ${className}`}
      src="/images/brand/elite-parts-logo.png"
      width="659"
      height="171"
      alt="Elite Parts — Acessórios Automotivos"
      loading="eager"
      decoding="sync"
    />
  );
}
