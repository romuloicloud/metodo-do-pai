/**
 * map_images_to_json.js
 * 
 * Mapeia imagens extraídas às questões no JSON, gerando relatório de validação.
 * Útil para mapear ANTES do upload (usando paths locais) ou DEPOIS (usando URLs).
 * 
 * Uso: node scripts/map_images_to_json.js <ano>
 * Exemplo: node scripts/map_images_to_json.js 2023
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const BUCKET_NAME = 'exam-images';
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'assets', 'exams');

function main() {
    const year = process.argv[2];
    if (!year) {
        console.error('❌ Uso: node scripts/map_images_to_json.js <ano>');
        process.exit(1);
    }

    // Encontrar o JSON de questões
    const baseDir = path.join(__dirname, '..');
    const possibleFiles = [
        `extracted_questions_${year}.json`,
        `extracted_questions_${year}_ready.json`,
        `extracted_questions_${year}_full.json`,
        `extracted_questions.json`, // fallback para o principal
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
        console.error(`❌ Nenhum JSON de questões encontrado para ${year}`);
        process.exit(1);
    }

    // Listar imagens disponíveis
    const allImages = fs.readdirSync(IMAGES_DIR).filter(f => f.startsWith(year) && f.endsWith('.png'));
    const imageSet = new Set(allImages);

    // Carregar questões
    const questions = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    console.log(`\n📊 Relatório de Mapeamento Visual — Prova ${year}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 JSON: ${path.basename(jsonFile)}`);
    console.log(`🖼️  Imagens disponíveis: ${allImages.length}`);
    console.log(`📝 Total de questões: ${questions.length}\n`);

    let mapped = 0;
    let unmapped = 0;
    let needsImage = 0;

    for (const q of questions) {
        const num = String(q.numero_original).padStart(2, '0');
        const materia = q.materia.toLowerCase().includes('portugu') ? 'port' : 'mat';
        const materiaLabel = materia === 'port' ? 'Port' : 'Mat';
        const expectedFile = `${year}_${materia}_q${num}.png`;

        // Verificar se a questão tem indicação de imagem
        const hasImageRef = q.imageUrl || q.image_url ||
            (q.texto_base && (q.texto_base.includes('[IMAGEM') || q.texto_base.includes('[GRÁFICO') || q.texto_base.includes('figura') || q.texto_base.includes('tirinha') || q.texto_base.includes('malha'))) ||
            (q.enunciado && (q.enunciado.includes('figura') || q.enunciado.includes('gráfico') || q.enunciado.includes('tirinha')));

        if (imageSet.has(expectedFile)) {
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${year}/${expectedFile}`;
            q.image_url = publicUrl;
            mapped++;
            console.log(`✅ Q${num} (${materiaLabel}) → ${expectedFile}`);
        } else if (hasImageRef) {
            needsImage++;
            console.log(`⚠️  Q${num} (${materiaLabel}) → IMAGEM ESPERADA mas não encontrada: ${expectedFile}`);
        } else {
            unmapped++;
            console.log(`⏭️  Q${num} (${materiaLabel}) → Sem imagem (somente texto)`);
        }
    }

    // Salvar JSON atualizado
    fs.writeFileSync(jsonFile, JSON.stringify(questions, null, 4), 'utf-8');

    // Relatório final
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Resumo:`);
    console.log(`   ✅ Mapeadas: ${mapped} questões com imagem`);
    console.log(`   ⚠️  Pendentes: ${needsImage} questões que precisam de imagem`);
    console.log(`   ⏭️  Somente texto: ${unmapped} questões`);
    console.log(`   📄 JSON atualizado: ${path.basename(jsonFile)}`);

    // Imagens que não foram associadas a nenhuma questão
    const mappedFiles = new Set();
    for (const q of questions) {
        if (q.image_url) {
            const fileName = q.image_url.split('/').pop();
            mappedFiles.add(fileName);
        }
    }
    const orphanImages = allImages.filter(f => !mappedFiles.has(f) && !f.includes('manifest'));
    if (orphanImages.length > 0) {
        console.log(`\n🔍 Imagens órfãs (não associadas a questões):`);
        orphanImages.forEach(f => console.log(`   ❓ ${f}`));
    }
}

main();
