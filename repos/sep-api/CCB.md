# CCB - Cedula de Credito Bancario - sep-api

Documento operacional da geracao + retencao da Cedula de Credito Bancario (CCB) no SEP (Sprint 11 — Epic 7 parte 2).

> ⚠️ **REVISAO JURIDICA PENDENTE**: o conteudo do template, a validade pratica das clausulas e a politica de retencao precisam ser revisados pela area juridica antes do go-live. Esta sprint entrega a infraestrutura tecnica; ajustes finos de redacao ficam para a revisao pre-producao.

> Spec: [`011-sprint-11-formalizacao-assinatura-digital.md`](../../specs/fase-2/011-sprint-11-formalizacao-assinatura-digital.md) §11.3 + §11.10.
> Steps: [`011-sprint-11-steps.md`](../../steps-fase-2/backend/011-sprint-11-steps.md) Task 11.3 + 11.10.
> Operacional cruzado: [`CONTRATOS.md`](./CONTRATOS.md) (fluxo completo + audit).
> ADR de provedor: [`adr/0013-provedor-de-assinatura-digital.md`](../../adr/0013-provedor-de-assinatura-digital.md).

## O que e a CCB

A **Cedula de Credito Bancario** eh um titulo executivo extrajudicial regulamentado pela **Lei 10.931/2004**. Representa promessa de pagamento em dinheiro decorrente de operacao de credito de qualquer modalidade. Eh o instrumento legal padrao usado por instituicoes financeiras para emprestimos comerciais e PJ no Brasil.

Caracteristicas:
- **Titulo executivo**: dispensa fase de conhecimento na cobranca judicial — execucao direta (Art. 28 da Lei 10.931).
- **Integridade do binario**: alteracao do PDF pos-assinatura invalida o titulo. Hash SHA-256 local + selo do provider sao prova forense.
- **Assinatura eletronica avancada**: aceita por **Lei 14.063/2020** para CCB — ICP-Brasil eh opcional (configuravel por property no provider).

## Geracao no SEP

### Quando

`EnviarParaAssinaturaUseCase` (Sprint 11 Task 11.5) gera o PDF da CCB **uma vez por versao do contrato**, no momento do envio para o provider de assinatura. Disparo automatico apos `ContratoAceitoEvent` via `ContratoAceitoListener`; disparo manual via `POST /api/v1/contratos/{id}/assinar` (idempotente — envelope ja existente eh devolvido).

### Como

`CcbGenerator` (`contratos.application.service.ccb`) usa **Apache PDFBox 3.0.x** para gerar PDF estruturado a partir de `CcbTemplate` (objeto de transferencia construido com dados do contrato + versao vigente + proposta).

```java
CcbTemplate template = CcbTemplate.de(contrato, versao, proposta, OffsetDateTime.now());
byte[] pdfBytes = ccbGenerator.gerar(template);
String hash = hashService.calcular(pdfBytes);   // SHA-256 hex lowercase, 64 chars
```

PDF gerado eh:
- **Texto pesquisavel** (nao imagem; PDFBox usa font Helvetica + ContentStream).
- **Deterministico** (metadata zerada: `documentId=0L`, `CreationDate`/`ModDate` em epoch). Mesmo input -> mesmo binario -> mesmo hash. Permite reproducao e auditoria.

### Estrutura do PDF (template atual)

Conteudo gerado pelo `CcbTemplate`/`CcbGenerator`:

1. **Cabecalho**
   - Titulo: `CEDULA DE CREDITO BANCARIO`
   - Numero da CCB: `<contratoId>-v<numeroVersao>` (rastreavel)
   - Data de emissao: `<dataGeracao>` (formato pt-BR)

2. **Identificacao das partes**
   - Emitente (tomador): `<tomadorId>` + `<email>` (placeholder enquanto onboarding nao expor nome/CPF/endereco — ver §Limitacoes).
   - Favorecida: SEP (entidade operadora; razao social/CNPJ entrarao em sprint de configuracao da empresa).

3. **Operacao financeira**
   - Valor principal: `<valorSolicitado>` formatado em pt-BR (`R$ 10.000,00`).
   - Prazo: `<prazoMeses>` meses.
   - Numero de parcelas: igual ao prazo nesta versao (calculo financeiro definitivo em Sprint 12).

4. **Encargos** (placeholders nesta sprint — calculo real em Sprint 12 Cobranca)
   - Taxa de juros mensal: ainda nao consolidada.
   - IOF: ainda nao consolidado.
   - CET (Custo Efetivo Total): ainda nao calculado.

5. **Forma de pagamento**
   - Conta escrow do SEP (descricao operacional; numero da conta entrara em sprint de integracao escrow Celcoin).

6. **Garantias**
   - Sem garantias adicionais nesta versao (texto explicito). Sprint futura amplia.

7. **Foro e clausulas finais**
   - Foro: comarca de Sao Paulo, SP (default; revisao juridica pode ajustar).
   - Lei aplicavel: Lei 10.931/2004 + Lei 14.063/2020 + CMN 4.656/2018.

8. **Area de assinatura**
   - Espaco reservado para o selo do provider (preenchido apos `ASSINADO`).

### Hash + Integridade

Dois hashes vivem no banco:

| Hash                                | Calculo                                 | Quando                              | Onde                              |
| ----------------------------------- | --------------------------------------- | ----------------------------------- | --------------------------------- |
| `envelope_assinatura.hash_pdf_enviado` | SHA-256 do PDF gerado pelo SEP       | Antes do envio ao provider          | Audit `CCB_GERADA` + `ASSINATURA_ENVIADA` |
| `documento_assinado.hash_sha256`    | SHA-256 do PDF retornado pelo provider  | Apos callback `ASSINADO`            | Audit `ASSINATURA_ASSINADA` + header `X-Document-Hash-Sha256` |

Ambos validados por `HashValidator` (regex `^[a-f0-9]{64}$`). Header `X-Document-Hash-Sha256` no download permite ao cliente conferir integridade local sem depender do selo do provider.

### Storage do PDF assinado

Port `DocumentoAssinadoStorage` (`contratos.application.port.out`):

```java
String salvar(byte[] conteudo);                 // retorna pathStorage opaco
Optional<byte[]> carregar(String pathStorage);  // null se purgado/inexistente
void deletar(String pathStorage);
```

Impl atual `InlineDocumentoAssinadoStorage` (`contratos.infrastructure.adapter.storage`): persiste em tabela `documento_assinado_blob` (BYTEA isolada do agregado `DocumentoAssinado` por questao de performance — entidade principal carrega apenas metadados).

**Epic 16 troca por adapter S3/MinIO** sem alterar `DocumentoAssinado` nem `BaixarDocumentoAssinadoUseCase`. Port -> adapter pattern (ADR 0004) garante substituicao sem refactor de dominio.

Compensacao de orphan: se `DocumentoAssinado.criar` falhar apos `storage.salvar`, o use case faz `storage.deletar(pathStorage)` no `finally`. Falha do delete eh logada como warn — job de reconciliacao identifica blobs orfaos (sprint futura).

## Base legal

- **Lei 10.931/2004** — define a CCB como titulo executivo extrajudicial.
- **Lei 14.063/2020** — admite assinatura eletronica avancada para CCB sem exigir ICP-Brasil obrigatoria; provider escolhido (Clicksign — ADR 0013) suporta ambos os formatos.
- **Resolucao CMN 4.656/2018** — disciplina SEPs e exige trilha auditavel reforcada das operacoes financeiras (Art. 11) + retencao de 10 anos.
- **LGPD (Lei 13.709/2018)** — dados pessoais do tomador no PDF + audit log sao minimizados ao necessario; conteudo integral do PDF nao entra em audit (apenas hashes).

## Retencao

**Minimo de 10 anos** para PDF assinado, `EnvelopeAssinatura`, `EventoAssinatura`, `DocumentoAssinado` e audit log relacionado (`CCB_GERADA`, `ASSINATURA_*`, `DOCUMENTO_ASSINADO_BAIXADO`). Justificativa: CMN 4.656/2018 Art. 11 + Lei 10.931/2004 (titulo executivo prescricao) + LGPD (retencao por obrigacao legal).

Politica:
- FKs sem `ON DELETE CASCADE` em todas as tabelas do modulo `contratos` (V20 + V23) — protege contra remocao indevida.
- Exclusao logica NAO eh adotada nesta fase. Purga de blobs (LGPD direito ao esquecimento apos prescricao) ficara em sprint futura de governance.
- Backup: politica geral do banco aplica; PDF assinado em BYTEA fica replicado nos backups RDS.

## Limitacoes conhecidas (revisao juridica)

1. **Dados cadastrais do tomador incompletos**: nome, CPF/CNPJ e endereco ainda nao integram o template — placeholders UUID + email do `usuario.username`. Bloqueio: modulo `onboarding` (Epic 5) ainda nao expoe estes campos via port. Quando exposto, basta passar no `CcbTemplate.de(...)` e ajustar o gerador. **Sprint 11 nao recomenda go-live ao publico final sem este ajuste**.

2. **Razao social/CNPJ da SEP nao parametrizados**: identificacao da entidade favorecida no PDF eh texto literal `SEP`. Property dedicada (`app.contratos.entidade.razao-social`, `cnpj`) ficara em sprint de configuracao da empresa.

3. **Encargos placeholder**: taxa de juros mensal, IOF e CET nao sao calculados — Sprint 12 (Cobranca) define o motor financeiro. CCB emitida sem esses valores nao tem validade pratica como titulo executivo perfeito.

4. **Sem garantias adicionais**: aval, fianca, hipoteca, alienacao fiduciaria nao entram nesta versao. Sprint futura amplia template + entidades de garantia.

5. **Foro fixo em SP**: hardcoded no template. Configuravel via property eh follow-up.

6. **Assinatura eletronica simples por padrao**: Clicksign emite assinatura eletronica avancada (sem ICP-Brasil). Property `app.assinatura.clicksign.exigir-icp-brasil=true` (a ser exposta) habilita ICP-Brasil quando jurıdico decidir.

7. **Sem renegociacao/aditivos**: contrato `ASSINADO` eh final. Aditivos contratuais (mudanca de prazo, valor, garantia) exigem nova proposta + nova CCB. Sprint futura simplifica.

## Provider de assinatura

Detalhes do Provider Pattern, fluxo de envio/callback, configuracao Clicksign e retencao tecnica do envelope vivem em [`CONTRATOS.md`](./CONTRATOS.md) §Sprint 11. Provedor escolhido: **Clicksign** ([ADR 0013](../../adr/0013-provedor-de-assinatura-digital.md)).

## Pontos pendentes para a area juridica

Antes do go-live, area juridica deve revisar e aprovar:

- [ ] Texto literal do template `mutuo.txt`/`ccb.txt` em `templates/contratos/`.
- [ ] Clausulas padrao em `clausulas-padrao.txt` (6 clausulas: OBJETO, VALOR/PRAZO, PAGAMENTO, JUROS, INADIMPLEMENTO, FORO).
- [ ] Politica de retencao do PDF assinado (10 anos minimo; purga apos prescricao judicial).
- [ ] Decisao sobre ICP-Brasil obrigatoria vs eletronica avancada — impacta custo + UX (presencial vs remoto).
- [ ] Dados minimos do tomador para validade do titulo (nome completo, CPF/CNPJ, endereco — vir do modulo onboarding antes do go-live).
- [ ] Razao social + CNPJ + endereco da SEP no template.
- [ ] Modelo de calculo financeiro a ser preenchido pela Sprint 12 (taxa nominal vs efetiva, IOF, CET).
- [ ] Foro padrao (comarca SP eh adequado para a maioria das operacoes?) e clausula de eleicao de foro.
- [ ] Tratamento de garantias quando entrarem (template + entidades).

## Referencias

- Lei 10.931/2004 — Cedula de Credito Bancario.
- Lei 14.063/2020 — Assinatura eletronica em atos publicos e privados.
- Resolucao CMN 4.656/2018 — SEPs (Sociedades de Emprestimo entre Pessoas).
- LGPD (Lei 13.709/2018) — protecao de dados pessoais.
- [Apache PDFBox 3.0.x](https://pdfbox.apache.org/).
- [Clicksign API](https://developers.clicksign.com/).
- [`adr/0013-provedor-de-assinatura-digital.md`](../../adr/0013-provedor-de-assinatura-digital.md).
