# Módulo GameRun para Usuários

Este módulo permite que usuários comuns visualizem e participem dos games (jogos) disponíveis no Sistema Coringas.

## Funcionalidades

- Visualização de games ativos em cards
- Detalhes completos de cada game
- Criação e gerenciamento de equipes
- Inscrição em games
- Participação como integrante de equipe

## Estrutura de Arquivos

```
sistema-coringas/app/gamerun/
├── [id]/               # Página de detalhes de um game específico
├── equipe/             # Funcionalidades relacionadas a equipes
│   ├── [id]/           # Detalhes e gerenciamento de uma equipe específica
│   ├── [id]/convidar   # Convite de integrantes para equipe
│   └── [id]/editar     # Edição de informações da equipe
├── layout.tsx          # Layout compartilhado do módulo
├── page.tsx            # Página principal com listagem de games
└── README.md           # Esta documentação
```

## Fluxo de Uso

1. **Listagem de Games**:
   - Usuário acessa a página principal do GameRun
   - Visualiza cards de todos os games ativos

2. **Detalhes do Game**:
   - Usuário clica em "Ver Detalhes" em um game
   - Visualiza informações completas, incluindo descrição e requisitos
   - Pode criar uma equipe ou visualizar sua equipe atual

3. **Criação e Gestão de Equipe**:
   - Usuário cria equipe e se torna o líder
   - Líder pode convidar outros integrantes
   - Líder pode editar informações da equipe
   - Equipe aguarda aprovação do administrador

4. **Participação como Integrante**:
   - Usuário recebe convite para participar de equipe
   - Ao aceitar, passa a integrar a equipe
   - Pode visualizar detalhes da equipe e outros membros

## Regras de Negócio

- Apenas games com status "ativo" são exibidos na listagem principal
- Equipes criadas ficam com status "pendente" até aprovação do administrador
- Cada usuário só pode participar de uma equipe por game
- O número de integrantes é limitado conforme definido em cada game
- Apenas o líder pode gerenciar a equipe (editar, convidar, etc.)

## Integração com Outros Módulos

- **GameRun Admin**: Administração dos games e aprovação de equipes
- **Perfil de Usuário**: Informações dos integrantes das equipes

## Estados das Entidades

**Status de Game**:
- Pendente: Criado mas ainda não liberado
- Ativo: Disponível para inscrições e participação
- Inativo: Temporariamente indisponível
- Encerrado: Finalizado, não aceita mais inscrições

**Status de Equipe**:
- Pendente: Aguardando aprovação do administrador
- Ativa: Aprovada e participando do game
- Rejeitada: Não aprovada pelo administrador

**Status de Integrante**:
- Pendente: Convidado, aguardando aceitação
- Ativo: Participando da equipe
- Inativo: Removido ou saiu da equipe 