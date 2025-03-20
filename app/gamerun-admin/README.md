# Módulo GameRun Admin

Este módulo permite a administração de games (jogos) e equipes participantes no Sistema Coringas.

## Funcionalidades

- Visualização de games em cards com status e informações básicas
- Criação de novos games
- Edição de games existentes
- Ativação de games
- Visualização de equipes inscritas em um game
- Aprovação de equipes inscritas

## Estrutura de Arquivos

```
sistema-coringas/app/gamerun-admin/
├── components/
│   ├── AlertaPersonalizado.tsx  # Componente para exibir alertas
│   ├── GameCard.tsx             # Card para exibir um game na lista
│   └── ModalGame.tsx            # Modal para criar/editar/visualizar um game
├── layout.tsx                   # Layout da página (usa o AppLayout)
├── page.tsx                     # Página principal do módulo
└── README.md                    # Esta documentação
```

## Requisitos

Antes de usar este módulo, é necessário configurar as tabelas no banco de dados Supabase. Veja as instruções em `doc/gamerun_tables_setup.md` e execute o script em `scripts/create_gamerun_tables.sql`.

## Modelos de Dados

### Game
```typescript
interface Game {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  imagem_url: string | null;
  status: string; // pendente, ativo, inativo, encerrado
}
```

### Equipe
```typescript
interface Equipe {
  id: string;
  nome: string;
  status: string; // pendente, ativa, rejeitada
  lider_id: string;
  lider_nome?: string;
}
```

## Fluxo de Uso

1. Usuário administrador acessa o módulo através do menu lateral "GameRun Admin"
2. Na página principal, o administrador visualiza os games existentes ou cria um novo
3. Para criar um novo game, o administrador clica no botão "Novo Game" e preenche o formulário
4. Para visualizar detalhes de um game, o administrador clica no botão "Detalhes" do card
5. No modal de detalhes, o administrador pode:
   - Editar informações do game (clicando no ícone de edição)
   - Visualizar equipes inscritas
   - Aprovar equipes pendentes
6. Para ativar um game, o administrador clica no botão "Ativar" no card do game (disponível apenas para games pendentes)

## Controle de Acesso

Este módulo é acessível apenas para usuários administradores (is_admin=true). O middleware do Next.js verifica esta permissão e redireciona usuários não autorizados.

## Próximos Passos de Desenvolvimento

- Implementar a funcionalidade de inscrição de equipes para usuários comuns
- Adicionar estatísticas e métricas para administradores
- Implementar a funcionalidade de resultados e rankings de equipes
- Criar tela de visualização de games para usuários finais 