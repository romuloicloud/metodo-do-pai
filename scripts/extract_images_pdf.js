/**
 * extract_images_pdf.js
 * 
 * Scanner de Imagens + Auto-Crop para provas PDF.
 * Renderiza cada página em alta resolução usando pdfjs-dist + canvas,
 * detecta regiões de imagem e faz recorte automático com sharp.
 * 
 * Uso: node scripts/extract_images_pdf.js prova_2023.pdf
 * 
 * Dependências: pdfjs-dist, canvas, sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createCanvas } = require('canvas');

// === CONFIGURAÇÃO ===
const SCALE_FACTOR = 3.0; // ~216 DPI (72 * 3) — boa resolução para recortes
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'exams');
const TEMP_DIR = path.join(__dirname, '..', 'temp_pages');

// Limiares para detecção de regiões de imagem
const MIN_IMAGE_HEIGHT = 80; // pixels mínimos para considerar uma imagem
const STRIP_HEIGHT = 30;     // pixels por faixa de análise

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Carrega o PDF usando pdfjs-dist (API Node compatível).
 */
async function loadPdf(pdfPath) {
    // pdfjs-dist v4+ usa ESM, precisamos de fallback para CJS
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    return doc;
}

/**
 * Renderiza uma página do PDF em um canvas e salva como PNG.
 */
async function renderPage(doc, pageNum, outputPath) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: SCALE_FACTOR });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Fundo branco
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise;

    // Salvar como PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return { width: viewport.width, height: viewport.height };
}

/**
 * Analisa uma página renderizada e detecta regiões de imagem.
 * Usa análise de variância de cor e densidade de pixels coloridos.
 */
async function detectImageRegions(pagePath, pageNum) {
    const image = sharp(pagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const rawBuffer = await image.raw().toBuffer();
    const channels = metadata.channels || 3;

    const regions = [];
    const totalStrips = Math.floor(height / STRIP_HEIGHT);

    let inImageRegion = false;
    let regionStart = 0;

    for (let strip = 0; strip < totalStrips; strip++) {
        const y = strip * STRIP_HEIGHT;
        const stripPixels = [];

        // Amostrar pixels da faixa (a cada 5 pixels horizontalmente)
        for (let x = 0; x < width; x += 5) {
            const offset = (y * width + x) * channels;
            if (offset + 2 < rawBuffer.length) {
                const r = rawBuffer[offset];
                const g = rawBuffer[offset + 1];
                const b = rawBuffer[offset + 2];
                stripPixels.push({ r, g, b });
            }
        }

        if (stripPixels.length === 0) continue;

        // Médias
        const avgR = stripPixels.reduce((s, p) => s + p.r, 0) / stripPixels.length;
        const avgG = stripPixels.reduce((s, p) => s + p.g, 0) / stripPixels.length;
        const avgB = stripPixels.reduce((s, p) => s + p.b, 0) / stripPixels.length;

        // Variância de cor (imagens coloridas têm alta variância)
        const variance = stripPixels.reduce((s, p) => {
            return s + Math.pow(p.r - avgR, 2) + Math.pow(p.g - avgG, 2) + Math.pow(p.b - avgB, 2);
        }, 0) / stripPixels.length;

        // Contagem de pixels não-brancos
        const nonWhiteCount = stripPixels.filter(p => p.r < 230 || p.g < 230 || p.b < 230).length;
        const nonWhiteRatio = nonWhiteCount / stripPixels.length;

        // Contagem de pixels coloridos (não cinza) — distingue imagens de texto preto
        const colorfulCount = stripPixels.filter(p => {
            const maxC = Math.max(p.r, p.g, p.b);
            const minC = Math.min(p.r, p.g, p.b);
            return (maxC - minC) > 30; // Diferença entre canais indica cor
        }).length;
        const colorfulRatio = colorfulCount / stripPixels.length;

        // Heurística: região de imagem tem variância alta OU muitos pixels coloridos OU alta densidade
        const isImageStrip = (variance > 3000) ||
            (colorfulRatio > 0.15) ||
            (nonWhiteRatio > 0.5 && variance > 1000);

        if (isImageStrip && !inImageRegion) {
            inImageRegion = true;
            regionStart = y;
        } else if (!isImageStrip && inImageRegion) {
            inImageRegion = false;
            const regionHeight = y - regionStart;
            if (regionHeight >= MIN_IMAGE_HEIGHT) {
                const margin = 30;
                regions.push({
                    x: 0,
                    y: Math.max(0, regionStart - margin),
                    width: width,
                    height: Math.min(regionHeight + margin * 2, height - Math.max(0, regionStart - margin)),
                    page: pageNum
                });
            }
        }
    }

    // Fechar região se terminar dentro de uma
    if (inImageRegion) {
        const regionHeight = height - regionStart;
        if (regionHeight >= MIN_IMAGE_HEIGHT) {
            regions.push({
                x: 0,
                y: Math.max(0, regionStart - 30),
                width: width,
                height: Math.min(regionHeight + 60, height - Math.max(0, regionStart - 30)),
                page: pageNum
            });
        }
    }

    return regions;
}

/**
 * Recorta uma região e aplica auto-crop para remover bordas brancas.
 */
async function cropAndSave(pagePath, region, outputPath) {
    // Garantir que os valores de extração são inteiros válidos
    const extractOpts = {
        left: Math.round(region.x),
        top: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height)
    };

    await sharp(pagePath)
        .extract(extractOpts)
        .trim({ threshold: 15 }) // Auto-crop: remove bordas ~brancas
        .png({ compressionLevel: 6 })
        .toFile(outputPath);
}

/**
 * Limpa o diretório temporário.
 */
function cleanTemp() {
    if (fs.existsSync(TEMP_DIR)) {
        const files = fs.readdirSync(TEMP_DIR);
        files.forEach(f => fs.unlinkSync(path.join(TEMP_DIR, f)));
        fs.rmdirSync(TEMP_DIR);
        console.log('   ✅ Temporários limpos.');
    }
}

/**
 * Extrai o ano do nome do arquivo.
 */
function extractYear(filename) {
    const match = filename.match(/(\d{4})/);
    return match ? match[1] : 'unknown';
}

// === EXECUÇÃO PRINCIPAL ===
async function main() {
    const filename = process.argv[2];
    if (!filename) {
        console.error('❌ Uso: node scripts/extract_images_pdf.js <arquivo.pdf>');
        console.error('   Exemplo: node scripts/extract_images_pdf.js prova_2023.pdf');
        process.exit(1);
    }

    const pdfPath = path.join(__dirname, filename);
    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ Arquivo não encontrado: ${pdfPath}`);
        process.exit(1);
    }

    const year = extractYear(filename);
    console.log(`\n🔍 Extração Visual — Prova ${year}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await ensureDir(OUTPUT_DIR);
    await ensureDir(TEMP_DIR);

    try {
        // 1. Carregar PDF
        console.log(`\n📄 Carregando PDF...`);
        const doc = await loadPdf(pdfPath);
        const numPages = doc.numPages;
        console.log(`   ✅ ${numPages} páginas encontradas.`);

        // 2. Renderizar e analisar cada página
        let totalImages = 0;
        const extractedImages = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const pageTempPath = path.join(TEMP_DIR, `page_${String(pageNum).padStart(3, '0')}.png`);

            console.log(`\n📃 Página ${pageNum}/${numPages}...`);

            // Renderizar página
            const dims = await renderPage(doc, pageNum, pageTempPath);
            console.log(`   📐 ${dims.width}x${dims.height} px`);

            // Detectar regiões de imagem
            const regions = await detectImageRegions(pageTempPath, pageNum);

            if (regions.length === 0) {
                console.log(`   ⏭️  Sem imagens detectadas.`);
                continue;
            }

            console.log(`   🖼️  ${regions.length} região(ões) encontrada(s).`);

            for (let r = 0; r < regions.length; r++) {
                totalImages++;
                const tempName = `${year}_page${String(pageNum).padStart(2, '0')}_img${String(r + 1).padStart(2, '0')}.png`;
                const outputPath = path.join(OUTPUT_DIR, tempName);

                try {
                    await cropAndSave(pageTempPath, regions[r], outputPath);
                    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
                    console.log(`   ✅ ${tempName} (${fileSize} KB)`);

                    extractedImages.push({
                        fileName: tempName,
                        page: pageNum,
                        regionIndex: r,
                        sizeKB: fileSize
                    });
                } catch (cropErr) {
                    console.log(`   ⚠️  Erro ao recortar região ${r + 1}: ${cropErr.message}`);
                    totalImages--;
                }
            }
        }

        // 3. Relatório final
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📊 Extração concluída!`);
        console.log(`   📄 Páginas: ${numPages}`);
        console.log(`   🖼️  Imagens extraídas: ${totalImages}`);
        console.log(`   📁 Salvas em: public/assets/exams/`);

        if (totalImages > 0) {
            console.log(`\n⚠️  PRÓXIMO PASSO:`);
            console.log(`   Renomeie os arquivos para o padrão: {ano}_{materia}_q{num}.png`);
            console.log(`   Ex: ${year}_mat_q11.png, ${year}_port_q10.png`);
        }

        // Salvar manifesto
        const manifestPath = path.join(OUTPUT_DIR, `${year}_extraction_manifest.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(extractedImages, null, 2), 'utf-8');
        console.log(`\n📋 Manifesto: ${path.basename(manifestPath)}`);

    } catch (err) {
        console.error(`\n❌ Erro durante extração:`, err.message);
        console.error(err.stack);
        throw err;
    } finally {
        console.log(`\n🧹 Limpando temporários...`);
        cleanTemp();
    }
}

main().catch(err => {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
});
