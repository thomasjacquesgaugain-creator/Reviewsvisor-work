/**
 * Script pour conditionner tous les console.log avec import.meta.env.PROD
 * Usage: node scripts/condition-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function shouldSkipFile(filePath) {
  // Ne pas modifier les fichiers de configuration ou les Edge Functions
  return filePath.includes('node_modules') || 
         filePath.includes('supabase/functions') ||
         filePath.includes('.test.') ||
         filePath.includes('.spec.');
}

function conditionConsoleLogs(content, filePath) {
  // Pattern pour détecter console.log avec préfixes [xxx]
  const logPattern = /(\s*)(console\.log\([^)]*\[[^\]]+\][^)]*\);)/g;
  
  let modified = false;
  let newContent = content;
  
  // Remplacer les console.log avec préfixes
  newContent = newContent.replace(logPattern, (match, indent, logStatement) => {
    // Vérifier si déjà conditionné
    if (newContent.includes(`if (!import.meta.env.PROD)`) && 
        newContent.indexOf(match) > newContent.lastIndexOf('if (!import.meta.env.PROD)')) {
      return match; // Déjà conditionné
    }
    
    modified = true;
    return `${indent}if (!import.meta.env.PROD) {\n${indent}  ${logStatement}\n${indent}}`;
  });
  
  // Pattern pour console.log simples (sans préfixes)
  const simpleLogPattern = /(\s*)(console\.log\([^)]+\);)/g;
  newContent = newContent.replace(simpleLogPattern, (match, indent, logStatement) => {
    // Ignorer si c'est dans un bloc if (!import.meta.env.PROD) déjà
    const beforeMatch = newContent.substring(0, newContent.indexOf(match));
    if (beforeMatch.includes('if (!import.meta.env.PROD)') && 
        beforeMatch.lastIndexOf('if (!import.meta.env.PROD)') > beforeMatch.lastIndexOf('}')) {
      return match; // Déjà dans un bloc conditionné
    }
    
    // Ignorer les console.log dans les fichiers de test ou debug
    if (filePath.includes('Debug') || filePath.includes('test')) {
      return match;
    }
    
    modified = true;
    return `${indent}if (!import.meta.env.PROD) {\n${indent}  ${logStatement}\n${indent}}`;
  });
  
  return { content: newContent, modified };
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: newContent, modified } = conditionConsoleLogs(content, filePath);
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Modifié: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Exécution
console.log('🔍 Recherche des fichiers...');
const files = walkDir(srcDir);
console.log(`📁 ${files.length} fichiers trouvés\n`);

let modifiedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    modifiedCount++;
  }
});

console.log(`\n✅ ${modifiedCount} fichiers modifiés sur ${files.length} fichiers`);

