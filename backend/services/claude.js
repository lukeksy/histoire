const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Génère 10 sujets d'histoire de France variés pour la journée
 */
async function generateDailyTopics() {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Tu es un expert en histoire de France. Génère exactement 10 sujets d'étude précis et pointus sur l'histoire de France, couvrant différentes époques et thématiques.

Choisir des sujets VARIÉS : pas deux sujets de la même époque ni du même thème. Couvrir l'ensemble de l'histoire française, des Gaulois au XXe siècle. Privilégier des angles originaux et méconnus plutôt que les grandes dates classiques.

Pour chaque sujet, fournis :
- title : Un titre précis et accrocheur (entre 8 et 15 mots)
- era : L'époque concernée (ex : "Moyen Âge", "XVIIe siècle", "Belle Époque", "Gaule romaine"...)
- category : Une seule parmi : Politique, Guerre, Religion, Société, Économie, Art & Culture, Science, Personnage
- summary : 2 à 3 phrases engageantes qui donnent envie d'en savoir plus, sans tout révéler

Réponds UNIQUEMENT avec du JSON valide, sans bloc markdown, sans texte avant ou après :
{
  "topics": [
    {
      "title": "...",
      "era": "...",
      "category": "...",
      "summary": "..."
    }
  ]
}`
    }]
  });

  const responseText = message.content[0].text.trim();
  const data = JSON.parse(responseText);
  return data.topics;
}

/**
 * Génère un article complet et détaillé sur un sujet
 */
async function generateTopicContent(title, era, category, summary) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Tu es un historien passionné spécialisé dans l'histoire de France. Rédige un article complet et captivant sur le sujet suivant.

Titre : ${title}
Époque : ${era}
Catégorie : ${category}
Accroche : ${summary}

L'article doit :
- Être rédigé en français, de manière vivante et accessible à un passionné cultivé non-spécialiste
- Faire entre 700 et 900 mots
- Commencer directement dans le vif du sujet, avec une anecdote ou une scène concrète qui captive immédiatement
- Développer le contexte historique, les événements clés, les acteurs importants et leurs motivations
- Inclure des détails précis et inattendus qui enrichissent la compréhension
- Se conclure par une réflexion sur les conséquences ou l'écho de cet événement dans l'histoire ultérieure ou la France d'aujourd'hui
- Être structuré en paragraphes fluides, sans titres de section

Commence directement l'article, sans titre ni phrase d'introduction du type "Voici l'article" ou "Cet article traite de...".`
    }]
  });

  return message.content[0].text;
}

module.exports = { generateDailyTopics, generateTopicContent };
