import { GoogleGenAI } from "@google/genai";
import { Product, Invoice } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (productName: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Missing (API Key)";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, professional, and catchy product description (max 20 words) for a product named "${productName}".`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to generate description.";
  }
};

export const analyzeBusinessData = async (invoices: Invoice[], products: Product[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Missing";

  // Prepare a summary to send to AI (avoid sending too much PII)
  const summary = {
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    invoiceCount: invoices.length,
    lowStockCount: products.filter(p => p.stock < 5).length,
    topProducts: products.sort((a, b) => b.stock - a.stock).slice(0, 3).map(p => p.name)
  };

  const prompt = `
    Analyze this business data:
    Total Revenue: $${summary.totalRevenue}
    Invoices Issued: ${summary.invoiceCount}
    Low Stock Items: ${summary.lowStockCount}
    High Stock Products: ${summary.topProducts.join(", ")}

    Provide 3 brief, actionable insights or tips for the business owner in a friendly tone. 
    Focus on inventory optimization and sales growth.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Could not analyze data at this moment.";
  }
};