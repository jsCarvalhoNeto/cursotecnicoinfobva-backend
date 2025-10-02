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
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.sql')) && 
                !dirPath.includes('node_modules') && 
                !dirPath.includes('deps')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles('.');
const filesWithMoreThan1000Lines = [];

allFiles.forEach(file => {
    const lines = countLinesInFile(file);
    if (lines > 1000) {
        filesWithMoreThan1000Lines.push({ file: file, lines: lines });
    }
});

filesWithMoreThan1000Lines.sort((a, b) => b.lines - a.lines);

console.log('Arquivos com mais de 1000 linhas:');
filesWithMoreThan1000Lines.forEach(item => {
    console.log(`${item.lines} lines: ${item.file}`);
});

console.log(`\nTotal de arquivos com mais de 100 linhas: ${filesWithMoreThan1000Lines.length}`);
