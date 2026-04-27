# ADR 0000 - Template para Architecture Decision Records

## Status

Proposto | Aceito | Rejeitado | Substituido por ADR XXXX | Substitui ADR YYYY

## Contexto

Descreva o contexto e o problema que motiva esta decisao. Inclua forcas relevantes, restricoes, requisitos de negocio e tecnicos. Quem e impactado.

## Decisao

Descreva a decisao tomada de forma clara e objetiva. Use voz ativa: "Adotaremos X", "Substituiremos Y por Z", "Adiaremos W para depois de V".

## Alternativas consideradas

Liste as alternativas avaliadas e por que foram descartadas. Sem isso, leitores futuros nao conseguem entender por que esta opcao foi escolhida.

- Alternativa A: descricao breve. Descartada porque [razao].
- Alternativa B: descricao breve. Descartada porque [razao].

## Consequencias

### Positivas
- Beneficios concretos esperados
- O que fica mais facil/rapido/seguro

### Negativas
- Custos, debts, restricoes que esta decisao impoe
- O que fica mais dificil ou caro

### Neutras
- Mudancas que nao sao boas nem ruins, mas precisam ser sabidas

## Implementacao

Apontamento de onde esta decisao se materializa (arquivos, modulos, specs). Se houver migracao envolvida, descreva a estrategia.

## Referencias

- Links para PRD, specs, issues, RFCs, papers, blog posts ou normas regulatorias relevantes.

---

**Convencoes:**
- Numeracao: 4 digitos com zeros a esquerda (`0001`, `0002`, ...)
- Slug em kebab-case no titulo (ex.: `0001-provider-pattern-para-integracoes-externas.md`)
- Status muda no topo quando o ADR e revisado
- ADRs sao imutaveis apos aceitos: para mudar, criar um novo que substitua o anterior (registrar em "Substituido por")
