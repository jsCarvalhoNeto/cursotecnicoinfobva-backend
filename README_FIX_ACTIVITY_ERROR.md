# Fix para Erro 500 no Envio de Atividades do Aluno

## Problema

Ao tentar enviar uma atividade no módulo aluno, ocorre o seguinte erro:

```
cursotecnicoinfobva-backend-production.up.railway.app//api/activities/student-activities:1 Failed to load resource: the server responded with a status of 500 ()
StudentActivitiesTab.tsx:219 Error submitting activity: Error: Erro ao enviar atividade
```

## Causa Raiz

O problema está na tabela `activity_grades` no banco de dados do Railway. A tabela não tem a estrutura atualizada com as últimas migrações aplicadas, especificamente:

1. **Migration 006**: `add_submission_fields_to_activity_grades.sql`
2. **Migration 007**: `update_activity_grades_nullable_fields.sql`

A estrutura antiga da tabela tem:
- `grade` como NOT NULL
- `graded_by` como NOT NULL
- Ausência das colunas: `student_name`, `team_members`, `file_path`, `file_name`

## Solução

### Passo 1: Aplicar as migrações no banco de dados do Railway

Execute o script SQL contido em `apply_fix_for_activity_grades.sql` diretamente no banco de dados do Railway via o painel de administração do MySQL.

### Passo 2: Comandos SQL para aplicar manualmente

Se preferir aplicar manualmente, execute estas queries no banco de dados:

```sql
-- Adicionar colunas de submissão (se ainda não existirem)
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `student_name` VARCHAR(255) NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `team_members` TEXT NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_path` VARCHAR(500) NULL;
ALTER TABLE `activity_grades` ADD COLUMN IF NOT EXISTS `file_name` VARCHAR(255) NULL;

-- Tornar campos nullable (CORREÇÃO PRINCIPAL)
ALTER TABLE `activity_grades` MODIFY COLUMN `grade` DECIMAL(5, 2) NULL;
ALTER TABLE `activity_grades` MODIFY COLUMN `graded_by` INT NULL;
```

### Passo 3: Verificar a estrutura final

Após aplicar as correções, a tabela `activity_grades` deve ter esta estrutura:

```sql
CREATE TABLE `activity_grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_id` INT NOT NULL,
  `enrollment_id` INT NOT NULL,
  `grade` DECIMAL(5, 2) NULL,          -- Agora é NULLABLE
  `graded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `graded_by` INT NULL,               -- Agora é NULLABLE
  `student_name` VARCHAR(255) NULL,   -- Nova coluna
 `team_members` TEXT NULL,           -- Nova coluna
  `file_path` VARCHAR(500) NULL,      -- Nova coluna
  `file_name` VARCHAR(255) NULL,      -- Nova coluna
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
 FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_activity_student` (`activity_id`, `enrollment_id`),
  INDEX `idx_activity_grades_activity_id` (`activity_id`),
  INDEX `idx_activity_grades_enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Verificação

Após aplicar as correções:

1. O envio de atividades no módulo aluno deve funcionar corretamente
2. O erro 500 deve ser resolvido
3. As submissões de atividades devem ser salvas com sucesso no banco de dados

## Importante

- Esta correção deve ser aplicada no ambiente de produção (Railway)
- O código do backend foi atualizado para ser compatível com diferentes estruturas de banco de dados
- A função `submitStudentActivity` agora verifica a estrutura da tabela antes da inserção
- O endpoint `/api/activities/diagnostic` foi adicionado para verificar a estrutura da tabela
- Apenas a estrutura do banco de dados precisa ser atualizada para resolver completamente o problema

## Migrações relacionadas

- `004_create_activity_grades_table.sql` - Criação da tabela base
- `006_add_submission_fields_to_activity_grades.sql` - Adiciona campos de submissão
- `007_update_activity_grades_nullable_fields.sql` - Torna campos nullable
