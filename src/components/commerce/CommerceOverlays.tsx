import { useCommerce } from "../../hooks/useCommerce";
import { Modal } from "./Modal";
import { InterestPanel } from "../../pages/InterestPage";
import { Link } from "../../lib/router";
export function CommerceOverlays() {
  const c = useCommerce();
  return (
    <>
      {c.toast && (
        <p className="shop-toast" role="status">
          {c.toast}
        </p>
      )}
      {c.cartOpen && (
        <Modal
          title="Sua lista de interesses"
          onClose={() => c.setCartOpen(false)}
        >
          <InterestPanel />
        </Modal>
      )}
      {c.quickView && (
        <Modal title={c.quickView.name} onClose={() => c.setQuickView(null)}>
          <p>{c.quickView.description}</p>
          <Link
            className="shop-primary"
            href={"/produto/" + c.quickView.slug}
            onClick={() => c.setQuickView(null)}
          >
            Ver produto e fotografias
          </Link>
        </Modal>
      )}
      {c.quote && (
        <Modal title="Atendimento Elite Parts" onClose={() => c.setQuote(null)}>
          <p>Encontre os produtos para seu projeto e solicite um orçamento.</p>
          <Link href="/catalogo" onClick={() => c.setQuote(null)}>
            Explorar catálogo
          </Link>
        </Modal>
      )}
    </>
  );
}
