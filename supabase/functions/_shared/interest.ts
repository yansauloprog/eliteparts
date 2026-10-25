export function normalizePhone(input: string) {
  let n = input.replace(/[\s().-]/g, "");
  if (!n.startsWith("+") && /^\d{10,11}$/.test(n)) n = "+55" + n;
  else if (!n.startsWith("+")) n = "+" + n;
  if (
    !/^\+[1-9]\d{7,14}$/.test(n) ||
    (n.startsWith("+55") && !/^\+55[1-9][0-9][0-9]{8,9}$/.test(n))
  )
    throw new Error("Telefone inválido.");
  return n;
}
