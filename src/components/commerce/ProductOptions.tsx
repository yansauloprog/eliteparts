import { useEffect, useId, useState } from "react";
import type { DemoProduct } from "../../data/demo-catalog";
import { useCommerce } from "../../hooks/useCommerce";
import { emptyChoice, clampQuantity, type CartChoice } from "../../lib/cart";
import { Icon } from "./Icon";
export function ProductOptions({
  product: p,
  compact = false,
}: {
  product: DemoProduct;
  compact?: boolean;
}) {
  const id = useId();
  const { add, setCartOpen } = useCommerce();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(timer);
  }, [added]);
  const [choice, setChoice] = useState<CartChoice>(() => ({
    ...emptyChoice,
    option: p.options[0]?.values[0] ?? "",
    installation: p.type === "servico",
    vehicle: { ...emptyChoice.vehicle },
  }));
  return (
    <div className="shop-purchase-options">
      {p.options.map((option) => (
        <label className="shop-field" key={option.name} htmlFor={id + "option"}>
          {option.name}
          <select
            id={id + "option"}
            value={choice.option}
            onChange={(e) =>
              setChoice((c) => ({ ...c, option: e.target.value }))
            }
          >
            {option.values.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      ))}
      {p.installation && p.type === "produto" ? (
        <fieldset className="shop-install-options">
          <legend>Precisa de instalação?</legend>
          {[
            [false, "Somente produto"],
            [true, "Consultar produto + instalação"],
          ].map(([value, label]) => (
            <label key={String(value)}>
              <input
                type="radio"
                name={id + "install"}
                checked={choice.installation === value}
                onChange={() =>
                  setChoice((c) => ({ ...c, installation: !!value }))
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {!compact && p.slug !== "pelicula-residencial" ? (
        <fieldset className="shop-vehicle">
          <legend>Seu veículo</legend>
          <p>Confirme a compatibilidade com a Elite Parts.</p>
          <div>
            {(["brand", "model", "year"] as const).map((key, i) => (
              <label key={key} className="shop-field">
                {["Marca", "Modelo", "Ano"][i]}
                <input
                  value={choice.vehicle[key]}
                  maxLength={key === "year" ? 4 : 80}
                  inputMode={key === "year" ? "numeric" : undefined}
                  placeholder={["Ex.: marca", "Seu modelo", "AAAA"][i]}
                  onChange={(e) =>
                    setChoice((c) => ({
                      ...c,
                      vehicle: {
                        ...c.vehicle,
                        [key]:
                          key === "year"
                            ? e.target.value.replace(/\D/g, "")
                            : e.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="shop-purchase-row">
        {p.type === "produto" ? (
          <div className="shop-quantity">
            <button
              aria-label="Diminuir quantidade"
              disabled={quantity === 1}
              onClick={() => setQuantity((q) => clampQuantity(q - 1))}
            >
              <Icon name="minus" />
            </button>
            <label>
              <span className="sr-only">Quantidade</span>
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) =>
                  setQuantity(clampQuantity(Number(e.target.value)))
                }
              />
            </label>
            <button
              aria-label="Aumentar quantidade"
              disabled={quantity === 99}
              onClick={() => setQuantity((q) => clampQuantity(q + 1))}
            >
              <Icon name="plus" />
            </button>
          </div>
        ) : null}
        <button
          className="shop-primary"
          onClick={() => {
            add(p, quantity, choice);
            setAdded(true);
          }}
        >
          {added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
          <Icon name={added ? "check" : "bag"} />
        </button>
      </div>
      <button className="shop-secondary" onClick={() => setCartOpen(true)}>
        Ver carrinho <Icon name="arrow" />
      </button>
      <p className="shop-subtle">
        Compra demonstrativa. Nenhum pedido real será enviado.
      </p>
    </div>
  );
}
