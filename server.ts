import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

app.use(express.json());

// API route: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiActive: !!ai });
});

// API route: Gemini Explanations for OOP / JDBC / Swing
app.post("/api/explain", async (req, res) => {
  try {
    const { message, topic, codeContext } = req.body;
    
    if (!ai) {
      return res.status(503).json({ 
        error: "Gemini API Key is missing. Please add your GEMINI_API_KEY in the Secrets panel in the Settings menu." 
      });
    }

    const systemPrompt = `You are a helpful and experienced Professor of Computer Science teaching Java Object-Oriented Programming, Java Swing, and JDBC.
Your student is working on an "Inventory Management System" hackathon project.

The requirements are:
1. Use at least 3 classes following object-oriented design.
2. Implement encapsulation using private data members and getter/setter methods.
3. Use inheritance or interfaces wherever appropriate.
4. Build the user interface using Java Swing.
5. Perform data storage and retrieval using JDBC (simulated with SQLite/H2 syntax).
6. Handle invalid inputs using exception handling.
7. Switch between light and dark modes in Swing (represented by Look and Feel).
8. Encrypt administrative password storing.
9. Display prices in INR (Rs.).

Here is the Java source code context the student is viewing:
${codeContext || "Java Inventory Code Base"}

Provide a highly educational, accurate, and encouraging response.
If the student asks to explain an OOP concept, explain it with direct reference to the provided Java files.
Keep the code examples pristine, well-formatted, and completely compliant with modern Java. Do not use markdown backticks in a self-contradictory manner. Organize with clear headers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message || `Explain how ${topic || "Object Oriented Programming"} is implemented in this codebase.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred while contacting the Gemini service." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
