
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractText() {
    const pdfPath = path.join(__dirname, 'prova_2023.pdf');

    if (!fs.existsSync(pdfPath)) {
        console.log("📥 Baixando PDF...");
        const response = await fetch('https://xeimqibtnjchbfgsjqsk.supabase.co/storage/v1/object/public/provas-originais/Prova_2023_6ano.pdf');
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(pdfPath, buffer);
        console.log(`✅ PDF salvo (${(buffer.length / 1024).toFixed(0)} KB)`);
    } else {
        console.log("✅ PDF já existe localmente.");
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    const outputPath = path.join(__dirname, '..', 'prova_2023_bruto.txt');
    fs.writeFileSync(outputPath, data.text, 'utf-8');

    console.log(`📄 Páginas: ${data.numpages}`);
    console.log(`💾 Texto salvo em: prova_2023_bruto.txt`);
    console.log(`📏 Tamanho: ${data.text.length} caracteres`);
}

extractText().catch(err => console.error("❌ Erro:", err.message));
