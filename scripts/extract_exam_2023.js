
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ Erro: VITE_GEMINI_API_KEY não encontrada no .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const PDF_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co/storage/v1/object/public/provas-originais/Prova_2023_6ano.pdf';

async function extractQuestions() {
    console.log("📥 Baixando PDF da prova 2023...");

    const response = await fetch(PDF_URL);
    if (!response.ok) throw new Error(`Erro ao baixar PDF: ${response.statusText}`);
    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(`✅ PDF baixado (${(pdfBuffer.byteLength / 1024).toFixed(0)} KB)`);
    console.log("🧠 Enviando para Gemini extrair questões...");

    const prompt = `
    Você é um especialista em extração de dados de provas de concursos escolares brasileiros.
    
    Analise este PDF da Prova do Colégio Pedro II (6º ano, ano 2023) e extraia TODAS as questões.
    
    Para CADA questão, retorne no seguinte formato JSON:
    {
        "numero_original": <número da questão na prova>,
        "materia": "Língua Portuguesa" ou "Matemática",
        "topico": "<tópico específico da questão>",
        "texto_base": "<texto de apoio/referência da questão, se houver. Transcreva o máximo possível.>",
        "enunciado": "<o enunciado/pergunta da questão>",
        "alternativas": {
            "A": "<texto da alternativa A>",
            "B": "<texto da alternativa B>",
            "C": "<texto da alternativa C>",
            "D": "<texto da alternativa D>"
        },
        "gabarito_sugerido": null
    }

    REGRAS:
    1. Extraia TODAS as questões da prova (geralmente 20: 10 de Português + 10 de Matemática).
    2. Para questões com imagem, adicione "imageUrl": "/assets/exams/2023_qN.png" (onde N é o número).
    3. Transcreva os textos base o mais fielmente possível.
    4. O tópico deve ser específico (ex: "Interpretação de Texto", "Frações", "Geometria Plana").
    5. Retorne APENAS o JSON Array, sem markdown nem texto adicional.
    `;

    try {
        let result;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`   Tentativa ${attempt}/3...`);
                result = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: 'application/pdf',
                                        data: pdfBase64
                                    }
                                },
                                { text: prompt }
                            ]
                        }
                    ],
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                break; // Success, exit retry loop
            } catch (retryError) {
                if (retryError.status === 429 && attempt < 3) {
                    const waitTime = attempt * 30000; // 30s, 60s
                    console.log(`   ⏳ Rate limit atingido. Aguardando ${waitTime / 1000}s...`);
                    await new Promise(r => setTimeout(r, waitTime));
                } else {
                    throw retryError;
                }
            }
        }


        const text = result.text;
        const questions = JSON.parse(text);

        const outputPath = path.join(__dirname, '..', 'extracted_questions_2023.json');
        fs.writeFileSync(outputPath, JSON.stringify(questions, null, 4), 'utf-8');

        console.log(`\n🎉 Sucesso! ${questions.length} questões extraídas!`);
        console.log(`📄 Salvo em: ${outputPath}`);

        // Summary
        const port = questions.filter(q => q.materia === 'Língua Portuguesa').length;
        const math = questions.filter(q => q.materia === 'Matemática').length;
        console.log(`   📚 Português: ${port} questões`);
        console.log(`   🔢 Matemática: ${math} questões`);

    } catch (error) {
        console.error("❌ Erro na extração:", error);
    }
}

extractQuestions();
