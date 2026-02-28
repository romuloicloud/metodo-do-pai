/**
 * upload_exam_images.js
 * 
 * Upload de imagens extraídas para o Supabase Storage + mapeamento de URL no JSON.
 * 
 * Uso: node scripts/upload_exam_images.js <ano>
 * Exemplo: node scripts/upload_exam_images.js 2023
 * 
 * Pré-requisitos:
 * - Imagens já renomeadas no padrão {ano}_{materia}_q{num}.png em public/assets/exams/
 * - Bucket 'exam-images' criado no Supabase Storage (público)
 * - Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuração Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'exam-images';

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'assets', 'exams');

/**
 * Faz upload de um arquivo ao Supabase Storage via fetch (sem SDK).
 */
async function uploadFile(filePath, storagePath) {
    const fileBuffer = fs.readFileSync(filePath);

    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true', // Sobrescrever se existir
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload falhou para ${storagePath}: ${response.status} - ${error}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
}

/**
 * Gera a URL pública de uma imagem no bucket.
 */
function getPublicUrl(year, fileName) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${year}/${fileName}`;
}

/**
 * Atualiza o JSON de questões com as URLs do Supabase.
 */
function updateJsonWithUrls(year, imageMap) {
    // Procurar o JSON de questões correspondente
    const baseDir = path.join(__dirname, '..');
    const possibleFiles = [
        `extracted_questions_${year}.json`,
        `extracted_questions_${year}_ready.json`,
        `extracted_questions_${year}_full.json`,
    ];

    let jsonFile = null;
    for (const f of possibleFiles) {
        const fullPath = path.join(baseDir, f);
        if (fs.existsSync(fullPath)) {
            jsonFile = fullPath;
            break;
        }
    }

    if (!jsonFile) {
        console.log(`⚠️  Nenhum JSON encontrado para o ano ${year}. Pulando mapeamento.`);
        return;
    }

    console.log(`\n📝 Atualizando ${path.basename(jsonFile)} com URLs do Supabase...`);

    const questions = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    let mapped = 0;

    for (const q of questions) {
        const num = String(q.numero_original).padStart(2, '0');
        const materia = q.materia.toLowerCase().includes('portugu') ? 'port' : 'mat';
        const expectedFile = `${year}_${materia}_q${num}.png`;

        if (imageMap[expectedFile]) {
            q.image_url = imageMap[expectedFile];
            mapped++;
        }
    }

    fs.writeFileSync(jsonFile, JSON.stringify(questions, null, 4), 'utf-8');
    console.log(`   ✅ ${mapped} questões atualizadas com image_url.`);
}

// === EXECUÇÃO PRINCIPAL ===
async function main() {
    const year = process.argv[2];
    if (!year) {
        console.error('❌ Uso: node scripts/upload_exam_images.js <ano>');
        console.error('   Exemplo: node scripts/upload_exam_images.js 2023');
        process.exit(1);
    }

    if (!SUPABASE_SERVICE_KEY) {
        console.error('❌ SUPABASE_SERVICE_KEY não encontrada no .env.local');
        console.error('   Adicione: SUPABASE_SERVICE_KEY=sua_chave_aqui');
        process.exit(1);
    }

    console.log(`\n☁️  Upload de Imagens — Prova ${year}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📁 Bucket: ${BUCKET_NAME}`);
    console.log(`🌐 Supabase: ${SUPABASE_URL}`);

    // Listar imagens do ano
    const allFiles = fs.readdirSync(IMAGES_DIR);
    const yearFiles = allFiles.filter(f => f.startsWith(year) && f.endsWith('.png') && !f.includes('manifest'));

    if (yearFiles.length === 0) {
        console.error(`\n❌ Nenhuma imagem encontrada para o ano ${year} em public/assets/exams/`);
        console.error(`   Certifique-se de que os arquivos seguem o padrão: ${year}_mat_q01.png`);
        process.exit(1);
    }

    console.log(`\n📦 ${yearFiles.length} imagens encontradas para upload:\n`);

    const imageMap = {};
    let uploaded = 0;
    let errors = 0;

    for (const fileName of yearFiles.sort()) {
        const filePath = path.join(IMAGES_DIR, fileName);
        const storagePath = `${year}/${fileName}`;

        try {
            const publicUrl = await uploadFile(filePath, storagePath);
            imageMap[fileName] = publicUrl;
            uploaded++;
            const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
            console.log(`   ✅ ${fileName} (${fileSize} KB) → ${storagePath}`);
        } catch (err) {
            errors++;
            console.error(`   ❌ ${fileName}: ${err.message}`);
        }
    }

    // Relatório
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Upload concluído!`);
    console.log(`   ✅ Enviados: ${uploaded}`);
    if (errors > 0) console.log(`   ❌ Erros: ${errors}`);

    // Atualizar JSON com URLs
    updateJsonWithUrls(year, imageMap);

    // Relatório final de mapeamento
    console.log(`\n📋 Mapeamento de URLs:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    for (const [file, url] of Object.entries(imageMap)) {
        console.log(`   ${file} → ${url}`);
    }
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
