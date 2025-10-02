// Testar com valores de erro
const testDataError = {
  fullName: 'Test Student',
  email: 'test.student@example.com',
  grade: '1º Ano',
  teacherId: 'loading' // valor de erro
};

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

const sanitized = sanitizeStudentData(testDataError);
console.log('Teste com valor de erro (loading):');
console.log('Professor ID original:', testDataError.teacherId);
console.log('Professor ID sanitizado:', sanitized.teacherId);
console.log('Validação passa?', !!sanitized.teacherId); // deve ser false

// Testar outros valores de erro
['error', 'no-teachers'].forEach(errorValue => {
  const testData = { ...testDataError, teacherId: errorValue };
  const sanitized = sanitizeStudentData(testData);
  console.log(`\nTeste com ${errorValue}:`);
 console.log('Professor ID sanitizado:', sanitized.teacherId);
  console.log('Validação passa?', !!sanitized.teacherId); // deve ser false
});

// Testar com valor válido
const testDataValid = {
  fullName: 'Test Student',
  email: 'test.student@example.com',
  grade: '1º Ano',
  teacherId: '1' // valor válido
};

const sanitizedValid = sanitizeStudentData(testDataValid);
console.log('\nTeste com valor válido:');
console.log('Professor ID original:', testDataValid.teacherId);
console.log('Professor ID sanitizado:', sanitizedValid.teacherId);
console.log('Validação passa?', !!sanitizedValid.teacherId); // deve ser true
