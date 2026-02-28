
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractText(filename) {
    const pdfPath = path.join(__dirname, filename);
    const outputFileName = filename.replace('.pdf', '_bruto.txt');
    const outputPath = path.join(__dirname, '..', outputFileName);

    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ Erro: PDF em ${pdfPath} não encontrado!`);
        return;
    }

    console.log(`📥 Lendo ${filename}...`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    fs.writeFileSync(outputPath, data.text, 'utf-8');

    console.log(`✅ Texto extraído com sucesso!`);
    console.log(`📄 Páginas: ${data.numpages}`);
    console.log(`💾 Salvo em: ${outputFileName}`);
}

const fileToProcess = process.argv[2] || 'prova_2025.pdf';
extractText(fileToProcess).catch(err => console.error("❌ Erro:", err.message));
