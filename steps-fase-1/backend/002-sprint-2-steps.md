# Steps - Sprint 2 - Gestao de Usuarios

**Spec de origem**: [`specs/fase-1/002-sprint-2-gestao-usuarios.md`](../../specs/fase-1/002-sprint-2-gestao-usuarios.md)

**Objetivo geral**: entregar a base de dominio do modulo `usuarios` da API SEP. Ao final, o backend persiste a entidade `Usuario` (extendendo `EntidadeAuditavel` da Sprint 1), expoe `POST /api/v1/usuarios` publico (criacao de `ADMIN` e `CLIENTE`) com validacao Bean Validation, hash BCrypt e mapeamento via MapStruct, sem expor a senha em respostas.

**Esforco total estimado**: 2-3 dias de Dev Senior dedicado, com paralelismo possivel apos o esqueleto da Task 2.1 (Tasks 2.1 e 2.2 podem rodar em paralelo).

**Workspace root**: `<sep-api-root>/`.

## Erratum: migration V3

A spec 002 Task 2.1 lista a criacao de `V3__criar_tabela_usuario.sql`. **Esta sprint nao cria V3** — a tabela `usuario` ja foi entregue completa pela `V1__init.sql` da Sprint 1 Task 1.4 (id `uuid` nativo, `username` unico, check de role `ADMIN`/`CLIENTE`, 4 colunas de auditoria). Os steps abaixo apenas materializam a entidade JPA sobre o schema existente. A spec sera ajustada para refletir esta absorcao em revisao posterior.

## Ordem de execucao recomendada

```
Task 2.1 (entidade Usuario + Role + repo + teste)
   |
   +---> Task 2.2 (DTOs records + UsuarioMapper MapStruct + teste)
   |       |
   +-------+--> Task 2.3a (CriarUsuarioUseCase + UsernameJaExisteException + PasswordEncoder bean + teste)
                  |
                  v
              Task 2.3b (UsuarioController + SecurityConfig permitAll + teste)
```

- Task 2.1 e raiz.
- Task 2.2 pode comecar em paralelo apos Task 2.1 ter o esqueleto da entidade compilando.
- Task 2.3a depende de 2.1 + 2.2.
- Task 2.3b fecha a sprint.

## Como usar este arquivo

1. Leia a Task que vai executar
2. Execute step a step na ordem
3. Em cada step, rode a verificacao antes de seguir
4. Ao final da Task, valide com a "Definicao de pronto" da task
5. Comite com a mensagem sugerida (Conventional Commits)
6. Marque a task como concluida no checklist final

## Pre-requisitos globais

- Sprint 1 concluida e fechada ([`steps-fase-1/backend/001-sprint-1-steps.md`](./001-sprint-1-steps.md))
- `EntidadeAuditavel`, `AuditorAwareImpl` e `JpaAuditingConfig` operacionais (Sprint 1.6)
- `ApiExceptionHandler` stub + `DomainException` sealed + 3 subtypes (`ValidacaoException`, `RecursoNaoEncontradoException`, `ConflitoException`) operacionais (Sprint 1.5)
- `SecurityConfig` esqueleto presente em `identity/infrastructure/config/` (Sprint 1.3)
- Migrations V1 + V2 aplicadas com `flyway_schema_history` populado (Sprint 1.4 + 1.8)
- Postgres 16-alpine rodando em Docker Compose (Sprint 1.2)
- `ddl-auto: validate` ativo em `application.yml` — Hibernate apenas valida o schema gerenciado pelo Flyway
- `build.gradle` ja declara MapStruct 1.6.3 + annotation processor + `java-uuid-generator` 5.1.0 (Sprint 1.1b)
- Branch nascida de `develop` sincronizada:
  ```bash
  cd <sep-api-root>
  git checkout develop
  git pull --ff-only
  git checkout -b feature/sprint-2-gestao-usuarios
  ```

---

## Task 2.1 — Entidade `Usuario` + `Role` + `UsuarioRepository`

**Objetivo**: materializar a entidade JPA `Usuario` sobre o schema ja existente, com geracao de UUID v6 na aplicacao e auditoria automatica via heranca de `EntidadeAuditavel`.

**Pre-requisito**: Sprint 1 fechada.

**Esforco**: 3-4 horas.

### Step 2.1.1 — Criar enum `Role`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/domain/model/Role.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.domain.model;

/**
 * Perfis suportados na Sprint 2: {@code ADMIN} (operadores) e {@code CLIENTE}
 * (tomadores e investidores). Sprints futuras (PLD/onboarding) podem
 * introduzir novos perfis; quando isso acontecer, avaliar migrar para
 * {@code sealed type} conforme follow-up registrado na Spec 002.
 */
public enum Role {
    ADMIN,
    CLIENTE
}
```

**Verificacao**:
```bash
cd <sep-api-root>
./gradlew compileJava
# Esperado: BUILD SUCCESSFUL
```

### Step 2.1.2 — Criar entidade `Usuario`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/domain/model/Usuario.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.domain.model;

import com.dynamis.sep_api.shared.audit.EntidadeAuditavel;
import com.fasterxml.uuid.Generators;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Usuario do sistema SEP. Schema entregue pela migration V1 (Sprint 1.4);
 * esta entidade JPA materializa o mapeamento conforme PRD §16.
 *
 * <p>Estende {@link EntidadeAuditavel} herdando os 4 campos de auditoria
 * sem reconfiguracao adicional. UUID v6 gerado na aplicacao via
 * {@code java-uuid-generator} (PRD §11).
 *
 * <p>Senha persistida como hash BCrypt a partir da Task 2.3a — em texto claro
 * jamais. Constructor protected reservado ao Hibernate; instancias novas sao
 * criadas via {@link #criar(String, String, Role)}.
 */
@Entity
@Table(name = "usuario")
public class Usuario extends EntidadeAuditavel {

    @Id
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "username", nullable = false, unique = true, length = 255)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 40)
    private Role role;

    protected Usuario() {
        // requerido pelo Hibernate
    }

    private Usuario(UUID id, String username, String password, Role role) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    /**
     * Cria um novo {@link Usuario} com UUID v6 gerado na aplicacao. A senha
     * deve chegar ja hashada (BCrypt) — esta classe nao conhece nem armazena
     * o segredo em texto claro.
     */
    public static Usuario criar(String username, String passwordHash, Role role) {
        UUID id = Generators.timeBasedReorderedGenerator().generate();
        return new Usuario(id, username, passwordHash, role);
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }
}
```

**Verificacao**:
```bash
./gradlew compileJava
# Esperado: BUILD SUCCESSFUL
```

### Step 2.1.3 — Criar `UsuarioRepository`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/infrastructure/persistence/UsuarioRepository.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.infrastructure.persistence;

import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio Spring Data para {@link Usuario}. Sprint 2 expoe apenas o
 * minimo necessario para criacao com checagem de duplicidade; Sprint 3
 * acrescenta queries de login e listagem restrita a ADMIN.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);
}
```

### Step 2.1.4 — Criar `UsuarioRepositoryTest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/infrastructure/persistence/UsuarioRepositoryTest.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.dynamis.sep_api.shared.audit.AuditorAwareImpl;
import com.dynamis.sep_api.shared.audit.JpaAuditingConfig;
import com.dynamis.sep_api.usuarios.domain.model.Role;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Slice JPA do {@link UsuarioRepository} contra Postgres real via
 * Testcontainers (PRD §11 veta H2). Importa {@link JpaAuditingConfig} +
 * {@link AuditorAwareImpl} para validar que os 4 campos de auditoria
 * herdados de {@code EntidadeAuditavel} sao preenchidos com fallback
 * {@code "system"}.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditingConfig.class, AuditorAwareImpl.class})
@ActiveProfiles("test")
@Testcontainers
class UsuarioRepositoryTest {

    @Container
    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("sep_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UsuarioRepository repository;

    @Test
    void persistirERecuperarUsuarioPreservaCampos() {
        Usuario novo = Usuario.criar("admin@sep.test", "hash-bcrypt-fake", Role.ADMIN);

        Usuario salvo = repository.saveAndFlush(novo);
        Usuario recarregado = repository.findById(salvo.getId()).orElseThrow();

        assertThat(recarregado.getUsername()).isEqualTo("admin@sep.test");
        assertThat(recarregado.getRole()).isEqualTo(Role.ADMIN);
        assertThat(recarregado.getPassword()).isEqualTo("hash-bcrypt-fake");
    }

    @Test
    void findByUsernameRetornaOptionalPopuladoQuandoUsuarioExiste() {
        repository.saveAndFlush(
            Usuario.criar("cliente@sep.test", "hash", Role.CLIENTE));

        assertThat(repository.findByUsername("cliente@sep.test")).isPresent();
        assertThat(repository.findByUsername("nao@existe.test")).isEmpty();
    }

    @Test
    void existsByUsernameRetornaTrueParaExistenteEFalseParaInexistente() {
        repository.saveAndFlush(
            Usuario.criar("admin@sep.test", "hash", Role.ADMIN));

        assertThat(repository.existsByUsername("admin@sep.test")).isTrue();
        assertThat(repository.existsByUsername("outro@sep.test")).isFalse();
    }

    @Test
    void auditoriaPreenchidaAutomaticamenteComFallbackSystem() {
        Usuario salvo = repository.saveAndFlush(
            Usuario.criar("admin@sep.test", "hash", Role.ADMIN));

        assertThat(salvo.getDataCriacao()).isNotNull();
        assertThat(salvo.getDataModificacao()).isNotNull();
        assertThat(salvo.getCriadoPor()).isEqualTo(AuditorAwareImpl.SYSTEM);
        assertThat(salvo.getModificadoPor()).isEqualTo(AuditorAwareImpl.SYSTEM);
    }
}
```

### Step 2.1.5 — Rodar o teste

**Comando**:
```bash
cd <sep-api-root>
./gradlew test --tests "*UsuarioRepositoryTest"
```

**Esperado**: 4 testes passando, container Postgres do Testcontainers iniciando, Flyway aplicando V1 + V2 antes dos testes.

### Definicao de pronto da Task 2.1
- [ ] `Role` enum criado com `ADMIN` e `CLIENTE`
- [ ] `Usuario` mapeado com `@Entity @Table(name="usuario")`, estende `EntidadeAuditavel`, factory `criar(...)` gera UUID v6
- [ ] `UsuarioRepository` expoe `findByUsername`, `existsByUsername` e CRUD herdado
- [ ] `UsuarioRepositoryTest` passa com 4 cenarios em Postgres real (Testcontainers)
- [ ] Audit fields populados com `system` automaticamente
- [ ] `./gradlew compileJava` sem erros

### Commit Task 2.1
```bash
cd <sep-api-root>
git add src/main/java/com/dynamis/sep_api/usuarios/domain/model/ \
        src/main/java/com/dynamis/sep_api/usuarios/infrastructure/persistence/ \
        src/test/java/com/dynamis/sep_api/usuarios/infrastructure/persistence/
git commit -m "feat(backend): entidade Usuario + UsuarioRepository extendendo EntidadeAuditavel"
```

---

## Task 2.2 — DTOs (records) e `UsuarioMapper` via MapStruct

**Objetivo**: declarar contratos de entrada e saida da API como `record` Java 21, configurar o `UsuarioMapper` via MapStruct e garantir que a senha jamais aparece em respostas.

**Pre-requisito**: Task 2.1 com esqueleto da entidade compilando (pode rodar em paralelo com 2.1).

**Esforco**: 2-3 horas.

### Step 2.2.1 — Criar `UsuarioCreateDto`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioCreateDto.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.dto;

import com.dynamis.sep_api.usuarios.domain.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para criacao de usuario via {@code POST /api/v1/usuarios}.
 *
 * <p>Validacao via Jakarta Bean Validation conforme spec 002:
 * <ul>
 *   <li>{@code username} obrigatorio e no formato e-mail</li>
 *   <li>{@code password} obrigatoria e exatamente 6 caracteres (PRD §22)</li>
 *   <li>{@code role} obrigatoria e restrita ao enum {@link Role} (binding
 *       direto recusa valores fora de {@code ADMIN}/{@code CLIENTE} via
 *       {@code HttpMessageNotReadableException} → 400 pelo {@code ApiExceptionHandler})</li>
 * </ul>
 */
public record UsuarioCreateDto(
    @NotBlank @Email String username,
    @NotBlank @Size(min = 6, max = 6) String password,
    @NotNull Role role
) {}
```

### Step 2.2.2 — Criar `UsuarioResponseDto`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioResponseDto.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.dto;

import com.dynamis.sep_api.usuarios.domain.model.Role;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO de resposta para operacoes sobre {@code Usuario}.
 *
 * <p>Garantia da spec 002: este record NAO declara campo {@code password}.
 * Como records expoem apenas seus componentes, nao ha como vazar a senha
 * em serializacao Jackson, mesmo que o mapper retorne acidentalmente um
 * objeto com hash. Datas em ISO-8601 com offset (config Jackson global da
 * Sprint 1.1c).
 */
public record UsuarioResponseDto(
    UUID id,
    String username,
    Role role,
    OffsetDateTime dataCriacao,
    OffsetDateTime dataModificacao,
    String criadoPor,
    String modificadoPor
) {}
```

### Step 2.2.3 — Criar `UsuarioSenhaUpdateDto`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/dto/UsuarioSenhaUpdateDto.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para alteracao da propria senha autenticada. Declarado nesta sprint
 * para fechar a familia de contratos do modulo, mas o use case que o
 * consome chega na Sprint 3 (rota autenticada).
 */
public record UsuarioSenhaUpdateDto(
    @NotBlank String passwordAtual,
    @NotBlank @Size(min = 6, max = 6) String novaSenha
) {}
```

### Step 2.2.4 — Criar `UsuarioMapper`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/mapper/UsuarioMapper.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.mapper;

import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioCreateDto;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioResponseDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapeamento {@code Usuario} ↔ DTOs via MapStruct (ADR 0006). O annotation
 * processor gera {@code UsuarioMapperImpl} em
 * {@code build/generated/sources/annotationProcessor/}.
 *
 * <p>Regras:
 * <ul>
 *   <li>{@link #toEntity(UsuarioCreateDto)} ignora {@code id}, {@code password}
 *       e os 4 campos de auditoria — {@code id} e gerado pela factory da
 *       entidade, {@code password} e setada apos hash no use case e auditoria
 *       e preenchida pelo JPA Auditing.</li>
 *   <li>{@link #toResponse(Usuario)} produz um record sem campo
 *       {@code password} — nao ha como expor a senha.</li>
 * </ul>
 */
@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "dataCriacao", ignore = true)
    @Mapping(target = "dataModificacao", ignore = true)
    @Mapping(target = "criadoPor", ignore = true)
    @Mapping(target = "modificadoPor", ignore = true)
    Usuario toEntity(UsuarioCreateDto dto);

    UsuarioResponseDto toResponse(Usuario entity);
}
```

> Observacao: o use case prefere usar a factory `Usuario.criar(...)` em vez de `mapper.toEntity` para garantir UUID v6 e atribuir o hash BCrypt no construtor da entidade. O `toEntity` fica disponivel para futuros fluxos administrativos. O step 2.3a usa a factory.

### Step 2.2.5 — Criar `UsuarioMapperTest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/web/mapper/UsuarioMapperTest.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.dynamis.sep_api.usuarios.domain.model.Role;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioResponseDto;
import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * Testa {@link UsuarioMapper} sem subir contexto Spring — usa
 * {@link Mappers#getMapper(Class)} para instanciar o
 * {@code UsuarioMapperImpl} gerado pelo annotation processor.
 *
 * <p>Confirma o invariante critico da spec 002: {@link UsuarioResponseDto}
 * NAO tem campo {@code password}. O record ja garante isso por construcao;
 * o teste falhara em compilacao caso alguem tente reintroduzir o campo.
 */
class UsuarioMapperTest {

    private final UsuarioMapper mapper = Mappers.getMapper(UsuarioMapper.class);

    @Test
    void toResponseMapeiaCamposPublicosSemExporSenha() throws Exception {
        Usuario usuario = Usuario.criar("admin@sep.test", "hash-fake", Role.ADMIN);
        injetarAuditoria(usuario, OffsetDateTime.now(), "system");

        UsuarioResponseDto response = mapper.toResponse(usuario);

        assertThat(response.id()).isEqualTo(usuario.getId());
        assertThat(response.username()).isEqualTo("admin@sep.test");
        assertThat(response.role()).isEqualTo(Role.ADMIN);
        assertThat(response.dataCriacao()).isNotNull();
        assertThat(response.dataModificacao()).isNotNull();
        assertThat(response.criadoPor()).isEqualTo("system");
        assertThat(response.modificadoPor()).isEqualTo("system");

        // Garantia estrutural: o record nao tem campo password
        assertThat(UsuarioResponseDto.class.getRecordComponents())
            .noneMatch(rc -> rc.getName().equals("password"));
    }

    private void injetarAuditoria(Usuario usuario, OffsetDateTime quando, String quem)
            throws Exception {
        for (String nome : new String[] {"dataCriacao", "dataModificacao"}) {
            Field f = usuario.getClass().getSuperclass().getDeclaredField(nome);
            f.setAccessible(true);
            f.set(usuario, quando);
        }
        for (String nome : new String[] {"criadoPor", "modificadoPor"}) {
            Field f = usuario.getClass().getSuperclass().getDeclaredField(nome);
            f.setAccessible(true);
            f.set(usuario, quem);
        }
    }
}
```

### Step 2.2.6 — Verificar geracao do `UsuarioMapperImpl`

**Comando**:
```bash
cd <sep-api-root>
./gradlew compileJava
ls build/generated/sources/annotationProcessor/java/main/com/dynamis/sep_api/usuarios/web/mapper/
# Esperado: UsuarioMapperImpl.java
./gradlew test --tests "*UsuarioMapperTest"
# Esperado: BUILD SUCCESSFUL
```

### Definicao de pronto da Task 2.2
- [ ] `UsuarioCreateDto` record com `@Email`, `@Size(6,6)`, `@NotNull Role`
- [ ] `UsuarioResponseDto` record SEM campo `password`
- [ ] `UsuarioSenhaUpdateDto` record declarado para Sprint 3
- [ ] `UsuarioMapper` com `@Mapper(componentModel = "spring")` e mapeamentos corretos
- [ ] `UsuarioMapperImpl` gerado em `build/generated/sources/annotationProcessor/`
- [ ] `UsuarioMapperTest` passa
- [ ] Datas serializadas em ISO-8601 com offset (config Jackson global)

### Commit Task 2.2
```bash
git add src/main/java/com/dynamis/sep_api/usuarios/web/dto/ \
        src/main/java/com/dynamis/sep_api/usuarios/web/mapper/ \
        src/test/java/com/dynamis/sep_api/usuarios/web/mapper/
git commit -m "feat(backend): records DTO Usuario + UsuarioMapper via MapStruct"
```

---

## Task 2.3a — `CriarUsuarioUseCase` + `UsernameJaExisteException` + `PasswordEncoder` bean

**Objetivo**: implementar o caso de uso transacional que valida unicidade do username, hasha a senha com BCrypt e persiste o `Usuario`. Adiciona o bean `PasswordEncoder` ao `SecurityConfig` existente e abre `ConflitoException` para subtypes por modulo.

**Pre-requisito**: Tasks 2.1 e 2.2 concluidas.

**Esforco**: 3-4 horas.

### Step 2.3a.1 — Tornar `ConflitoException` `non-sealed`

A `ConflitoException` foi declarada `final` na Sprint 1.5 (subtype permitido da `DomainException` sealed). Para permitir que cada modulo crie subtypes especificos (ex.: `UsernameJaExisteException`) sem mexer no `permits` da raiz, tornamos a classe `non-sealed`. O `ApiExceptionHandler` continua mapeando para 409 via `instanceof` no switch da sealed hierarchy.

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/shared/exception/ConflitoException.java`

**Substituir conteudo por**:
```java
package com.dynamis.sep_api.shared.exception;

/**
 * Excecao de dominio para conflitos de estado (HTTP 409). Marcada como
 * {@code non-sealed} para permitir subtypes por modulo (ex.:
 * {@code UsernameJaExisteException} no modulo {@code usuarios}). O
 * {@link ApiExceptionHandler} mapeia qualquer descendente para 409 via
 * switch exhaustivo da sealed hierarchy de {@link DomainException}.
 */
public non-sealed class ConflitoException extends DomainException {
    public ConflitoException(String codigo, String mensagem) {
        super(codigo, mensagem);
    }
}
```

> Ajuste minimo: troca de `final` para `non-sealed`. Sprint 1.9 `ApiExceptionHandlerTest` continua valido pois ainda instancia `ConflitoException` diretamente.

### Step 2.3a.2 — Criar `UsernameJaExisteException`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/exception/UsernameJaExisteException.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.application.exception;

import com.dynamis.sep_api.shared.exception.ConflitoException;

/**
 * Lancada quando a tentativa de criacao de usuario colide com um
 * {@code username} ja registrado. Mapeada para HTTP 409 pelo
 * {@code ApiExceptionHandler} via heranca de {@code ConflitoException}.
 */
public final class UsernameJaExisteException extends ConflitoException {

    private static final String CODIGO = "USR-409-001";

    public UsernameJaExisteException(String username) {
        super(CODIGO, "Ja existe usuario com username " + username);
    }
}
```

### Step 2.3a.3 — Adicionar bean `PasswordEncoder` ao `SecurityConfig`

A Sprint 1.3 criou `SecurityConfig` em `identity/infrastructure/config/`. Adicionamos o `@Bean PasswordEncoder` no mesmo arquivo (decisao registrada no plano: seguranca centralizada, e a Sprint 3 ja vai mexer aqui novamente para plugar JWT).

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

**Acrescentar imports**:
```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
```

**Adicionar dentro da classe** (apos o metodo `securityFilterChain`):
```java
    /**
     * BCrypt com strength padrao (10). Usado pelo {@code CriarUsuarioUseCase}
     * (Sprint 2) e pelo futuro {@code AuthenticationProvider} (Sprint 3).
     * Senhas com 6 chars + BCrypt sao revisitadas antes de prod (PRD §22).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
```

### Step 2.3a.4 — Criar `CriarUsuarioUseCase`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/application/usecase/CriarUsuarioUseCase.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.application.usecase;

import com.dynamis.sep_api.usuarios.application.exception.UsernameJaExisteException;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.infrastructure.persistence.UsuarioRepository;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioCreateDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso de criacao de usuario. Recebe {@link UsuarioCreateDto},
 * checa unicidade do {@code username}, hasha a senha com BCrypt e
 * persiste a entidade via {@link UsuarioRepository}.
 *
 * <p>Spec 002 Task 2.3a: transacional, lanca
 * {@link UsernameJaExisteException} (mapeada para 409) e jamais persiste
 * senha em texto claro.
 */
@Service
public class CriarUsuarioUseCase {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public CriarUsuarioUseCase(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario executar(UsuarioCreateDto dto) {
        if (repository.existsByUsername(dto.username())) {
            throw new UsernameJaExisteException(dto.username());
        }
        String hash = passwordEncoder.encode(dto.password());
        Usuario novo = Usuario.criar(dto.username(), hash, dto.role());
        return repository.save(novo);
    }
}
```

### Step 2.3a.5 — Criar `CriarUsuarioUseCaseTest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/application/usecase/CriarUsuarioUseCaseTest.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.dynamis.sep_api.usuarios.application.exception.UsernameJaExisteException;
import com.dynamis.sep_api.usuarios.domain.model.Role;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.infrastructure.persistence.UsuarioRepository;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioCreateDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Cobertura unitaria do {@link CriarUsuarioUseCase} (sem Spring context).
 * 5 cenarios da Spec 002 Task 2.3a.
 */
@ExtendWith(MockitoExtension.class)
class CriarUsuarioUseCaseTest {

    @Mock
    private UsuarioRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private CriarUsuarioUseCase useCase;

    @Test
    void criaAdminValido() {
        UsuarioCreateDto dto = new UsuarioCreateDto("admin@sep.test", "123456", Role.ADMIN);
        when(repository.existsByUsername("admin@sep.test")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("$2a$10$hash");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario salvo = useCase.executar(dto);

        assertThat(salvo.getUsername()).isEqualTo("admin@sep.test");
        assertThat(salvo.getRole()).isEqualTo(Role.ADMIN);
        assertThat(salvo.getPassword()).isEqualTo("$2a$10$hash");
    }

    @Test
    void criaClienteValido() {
        UsuarioCreateDto dto = new UsuarioCreateDto("cliente@sep.test", "654321", Role.CLIENTE);
        when(repository.existsByUsername("cliente@sep.test")).thenReturn(false);
        when(passwordEncoder.encode("654321")).thenReturn("$2a$10$hash2");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario salvo = useCase.executar(dto);

        assertThat(salvo.getRole()).isEqualTo(Role.CLIENTE);
    }

    @Test
    void lancaUsernameJaExisteQuandoExistsByUsernameRetornaTrue() {
        UsuarioCreateDto dto = new UsuarioCreateDto("admin@sep.test", "123456", Role.ADMIN);
        when(repository.existsByUsername("admin@sep.test")).thenReturn(true);

        assertThatThrownBy(() -> useCase.executar(dto))
            .isInstanceOf(UsernameJaExisteException.class)
            .hasMessageContaining("admin@sep.test");

        verify(repository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void senhaPersistidaEAQueVeioDoPasswordEncoder() {
        UsuarioCreateDto dto = new UsuarioCreateDto("admin@sep.test", "abcdef", Role.ADMIN);
        when(repository.existsByUsername("admin@sep.test")).thenReturn(false);
        when(passwordEncoder.encode("abcdef")).thenReturn("$2a$10$encodedHash");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        useCase.executar(dto);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$10$encodedHash");
        assertThat(captor.getValue().getPassword()).isNotEqualTo("abcdef");
    }

    @Test
    void chamaRepositorySaveApenasUmaVez() {
        UsuarioCreateDto dto = new UsuarioCreateDto("admin@sep.test", "123456", Role.ADMIN);
        when(repository.existsByUsername("admin@sep.test")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("$2a$10$h");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        useCase.executar(dto);

        verify(repository, times(1)).save(any(Usuario.class));
    }
}
```

### Step 2.3a.6 — Rodar o teste

**Comando**:
```bash
cd <sep-api-root>
./gradlew test --tests "*CriarUsuarioUseCaseTest"
```

**Esperado**: 5 testes passando, sem subir Spring context.

### Definicao de pronto da Task 2.3a
- [ ] `ConflitoException` agora `non-sealed`, sem mexer no resto do `DomainException` sealed
- [ ] `UsernameJaExisteException` extends `ConflitoException`, codigo `USR-409-001`
- [ ] `@Bean PasswordEncoder` em `SecurityConfig` retornando `BCryptPasswordEncoder`
- [ ] `CriarUsuarioUseCase` `@Service @Transactional` com checagem `existsByUsername` → encode → save
- [ ] 5 cenarios `CriarUsuarioUseCaseTest` passando isoladamente sem Spring
- [ ] Senha nunca persiste em texto claro
- [ ] `Sprint 1.9 ApiExceptionHandlerTest` continua passando

### Commit Task 2.3a
```bash
git add src/main/java/com/dynamis/sep_api/shared/exception/ConflitoException.java \
        src/main/java/com/dynamis/sep_api/usuarios/application/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java \
        src/test/java/com/dynamis/sep_api/usuarios/application/
git commit -m "feat(backend): CriarUsuarioUseCase com BCrypt + UsernameJaExisteException"
```

---

## Task 2.3b — `UsuarioController` POST + `SecurityConfig` libera rota

**Objetivo**: expor `POST /api/v1/usuarios` publico, retornando `201 Created` + header `Location`, e cobrir 5 cenarios via `@WebMvcTest`.

**Pre-requisito**: Task 2.3a concluida.

**Esforco**: 3-4 horas.

### Step 2.3b.1 — Criar `UsuarioController`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioController.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.controller;

import com.dynamis.sep_api.usuarios.application.usecase.CriarUsuarioUseCase;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioCreateDto;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioResponseDto;
import com.dynamis.sep_api.usuarios.web.mapper.UsuarioMapper;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints HTTP do modulo {@code usuarios}. Sprint 2 expoe apenas o
 * cadastro publico ({@code POST /api/v1/usuarios}); listagem, consulta por
 * id e troca de senha autenticada chegam na Sprint 3.
 */
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final CriarUsuarioUseCase criarUsuarioUseCase;
    private final UsuarioMapper mapper;

    public UsuarioController(CriarUsuarioUseCase criarUsuarioUseCase, UsuarioMapper mapper) {
        this.criarUsuarioUseCase = criarUsuarioUseCase;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDto> criar(@Valid @RequestBody UsuarioCreateDto dto) {
        Usuario salvo = criarUsuarioUseCase.executar(dto);
        UsuarioResponseDto body = mapper.toResponse(salvo);
        URI location = URI.create("/api/v1/usuarios/" + salvo.getId());
        return ResponseEntity.created(location).body(body);
    }
}
```

### Step 2.3b.2 — Liberar rota em `SecurityConfig`

**Arquivo**: `<sep-api-root>/src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java`

**Adicionar import**:
```java
import org.springframework.http.HttpMethod;
```

**No metodo `securityFilterChain`, dentro de `authorizeHttpRequests`, adicionar antes do `anyRequest().authenticated()`**:
```java
                // cadastro publico de usuario (Sprint 2)
                .requestMatchers(HttpMethod.POST, "/api/v1/usuarios").permitAll()
```

O bloco completo de `authorizeHttpRequests` deve ficar:
```java
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/actuator/health",
                    "/actuator/info",
                    "/actuator/prometheus",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**"
                ).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/usuarios").permitAll()
                .anyRequest().authenticated()
            )
```

### Step 2.3b.3 — Criar `UsuarioControllerTest`

**Arquivo**: `<sep-api-root>/src/test/java/com/dynamis/sep_api/usuarios/web/controller/UsuarioControllerTest.java`

**Conteudo**:
```java
package com.dynamis.sep_api.usuarios.web.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dynamis.sep_api.shared.exception.ApiExceptionHandler;
import com.dynamis.sep_api.usuarios.application.exception.UsernameJaExisteException;
import com.dynamis.sep_api.usuarios.application.usecase.CriarUsuarioUseCase;
import com.dynamis.sep_api.usuarios.domain.model.Role;
import com.dynamis.sep_api.usuarios.domain.model.Usuario;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioCreateDto;
import com.dynamis.sep_api.usuarios.web.dto.UsuarioResponseDto;
import com.dynamis.sep_api.usuarios.web.mapper.UsuarioMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice MVC do {@link UsuarioController}. Importa
 * {@link ApiExceptionHandler} para confirmar que o mapeamento de erros da
 * Sprint 1.5 cobre os cenarios da Sprint 2 (400 validacao + 409 conflito).
 *
 * <p>Filtros de seguranca desabilitados ({@code addFilters = false}): o
 * teste alvo e o controller, nao a regra do {@code SecurityConfig} — esta
 * sera validada na verificacao manual (Step 2.3b.4) e no
 * {@code SmokeBootTest} ja existente.
 */
@WebMvcTest(controllers = UsuarioController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CriarUsuarioUseCase criarUsuarioUseCase;

    @MockBean
    private UsuarioMapper mapper;

    @Test
    void postValidoRetorna201ComLocationESemPassword() throws Exception {
        Usuario salvo = Usuario.criar("admin@sep.test", "$2a$10$h", Role.ADMIN);
        UsuarioResponseDto response = new UsuarioResponseDto(
            salvo.getId(),
            "admin@sep.test",
            Role.ADMIN,
            OffsetDateTime.now(),
            OffsetDateTime.now(),
            "system",
            "system");
        when(criarUsuarioUseCase.executar(any(UsuarioCreateDto.class))).thenReturn(salvo);
        when(mapper.toResponse(salvo)).thenReturn(response);

        mockMvc.perform(post("/api/v1/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UsuarioCreateDto("admin@sep.test", "123456", Role.ADMIN))))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", startsWith("/api/v1/usuarios/")))
            .andExpect(jsonPath("$.username").value("admin@sep.test"))
            .andExpect(jsonPath("$.role").value("ADMIN"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(content().string(containsString("\"id\":")))
            .andExpect(content().string(containsString("\"criadoPor\":\"system\"")));
    }

    @Test
    void postComUsernameInvalidoRetorna400() throws Exception {
        String body = """
            {"username":"nao-eh-email","password":"123456","role":"ADMIN"}
            """;

        mockMvc.perform(post("/api/v1/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void postComSenhaTamanhoInvalidoRetorna400() throws Exception {
        String body = """
            {"username":"admin@sep.test","password":"12345","role":"ADMIN"}
            """;

        mockMvc.perform(post("/api/v1/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void postComRoleInvalidoRetorna400() throws Exception {
        String body = """
            {"username":"admin@sep.test","password":"123456","role":"SUPER_USER"}
            """;

        mockMvc.perform(post("/api/v1/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void postComUsernameJaExistenteRetorna409() throws Exception {
        when(criarUsuarioUseCase.executar(any(UsuarioCreateDto.class)))
            .thenThrow(new UsernameJaExisteException("admin@sep.test"));

        mockMvc.perform(post("/api/v1/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UsuarioCreateDto("admin@sep.test", "123456", Role.ADMIN))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.message").value(containsString("admin@sep.test")));
    }
}
```

### Step 2.3b.4 — Verificacao manual end-to-end

**Comando**:
```bash
cd <sep-api-root>
docker compose up -d postgres
./gradlew bootRun --args='--spring.profiles.active=dev' &
SERVER_PID=$!
sleep 30
```

**Cenarios `curl`**:
```bash
# 201 Created + Location
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@sep.test","password":"123456","role":"ADMIN"}'
# Esperado: HTTP/1.1 201, header Location: /api/v1/usuarios/<uuid>, body sem "password"

# 201 Created CLIENTE
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"cliente@sep.test","password":"654321","role":"CLIENTE"}'
# Esperado: HTTP/1.1 201

# 409 Conflict (re-tentando o mesmo username)
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@sep.test","password":"abcdef","role":"ADMIN"}'
# Esperado: HTTP/1.1 409 + ErrorResponseDto

# 400 (senha 5 chars)
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"x@y.z","password":"12345","role":"ADMIN"}'
# Esperado: HTTP/1.1 400

# 400 (role invalido)
curl -i -X POST http://localhost:8080/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"username":"x@y.z","password":"123456","role":"FOO"}'
# Esperado: HTTP/1.1 400
```

**Inspecao do banco**:
```bash
docker exec -it sep-postgres psql -U sep -d sep_dev -c \
  "SELECT id, username, role, criado_por, modificado_por, substr(password, 1, 4) AS pw_prefix FROM usuario;"
# Esperado: pw_prefix = '$2a$' (BCrypt), criado_por = 'system', modificado_por = 'system'
```

```bash
kill $SERVER_PID 2>/dev/null || true
```

### Step 2.3b.5 — Suite completa

**Comando**:
```bash
cd <sep-api-root>
./gradlew clean test
```

**Esperado**: `BUILD SUCCESSFUL` com Sprint 1 + Sprint 2 verdes (>= 13 testes).

```bash
./gradlew jacocoTestReport
ls build/reports/jacoco/test/html/index.html
# Sprint 4 ativa o gate 70%; aqui apenas geramos o relatorio
```

### Definicao de pronto da Task 2.3b
- [ ] `UsuarioController` `@RestController` em `/api/v1/usuarios` com `@PostMapping`
- [ ] `SecurityConfig` libera `POST /api/v1/usuarios` antes do `anyRequest().authenticated()`
- [ ] `UsuarioControllerTest` com 5 cenarios MockMvc passando
- [ ] Verificacao manual com `curl` cobre 201 ADMIN, 201 CLIENTE, 409 conflito, 400 validacoes (3 variantes)
- [ ] `psql` confirma hash BCrypt (`$2a$...`) e `criado_por = system`
- [ ] `./gradlew clean test` verde

### Commit Task 2.3b
```bash
git add src/main/java/com/dynamis/sep_api/usuarios/web/controller/ \
        src/main/java/com/dynamis/sep_api/identity/infrastructure/config/SecurityConfig.java \
        src/test/java/com/dynamis/sep_api/usuarios/web/controller/
git commit -m "feat(backend): POST /api/v1/usuarios publico + SecurityConfig libera cadastro"
```

---

## Definicao de Pronto da Sprint 2 (consolidada)

A Sprint 2 esta concluida quando todas as 4 tasks tiverem checklist completo:

- [ ] **Task 2.1** — Entidade `Usuario` + `Role` + `UsuarioRepository` + `UsuarioRepositoryTest` (4 cenarios)
- [ ] **Task 2.2** — Records `UsuarioCreateDto`/`UsuarioResponseDto`/`UsuarioSenhaUpdateDto` + `UsuarioMapper` MapStruct + `UsuarioMapperTest`
- [ ] **Task 2.3a** — `ConflitoException` `non-sealed` + `UsernameJaExisteException` + bean `PasswordEncoder` + `CriarUsuarioUseCase` + `CriarUsuarioUseCaseTest` (5 cenarios)
- [ ] **Task 2.3b** — `UsuarioController` POST + `SecurityConfig` permitAll + `UsuarioControllerTest` (5 cenarios)

E os criterios da spec 002:
- [ ] entidade `Usuario` persistida com UUID v6 nativo
- [ ] auditoria preenchida automaticamente com fallback `system`
- [ ] DTOs validados por Jakarta Bean Validation
- [ ] `UsuarioMapper` MapStruct gerando `UsuarioMapperImpl` em `build/generated/`
- [ ] `POST /api/v1/usuarios` funcional para `ADMIN` e `CLIENTE`, com header `Location`
- [ ] senha jamais exposta em respostas (record `UsuarioResponseDto` nao tem o campo)
- [ ] senha persistida com hash BCrypt
- [ ] conflito de username retorna 409 com `ErrorResponseDto`
- [ ] >= 13 testes verdes (Sprint 1: 7 + Sprint 2: 4 + 1 + 5 + 5 = 22 totais)
- [ ] JaCoCo nao regride

## Cenarios de verificacao manual (fim de sprint)

Listados na Step 2.3b.4. Resumo:
1. `POST` ADMIN valido → 201 + Location + body sem `password`
2. `POST` CLIENTE valido → 201
3. `POST` username invalido → 400
4. `POST` senha tamanho != 6 → 400
5. `POST` role invalido → 400
6. Inspecionar `201` no body → `password` ausente
7. `psql`: `password` em hash `$2a$...`
8. `psql`: `criado_por = system`, `modificado_por = system`
9. `POST` duplicado → 409 com `ErrorResponseDto`

## Estado esperado do repositorio apos Sprint 2

```
<sep-api-root>/
├── src/
│   ├── main/java/com/dynamis/sep_api/
│   │   ├── usuarios/
│   │   │   ├── application/
│   │   │   │   ├── exception/UsernameJaExisteException.java         # NOVO 2.3a
│   │   │   │   └── usecase/CriarUsuarioUseCase.java                 # NOVO 2.3a
│   │   │   ├── domain/model/
│   │   │   │   ├── Role.java                                        # NOVO 2.1
│   │   │   │   └── Usuario.java                                     # NOVO 2.1
│   │   │   ├── infrastructure/persistence/
│   │   │   │   └── UsuarioRepository.java                           # NOVO 2.1
│   │   │   └── web/
│   │   │       ├── controller/UsuarioController.java                # NOVO 2.3b
│   │   │       ├── dto/
│   │   │       │   ├── UsuarioCreateDto.java                        # NOVO 2.2
│   │   │       │   ├── UsuarioResponseDto.java                      # NOVO 2.2
│   │   │       │   └── UsuarioSenhaUpdateDto.java                   # NOVO 2.2
│   │   │       └── mapper/UsuarioMapper.java                        # NOVO 2.2
│   │   ├── identity/infrastructure/config/SecurityConfig.java       # MODIFICADO 2.3a + 2.3b
│   │   └── shared/exception/ConflitoException.java                  # MODIFICADO 2.3a (non-sealed)
│   └── test/java/com/dynamis/sep_api/usuarios/
│       ├── application/usecase/CriarUsuarioUseCaseTest.java         # NOVO 2.3a
│       ├── infrastructure/persistence/UsuarioRepositoryTest.java    # NOVO 2.1
│       ├── web/controller/UsuarioControllerTest.java                # NOVO 2.3b
│       └── web/mapper/UsuarioMapperTest.java                        # NOVO 2.2
```

Sem nova migration. V1 (Sprint 1.4) ja proveu o schema da tabela `usuario`.

## Proximos passos apos Sprint 2

1. **Sprint 3** — comeca com [`specs/fase-1/003-sprint-3-seguranca-autenticacao.md`](../../specs/fase-1/003-sprint-3-seguranca-autenticacao.md). Antes, gerar `steps-fase-1/backend/003-sprint-3-steps.md` just-in-time. Sprint 3 entrega login, JWT, filtros de seguranca, autorizacao por ownership e troca de senha autenticada (consumindo `UsuarioSenhaUpdateDto` declarado nesta sprint).
2. **F-Sprint 3 / M-Sprint 3** — frontend e mobile passam a consumir contratos reais do `POST /api/v1/usuarios` (deixando MSW para casos de erro).

## Restricoes e regras de execucao

- **Modelo de branches** (ver `AGENT.md`): 1 branch por sprint = `feature/sprint-2-gestao-usuarios`, nascida de `develop` apos `git pull --ff-only`. Toda a sprint vive nessa branch unica. PR vai para `develop` (nunca direto para `main`); merge tipo squash.
- **Commits**: numero flexivel — agente decide pelo escopo logico (Task, Step, modulo, refactor). Conventional Commits obrigatorio. Cada commit deve ser auto-contido. `git status` + `git add <paths>` + `git commit` explicitos antes de cada commit (hook automatico de `git add` foi removido em 2026-05-06).
- **Push e PR sao manuais** (regra do AGENT.md) — agente nao faz `git push` nem `gh pr create`.
- **Bugs durante a execucao**: ficam na propria branch da sprint, com Conventional Commit `fix(...)`. Sem prefixos `fix/*` ou `hotfix/*`.
- Ao final de cada bloco logico (Task ou conjunto coerente), parar para teste local manual antes de commitar.
- TDD distribuido: cada task entrega seus testes junto com o codigo.
- Spotless deve passar em cada PR (configurado na Sprint 0); rodar `./gradlew spotlessApply` antes do commit final.
- JaCoCo nao verifica target ainda nesta sprint (gate 70% liga em Sprint 4); apenas gera relatorio.

## Referencias

- [Spec 002 - Sprint 2 Gestao de Usuarios](../../specs/fase-1/002-sprint-2-gestao-usuarios.md)
- [Steps Sprint 1 backend](./001-sprint-1-steps.md) — predecessor (fundacao tecnica)
- [PRD §11, §13, §15, §16, §22](../../docs-sep/PRD.md) — stack, padroes, convencoes, backlog
- [CONTEXT.md](../../docs-sep/CONTEXT.md) — historico de decisoes
- [AGENT.md](../../AGENT.md) — orientacao para agentes de IA
- ADRs [0006 - MapStruct](../../adr/0006-mapstruct-substitui-modelmapper.md), [0007 - Hexagonal](../../adr/0007-ddd-com-hexagonal-ports-and-adapters-por-modulo.md)
