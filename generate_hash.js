import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Senha original:', password);
  console.log('Senha criptografada:', hashedPassword);
}

generateHash();
