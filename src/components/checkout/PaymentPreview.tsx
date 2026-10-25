import { BrandLogo } from "../BrandLogo";
import { useRef, useState } from "react";
import { useCommerce } from "../../hooks/useCommerce";
export function PaymentPreview() {
  const c = useCommerce();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const method = c.checkout.payment;
  async function copy() {
    try {
      await navigator.clipboard.writeText("ELITE-PARTS-DEMO-NAO-PAGAVEL");
      setCopied(true);
    } catch {
      input.current?.focus();
      input.current?.select();
    }
  }
  if (method === "pix")
    return (
      <div className="payment-preview" key="pix">
        <div className="demo-qr">
          <svg
            viewBox="0 0 180 180"
            role="img"
            aria-label="QR Code ilustrativo e não pagável"
          >
            <rect width="180" height="180" fill="#fff" />
            {Array.from({ length: 324 }, (_, i) => {
              const x = i % 18,
                y = Math.floor(i / 18);
              return (x * 7 + y * 11 + x * y) % 5 < 2 ? (
                <rect
                  key={i}
                  x={x * 10 + 1}
                  y={y * 10 + 1}
                  width="8"
                  height="8"
                  fill="#232525"
                />
              ) : null;
            })}
            <rect x="22" y="70" width="136" height="40" fill="#E10600" />
            <text
              x="90"
              y="96"
              textAnchor="middle"
              fontSize="23"
              fill="white"
              fontWeight="bold"
            >
              DEMO
            </text>
          </svg>
        </div>
        <div>
          <span className="checkout-eyebrow">PIX ILUSTRATIVO</span>
          <h3>Uma prévia. Sem cobrança.</h3>
          <p>
            Este desenho não contém dados de pagamento. O código abaixo não é
            pagável.
          </p>
          <label className="shop-field">
            Código de demonstração
            <input
              ref={input}
              readOnly
              value="ELITE-PARTS-DEMO-NAO-PAGAVEL"
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <button type="button" className="shop-text-link" onClick={copy}>
            {copied
              ? "Código ilustrativo copiado"
              : "Copiar código ilustrativo"}
          </button>
        </div>
      </div>
    );
  if (method === "cartao")
    return (
      <div className="payment-preview payment-card-preview" key="card">
        <div className="demo-credit-card">
          <BrandLogo />
          <i aria-hidden="true" />
          <strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; 0000</strong>
          <small>
            CLIENTE DEMONSTRAÇÃO <b>SEM VALIDADE</b>
          </small>
        </div>
        <div>
          <h3>Cartão de demonstração</h3>
          <p>
            Nenhum número de cartão, validade ou CVV é solicitado. Use apenas o
            controle ilustrativo abaixo.
          </p>
          <label className="shop-field">
            Parcelamento simulado
            <select
              value={c.checkout.installments}
              onChange={(e) =>
                c.setCheckout((d) => ({ ...d, installments: e.target.value }))
              }
            >
              <option value="1">À vista · demonstração</option>
              <option value="2">2 parcelas sem juros · demonstração</option>
              <option value="3">3 parcelas sem juros · demonstração</option>
            </select>
          </label>
        </div>
      </div>
    );
  if (method === "boleto")
    return (
      <div className="payment-preview" key="boleto">
        <div
          className="demo-barcode"
          role="img"
          aria-label="Barras ilustrativas sem linha digitável"
        >
          {Array.from({ length: 38 }, (_, i) => (
            <i key={i} style={{ width: i % 3 === 0 ? 5 : 2 }} />
          ))}
          <b>SEM VALIDADE</b>
        </div>
        <div>
          <span className="checkout-eyebrow">BOLETO ILUSTRATIVO</span>
          <h3>Sem documento de cobrança.</h3>
          <p>
            O prazo de 3 dias úteis e as barras são apenas exemplos visuais. Não
            há boleto emitido, linha digitável ou pagamento disponível.
          </p>
        </div>
      </div>
    );
  return (
    <p className="checkout-small">
      Selecione uma modalidade para explorar a demonstração.
    </p>
  );
}
