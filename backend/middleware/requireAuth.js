/**
 * Middleware Express — bloque les requêtes non authentifiées
 * Renvoie 401 si l'utilisateur n'a pas de session active
 */
module.exports = function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
};
