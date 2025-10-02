const fs = require('fs');
const path = require('path');

function countLinesInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch (error) {
        return 0;
    }
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.sql')) && 
                !dirPath.includes('node_modules') && 
                !dirPath.includes('deps')) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles('.');
const filesBySize = [];

allFiles.forEach(file => {
    const lines = countLinesInFile(file);
    if (lines > 500) {
        filesBySize.push({ file: file, lines: lines });
    }
});

filesBySize.sort((a, b) => b.lines - a.lines);

console.log('Arquivos com mais de 500 linhas:');
filesBySize.forEach(item => {
    console.log(`${item.lines} lines: ${item.file}`);
});

console.log(`\nTotal de arquivos com mais de 500 linhas: ${filesBySize.length}`);

// Também vamos verificar a distribuição geral
const sizeRanges = {
    '1-100': 0,
    '101-200': 0,
    '201-300': 0,
    '301-400': 0,
    '401-500': 0,
    '501-600': 0,
    '601-700': 0,
    '701-800': 0,
    '801-900': 0,
    '901-1000': 0
};

allFiles.forEach(file => {
    const lines = countLinesInFile(file);
    if (lines <= 100) sizeRanges['1-100']++;
    else if (lines <= 200) sizeRanges['101-200']++;
    else if (lines <= 300) sizeRanges['201-300']++;
    else if (lines <= 400) sizeRanges['301-400']++;
    else if (lines <= 500) sizeRanges['401-500']++;
    else if (lines <= 600) sizeRanges['501-600']++;
    else if (lines <= 700) sizeRanges['601-700']++;
    else if (lines <= 800) sizeRanges['701-800']++;
    else if (lines <= 900) sizeRanges['801-900']++;
    else if (lines <= 1000) sizeRanges['901-1000']++;
});

console.log('\nDistribuição de tamanhos de arquivos:');
Object.entries(sizeRanges).forEach(([range, count]) => {
    if (count > 0) {
        console.log(`${range} linhas: ${count} arquivos`);
    }
});
