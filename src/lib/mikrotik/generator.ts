/**
 * Utilitas untuk membuat kode voucher (username/password)
 */
export function generateVoucher(params: {
  length: number;
  type: "up" | "low" | "num" | "mix" | "letters" | "full" | "lowNum";
  prefix?: string;
}) {
  let charset = "";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Tanpa I dan O (biar gak bingung)
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789"; // Tanpa 0 dan 1

  switch (params.type) {
    case "up": charset = uppercase; break;
    case "low": charset = lowercase; break;
    case "num": charset = numbers; break;
    case "letters": charset = uppercase + lowercase; break;
    case "full": charset = uppercase + lowercase + numbers; break;
    case "lowNum": charset = lowercase + numbers; break;
    case "mix": charset = uppercase + numbers; break;
    default: charset = uppercase + numbers;
  }

  let result = "";
  for (let i = 0; i < params.length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return (params.prefix || "") + result;
}
