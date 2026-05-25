Based on your answers, I would strongly recommend:

* a single generic `jobs` table
* one row per logical execution
* retries update the same row
* append-only attempt/error logs optionally later
* BullMQ remains executor
* Postgres becomes observability + business state

Do not create separate tables like:

* `translation_jobs`
* `import_jobs`
* `index_jobs`

That becomes painful once jobs overlap domains.

Your case is classic polymorphic async workload orchestration.

---

# Recommended Architecture

Use:

```text
Redis (BullMQ)
  = ephemeral execution state

Postgres jobs table
  = durable business/job history
```

BullMQ remains the runtime engine.

Postgres becomes:

* UI source
* admin panel source
* auditing
* debugging
* analytics
* retry history
* future scheduling support

---

# Important Design Decision

## One row per execution

This is the correct choice for your case.

Meaning:

```text
Translate Novel A -> English
```

creates:

```text
job row #1
```

Retrying it:

```text
same row updated
```

NOT:

```text
new row
```

---

# Why this is better

Advantages:

* simpler UI
* stable references
* easier monitoring
* easier querying
* retry count is straightforward
* less row explosion
* cleaner admin UX

Disadvantages:

* loses detailed per-attempt history

But that can be solved later with:

```text
job_attempts
```

if needed.

You likely do NOT need that yet.

---

# Recommended Schema

## Core jobs table

```sql
jobs
```

Columns:

| column               | type                 | purpose                          |
| -------------------- | -------------------- | -------------------------------- |
| id                   | uuid                 | internal DB id                   |
| type                 | enum/text            | import / translate / index       |
| status               | enum                 | waiting/running/completed/failed |
| queue_job_id         | varchar              | BullMQ job id                    |
| entity_type          | varchar              | novel/chapter/etc                |
| entity_id            | uuid/bigint          | target entity                    |
| initiated_by_user_id | uuid nullable        | user-triggered jobs              |
| source_language      | varchar nullable     | translation/import context       |
| target_language      | varchar nullable     | translation context              |
| payload              | jsonb                | original job payload             |
| result               | jsonb nullable       | success metadata                 |
| error_message        | text nullable        | short error                      |
| error_stack          | text nullable        | stack trace                      |
| attempts             | int                  | retry count                      |
| started_at           | timestamptz nullable | runtime started                  |
| completed_at         | timestamptz nullable | success timestamp                |
| failed_at            | timestamptz nullable | failure timestamp                |
| created_at           | timestamptz          | enqueue time                     |
| updated_at           | timestamptz          | update tracking                  |

---

# Strong recommendation:

Use UUID primary keys

Do NOT use increment integers for distributed systems/workers.

---

# Recommended enums

## Job type

```ts
export enum JobType {
  IMPORT = 'IMPORT',
  TRANSLATE = 'TRANSLATE',
  INDEX = 'INDEX',
}
```

---

## Job status

```ts
export enum JobStatus {
  WAITING = 'WAITING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

You do not currently need:

* CANCELLED
* PAUSED
* STALLED

Those can be added later.

---

# Entity Targeting Strategy

This part matters a lot.

You said jobs overlap domains.

So avoid hard FK columns like:

```text
novel_id
chapter_id
```

Use polymorphic targeting:

| entity_type | entity_id |
| ----------- | --------- |
| novel       | uuid      |
| chapter     | uuid      |

Example:

| type      | entity_type | entity_id |
| --------- | ----------- | --------- |
| TRANSLATE | novel       | abc       |
| TRANSLATE | chapter     | xyz       |
| INDEX     | novel       | abc       |

This scales much better.

---

# Translation-specific context

You mentioned:

```text
translate novel A to english
translate novel A to japanese
```

So language context should NOT be buried in JSON only.

Add explicit searchable columns:

```sql
source_language
target_language
```

because later you WILL query:

```sql
find failed japanese translations
```

---

# Payload strategy

Store the original payload.

Example:

```json
{
  "novelId": "123",
  "targetLanguage": "ja",
  "provider": "openai"
}
```

inside:

```sql
payload jsonb
```

This is extremely valuable later for:

* debugging
* replay
* analytics

---

# Result strategy

Example:

```json
{
  "chaptersTranslated": 512,
  "durationMs": 882322
}
```

Store in:

```sql
result jsonb
```

---

# Error strategy

Separate:

```sql
error_message
error_stack
```

Do NOT only use JSON.

You will search/filter errors frequently.

---

# Indexes You Will Want

Very important.

## Core indexes

```sql
(type, status)
(entity_type, entity_id)
(created_at desc)
(queue_job_id)
```

---

## Translation index

```sql
(target_language, status)
```

---

# What NOT to do

Avoid:

* storing only BullMQ job id
* relying solely on Redis
* separate table per job type
* embedding everything in JSONB
* hardcoding foreign keys for each domain entity

Those designs degrade badly over time.

---

# Recommended Future Extension

Later add:

```sql
job_logs
```

Example:

| id | job_id | level | message | created_at |
| -- | ------ | ----- | ------- | ---------- |

Useful for:

* AI translation logs
* indexing diagnostics
* import traces

Do NOT add this yet unless needed.

---

# Recommended Execution Lifecycle

## When enqueuing

1. Create DB row first

```text
WAITING
```

2. Add BullMQ job

3. Save BullMQ job id

---

## When worker starts

Update:

```text
RUNNING
started_at=now()
```

---

## On success

Update:

```text
COMPLETED
completed_at=now()
result=...
```

---

## On failure

Update:

```text
FAILED
failed_at=now()
error_message=...
error_stack=...
attempts += 1
```

---

# Important Recommendation

Do NOT trust Redis as source of truth.

Redis is runtime state.

Postgres should be canonical job history.

Especially because:

* Redis cleanup may remove completed jobs
* Redis can be ephemeral
* BullMQ retention policies change

Your admin/UI/business logic should query Postgres.

---

# Recommended TypeORM Entity Shape

Roughly:

```ts
@Entity('jobs')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  @Column({ type: 'enum', enum: JobStatus })
  status: JobStatus;

  @Column({ nullable: true })
  queueJobId?: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ nullable: true })
  sourceLanguage?: string;

  @Column({ nullable: true })
  targetLanguage?: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  errorStack?: string;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

This is a solid long-term foundation for your workload model.
