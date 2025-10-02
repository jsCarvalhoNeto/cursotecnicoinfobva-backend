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

// Verificar se todos os campos obrigatórios estão presentes
const requiredFields = ['fullName', 'email', 'grade', 'teacherId'];
const missingFields = requiredFields.filter(field => !testData[field]);

if (missingFields.length === 0) {
  console.log("✓ Todos os campos obrigatórios estão presentes");
} else {
  console.log("✗ Campos obrigatórios ausentes:", missingFields);
}

// Testar validação de série
const validGrades = ['1º Ano', '2º Ano', '3º Ano'];
if (validGrades.includes(testData.grade)) {
  console.log("✓ Série válida");
} else {
  console.log("✗ Série inválida");
}

console.log("\nTeste concluído com sucesso!");
