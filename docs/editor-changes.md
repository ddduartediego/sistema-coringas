# Mudança no Editor de Texto

## Resumo

Em [DATA], o editor rich text (WYSIWYG) TinyMCE foi removido da aplicação e substituído pelo componente nativo textarea do HTML. Esta mudança foi implementada para simplificar a interface do usuário e reduzir as dependências externas do projeto.

## Detalhes da Mudança

### Componentes Afetados

- Removido: `app/admin/games/[id]/quests/_components/RichTextEditor.tsx`
- Modificado: `app/admin/games/[id]/quests/_components/QuestsAdminClient.tsx`
- Removido do package.json: dependência `@tinymce/tinymce-react`

### Motivação

A decisão de remover o editor rich text foi tomada com base nos seguintes fatores:
- Simplificação da interface de usuário
- Redução de dependências externas
- Diminuição do tamanho total do pacote
- Minimização de potenciais problemas de segurança ou compatibilidade

### Impacto nos Dados

Os dados existentes não foram afetados por esta mudança. Texto formatado anteriormente com o editor rich text será exibido como HTML puro no textarea, mas isso não afeta a funcionalidade do sistema.

## Como Usar o Novo Editor

O novo editor é um simples campo de texto (textarea) que suporta entrada de texto básica. Para adicionar uma descrição a uma quest:

1. Abra o formulário de criação/edição de quest
2. Digite o texto no campo de descrição
3. Não há mais opções de formatação de texto enriquecido

## Considerações Futuras

Se houver necessidade de formatação de texto mais avançada no futuro, considere:
- Implementar suporte a Markdown simples
- Adicionar um editor customizado mais leve
- Utilizar alguma biblioteca menor e mais específica para formatação 