-- Teste de inserção direta no banco de dados
-- Primeiro, vamos inserir um usuário
INSERT INTO users (email, password) VALUES ('test.direct@email.com', 'senha123');

-- Pegar o ID do usuário recém-criado
SET @last_user_id = LAST_INSERT_ID();

-- Inserir o perfil
INSERT INTO profiles (user_id, full_name) VALUES (@last_user_id, 'Teste Direto');

-- Atribuir o papel de professor
INSERT INTO user_roles (user_id, role) VALUES (@last_user_id, 'teacher');

-- Verificar se os dados foram inseridos
SELECT 
    u.id,
    u.email,
    p.full_name,
    ur.role
FROM users u
JOIN profiles p ON u.id = p.user_id
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test.direct@email.com';
