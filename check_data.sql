-- Verificar se o professor foi salvo corretamente no banco de dados
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    ur.role
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'prof.teste@email.com'
ORDER BY u.created_at DESC;
