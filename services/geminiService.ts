import { GoogleGenAI } from "@google/genai";
import type { StockData, MarketIndex, AnalysisData, NewsArticle, HistoricalPricePoint, PublicTender } from '../types';

// L'initialisation se fait maintenant directement.
// L'environnement d'exécution DOIT fournir process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (text: string): string => {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return jsonText;
};

/**
 * Handles API errors, with special handling for rate-limiting.
 * @param error The error caught from the API call.
 * @param genericErrorMessage A function-specific error message to use as a fallback.
 */
const handleApiError = (error: unknown, genericErrorMessage: string): never => {
    console.error(`API Error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
        throw new Error("Limite de quota API atteinte. Vous avez effectué trop de requêtes aujourd'hui. Veuillez réessayer demain.");
    }
    
    throw new Error(`${genericErrorMessage} L'API a peut-être renvoyé une erreur ou un format inattendu.`);
};


export const getFinancialAnalysis = async (
  identifier: string,
  currency: string
): Promise<{ analysis: AnalysisData; news: NewsArticle[] }> => {
  const prompt = `
    En tant qu'analyste financier expert, effectue une analyse approfondie pour l'entreprise identifiée par "${identifier}".
    Ta réponse DOIT être un unique objet JSON valide, sans texte supplémentaire, ni formatage markdown.
    L'objet JSON doit avoir deux clés principales : "analysis" et "news".

    La clé "analysis" doit contenir un objet avec la structure suivante :
    - "companyName": string (Nom complet de l'entreprise)
    - "ticker": string (Le ticker boursier principal)
    - "summary": string (Un résumé concis de l'activité de l'entreprise)
    - "keyMetrics": un tableau d'objets, chacun avec :
        - "label": string (ex: "Capitalisation Boursière")
        - "value": string (ex: "2.5T ${currency}")
        - "change": string | undefined (ex: "+2.5%")
        - "changeType": "positive" | "negative" | "neutral" | undefined
        - "tooltip": string | undefined (explication de la métrique)
    - "projections": un tableau de 3 objets pour les 3 prochaines années, chacun avec :
        - "year": string (ex: "2025")
        - "revenue": number (en millions de ${currency})
        - "profit": number (en millions de ${currency})
    - "strengths": un tableau de 3 à 5 points forts (strings)
    - "weaknesses": un tableau de 3 à 5 points faibles ou risques (strings)
    - "recommendation": "Acheter" | "Conserver" | "Vendre"
    - "confidenceScore": number (de 0 à 100)

    La clé "news" doit contenir un tableau de 3 à 5 articles de presse récents pertinents, chacun avec :
    - "title": string
    - "uri": string (URL de l'article)

    Base ton analyse sur les données publiques les plus récentes. Sois réaliste et crédible. Les données financières doivent être exprimées en ${currency}.
    `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text);
    const parsed = JSON.parse(jsonText);

    // Basic validation
    if (!parsed.analysis || !parsed.news) {
        throw new Error("Réponse JSON invalide de l'API: clés 'analysis' ou 'news' manquantes.");
    }
    
    return parsed;
  } catch (error) {
    handleApiError(error, "Impossible de générer l'analyse financière.");
  }
};

export const getStockData = async (
    ticker: string
): Promise<StockData> => {
    const prompt = `Agis comme un simulateur de données boursières en temps réel. Pour l'action avec le ticker "${ticker}", fournis des données de marché réalistes mais fictives. Base-toi sur les informations publiques les plus récentes pour que les données soient crédibles. La réponse doit être UNIQUEMENT un objet JSON valide, sans aucun texte ou formatage supplémentaire comme du markdown.
        La structure doit être : { "companyName": string, "ticker": string, "exchange": string, "price": number, "change": number, "percentChange": string, "volume": string, "summary": string (brève description de l'entreprise), "recommendation": "Acheter" | "Conserver" | "Vendre", "confidenceScore": number (0-100) }.
        Le prix doit être un nombre réaliste. Le volume doit être une chaîne de caractères formatée (ex: "1.25M"). Le 'percentChange' doit être une chaîne de caractères avec un signe (+ ou -) et un pourcentage (ex: "+1.25%").`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = cleanJsonString(response.text);
        return JSON.parse(jsonText);
    } catch (error) {
        handleApiError(error, "Impossible de générer les données de l'action.");
    }
};

export const searchStocks = async (query: string): Promise<StockData[]> => {
    const prompt = `Agis comme une API de données boursières. En te basant sur la requête "${query}", fournis une liste d'actions pertinentes. La réponse doit être UNIQUEMENT un objet JSON valide sous forme de tableau, sans aucun texte ou formatage supplémentaire comme du markdown.
        Chaque objet du tableau doit avoir la structure suivante :
        {
            "companyName": string,
            "ticker": string,
            "exchange": string,
            "price": number,
            "change": number,
            "percentChange": string,
            "volume": string,
            "summary": string,
            "recommendation": "Acheter" | "Conserver" | "Vendre",
            "confidenceScore": number (0-100),
            "marketCap": string (ex: "2.5T", "500B", "10M"),
            "country": string (ex: "USA", "Côte d'Ivoire")
        }
        Fournis des données réalistes mais fictives, basées sur des informations publiques récentes pour la crédibilité. Inclus une bonne variété d'actions, y compris des actions africaines si la requête est générale.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = cleanJsonString(response.text);
        const data = JSON.parse(jsonText);

        if (!Array.isArray(data)) {
            throw new Error("Le format des données de recherche d'actions est invalide.");
        }
        
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de rechercher les actions.");
    }
};

export const getHistoricalStockData = async (
    ticker: string
): Promise<HistoricalPricePoint[]> => {
    const prompt = `Agis comme un simulateur de données boursières historiques. Pour le ticker "${ticker}", génère une série de données de prix de clôture pour les 30 derniers jours (aujourd'hui inclus). La réponse doit être UNIQUEMENT un tableau JSON valide d'objets, sans aucun texte ou formatage supplémentaire. Chaque objet doit représenter un jour et avoir la structure : { "date": "YYYY-MM-DD", "price": number }. Le tableau doit être ordonné du jour le plus ancien au plus récent. Les prix doivent montrer une volatilité réaliste et suivre une tendance crédible basée sur la performance récente de l'entreprise.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = cleanJsonString(response.text);
        const data = JSON.parse(jsonText);

        if (!Array.isArray(data) || data.some(item => typeof item.date !== 'string' || typeof item.price !== 'number')) {
            throw new Error("Le format des données historiques est invalide.");
        }
        
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de générer les données historiques de l'action.");
    }
};

export const getMarketOverview = async (): Promise<MarketIndex[]> => {
    const prompt = `Fournis un aperçu des principaux indices boursiers mondiaux (S&P 500, NASDAQ, CAC 40) et africains (BRVM Composite, JSE All Share, NSE All Share - Nigeria). 
    Pour chaque indice, donne son nom, sa valeur actuelle, la variation en points, la variation en pourcentage, et un type de changement ('positive', 'negative', 'neutral').
    La réponse doit être UNIQUEMENT un tableau JSON d'objets valide, sans aucun texte ou formatage supplémentaire comme du markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const jsonText = cleanJsonString(response.text);
        return JSON.parse(jsonText);
    } catch (error) {
        handleApiError(error, "Impossible de récupérer l'aperçu du marché.");
    }
};

export const searchPublicTenders = async (query: string): Promise<PublicTender[]> => {
    const prompt = `Agis comme une API de base de données de marchés publics. En te basant sur la requête "${query}", fournis une liste d'appels d'offres publics pertinents, avec un focus sur les marchés africains si la requête est générale. La réponse doit être UNIQUEMENT un objet JSON valide sous forme de tableau, sans aucun texte ou formatage supplémentaire comme du markdown.
        Chaque objet du tableau doit avoir la structure suivante :
        {
            "id": string (un identifiant unique que tu génères, ex: "tend_12345"),
            "title": string,
            "country": string,
            "sector": string,
            "issuingEntity": string,
            "summary": string,
            "deadline": "YYYY-MM-DD",
            "uri": string (une URL source valide)
        }
        Retourne entre 5 et 10 appels d'offres réalistes mais fictifs. Assure-toi que les données sont crédibles et bien formatées.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const jsonText = cleanJsonString(response.text);
        const data = JSON.parse(jsonText);

        if (!Array.isArray(data)) {
            throw new Error("Le format des données des appels d'offres est invalide.");
        }
        
        return data;
    } catch (error) {
        handleApiError(error, "Impossible de rechercher les appels d'offres.");
    }
};

export const generateStrategyStream = async (prompt: string) => {
    return await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: `Agis en tant que conseiller financier expert et mentor. Génère une stratégie d'investissement détaillée ou une réponse instructive basée sur la demande suivante : "${prompt}". La réponse doit être bien structurée, informative, et facile à comprendre. Utilise le format Markdown.`,
    });
};

export const getEducationalContentStream = async (topic: string) => {
    const prompt = `En tant qu'éducateur financier expert, rédige un article clair et concis sur le sujet suivant : "${topic}".
    L'article doit être bien structuré, facile à comprendre pour un public varié (allant du débutant à l'intermédiaire), et utiliser le format Markdown.
    Inclus des titres, des listes à puces si nécessaire, et mets en gras les termes importants.
    L'objectif est d'être informatif et engageant.`;
    
    return await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
};