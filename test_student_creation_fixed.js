const testData = {
  fullName: "Test Student",
  email: "test.student@example.com",
  grade: "1º Ano",
  teacherId: "1"
};

console.log("Testando dados de estudante:");
console.log("Nome completo:", testData.fullName);
console.log("Email:", testData.email);
console.log("Série:", testData.grade);
console.log("Professor ID:", testData.teacherId);

// Testar sanitização de dados
function sanitizeStudentData(data) {
  const sanitizedTeacherId = data.teacherId && !['loading', 'error', 'no-teachers'].includes(data.teacherId) 
    ? data.teacherId 
    : undefined;

  return {
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    studentRegistration: data.studentRegistration ? data.studentRegistration.trim().toUpperCase() : '',
    grade: data.grade,
    teacherId: sanitizedTeacherId,
  };
}

const sanitized = sanitizeStudentData(testData);
console.log("\nDados sanitizados:", sanitized);

// Testar validação de campos
const requiredFields = ['fullName', 'email', 'grade', 'teacherId'];
const missingFields = requiredFields.filter(field => !testData[field] || ['loading', 'error', 'no-teachers'].includes(testData[field]));

console.log("\nCampos obrigatórios presentes:", requiredFields.filter(field => testData[field] && !['loading', 'error', 'no-teachers'].includes(testData[field])));

if (missingFields.length === 0 && sanitized.teacherId) {
  console.log("✓ Todos os campos obrigatórios estão presentes e válidos");
} else {
  console.log("✗ Campos obrigatórios ausentes ou inválidos:", missingFields);
}

// Testar validação de série
const validGrades = ['1º Ano', '2º Ano', '3º Ano'];
if (validGrades.includes(testData.grade)) {
  console.log("✓ Série válida");
} else {
  console.log("✗ Série inválida");
}

// Testar validação de professor ID
if (testData.teacherId && !['loading', 'error', 'no-teachers'].includes(testData.teacherId)) {
  console.log("✓ Professor ID válido");
} else {
  console.log("✗ Professor ID inválido");
}

console.log("\nTeste concluído com sucesso!");
