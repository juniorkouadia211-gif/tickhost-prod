import jwt from 'jsonwebtoken';
 
const QR_SECRET = process.env.QR_SECRET || 'event-tick-qr-secret-2026';
 
// Pas d'expiration sur les QR codes.
// Un billet reste valide jusqu'à ce qu'un agent le scanne.
// C'est le scan lui-même qui le périme, pas une date.
export const signTicket = (uniqueCode: string) => {
  return jwt.sign({ code: uniqueCode }, QR_SECRET);
};
 
export const verifyTicket = (token: string) => {
  try {
    const decoded = jwt.verify(token, QR_SECRET) as { code: string };
    return decoded.code;
  } catch (err) {
    // JWT invalide ou falsifié
    return null;
  }
};