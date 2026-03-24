# OpenClaw 실전 시작 가이드 — 쇼핑 쇼츠 파이프라인

> 설치 → 스킬 등록 → Telegram 연결 → Cron 자동화까지

---

## 핵심 이해: 우리 코드 vs OpenClaw 실제 구조

우리가 만든 .mjs 파일들은 **파이프라인 로직의 설계도**입니다.
OpenClaw에서 실제로 작동하려면 **SKILL.md 형식**으로 변환해야 합니다.

```
우리가 만든 것 (.mjs)          →  OpenClaw 실제 구조
──────────────────────────────────────────────────
01-product-scout.mjs           →  skills/shopping-shorts-scout/SKILL.md
02-script-writer.mjs           →  skills/shopping-shorts-writer/SKILL.md
03-video-sourcer.mjs           →  skills/shopping-shorts-sourcer/SKILL.md
04-video-cleaner.mjs           →  skills/shopping-shorts-cleaner/SKILL.md
05-video-producer.mjs          →  skills/shopping-shorts-producer/SKILL.md
06-distributor.mjs             →  skills/shopping-shorts-distributor/SKILL.md
orchestrator.mjs               →  skills/shopping-shorts-pipeline/SKILL.md (메인 오케스트레이터)
config/settings.json           →  그대로 사용 (스킬이 참조)
```

OpenClaw 스킬 = Markdown 지침서. 에이전트(Claude/GPT)가 읽고, 셸 명령/API 호출을 자율 실행.

---

## Step 1: OpenClaw 설치 (10분)

### Linux/macOS (서버)

```bash
# 원라인 설치
curl -fsSL https://get.openclaw.ai | bash

# 또는 npm으로
npm install -g @openclaw/cli

# 설치 확인
openclaw --version
```

### 온보딩 (최초 1회)

```bash
# OpenClaw 시작 — 온보딩 위자드가 실행됨
openclaw

# 질문에 답하기:
# 1. AI 모델: Anthropic Claude (API 키 입력)
# 2. 채널: Telegram (봇 토큰 입력)
# 3. 이름: "쇼핑쇼츠봇" (또는 원하는 이름)
```

온보딩이 끝나면 `~/.openclaw/` 디렉토리가 생성됩니다:
```
~/.openclaw/
├── config.yaml          ← 모델/채널 설정
├── credentials/         ← API 키 저장
├── memory/              ← 장기 기억
├── skills/              ← 스킬 폴더 (여기에 우리 스킬 넣기!)
└── sessions/            ← 대화 세션
```

### Docker로 설치 (서버용 추천)

```bash
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e OPENAI_API_KEY=sk-... \
  -e TELEGRAM_BOT_TOKEN=... \
  ghcr.io/openclaw/openclaw:latest
```

---

## Step 2: Telegram 채널 연결 (5분)

OpenClaw은 Telegram을 통해 제어하고 보고를 받습니다.

```yaml
# ~/.openclaw/config.yaml 에 추가
channels:
  telegram:
    enabled: true
    bot_token: "YOUR_TELEGRAM_BOT_TOKEN"
    allowed_users:
      - YOUR_TELEGRAM_USER_ID
```

연결 확인: Telegram에서 봇에게 `/status` 보내기 → 응답이 오면 성공

---

## Step 3: 쇼핑 쇼츠 스킬 설치 (15분)

우리 스킬 파일들을 OpenClaw의 skills 디렉토리에 넣습니다.

```bash
# 스킬 디렉토리로 이동
cd ~/.openclaw/skills/

# 7개 스킬 폴더 생성 (6개 단계 + 1개 오케스트레이터)
mkdir -p shopping-shorts-pipeline
mkdir -p shopping-shorts-scout
mkdir -p shopping-shorts-writer
mkdir -p shopping-shorts-sourcer
mkdir -p shopping-shorts-cleaner
mkdir -p shopping-shorts-producer
mkdir -p shopping-shorts-distributor

# 우리가 만든 SKILL.md 파일들을 각 폴더에 복사
# (아래에서 각 파일의 내용을 제공합니다)
```

### 보조 파일 배치

```bash
# n8n 워크플로우 + 설정 파일은 작업 디렉토리에 배치
mkdir -p /opt/shopping-shorts/{config,workspace,scripts}

# settings.json 복사
cp config/settings.json /opt/shopping-shorts/config/

# 작업 디렉토리 생성
mkdir -p /opt/shopping-shorts/workspace/{downloads,cleaned,tts,output,logs}
```

---

## Step 4: n8n 연동

OpenClaw은 n8n Webhook을 셸의 curl 명령으로 호출합니다.
n8n은 별도 Docker 컨테이너로 실행됩니다 (기존 docker-compose.yml 사용).

```bash
# n8n 시작 (기존 docker-compose에서 n8n + nginx만)
cd /opt/shopping-shorts
docker compose up -d n8n nginx

# n8n에 워크플로우 임포트 (수동)
# 브라우저에서 http://서버IP:5678 접속 → JSON 임포트
```

---

## Step 5: Cron 스케줄 설정

OpenClaw은 내장 cron 기능이 있습니다. Telegram에서 직접 설정하거나,
시스템 crontab으로 트리거할 수 있습니다.

### 방법 A: OpenClaw 내장 Cron (Telegram에서 설정)

Telegram에서 봇에게 메시지:
```
매일 아침 9시에 쇼핑 쇼츠 파이프라인을 실행해줘.
매일 밤 10시에 쇼핑 쇼츠 성과 분석을 실행해줘.
```

OpenClaw이 자체 스케줄러에 등록합니다.

### 방법 B: 시스템 Crontab + Telegram 메시지 트리거

```bash
# crontab -e
# 매일 09:00에 Telegram으로 명령 전송
0 9 * * * curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=쇼핑 쇼츠 파이프라인을 지금 시작해줘"

# 매일 22:00에 성과 분석
0 22 * * * curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=오늘 쇼핑 쇼츠 성과를 분석해줘"
```

---

## Step 6: 테스트

```bash
# OpenClaw 상태 확인
openclaw doctor

# 스킬 목록 확인 (Telegram에서)
/skills

# 수동 파이프라인 실행 (Telegram에서)
"쇼핑 쇼츠 파이프라인을 지금 시작해줘"

# 특정 단계만 테스트 (Telegram에서)
"쿠팡에서 오늘의 베스트 상품을 찾아줘"
"이 상품으로 40초 쇼핑 쇼츠 대본을 만들어줘: 핸디 청소기"
"TikTok에서 '핸디 청소기 리뷰' 영상을 찾아줘"
```

---

## 전체 구조 요약

```
서버
├── OpenClaw (에이전트 런타임)
│   ├── ~/.openclaw/skills/          ← 7개 SKILL.md
│   ├── ~/.openclaw/config.yaml      ← Claude API + Telegram
│   └── ~/.openclaw/memory/          ← 장기 기억 (성과 데이터 등)
│
├── n8n (Docker)                     ← Webhook 36노드
│   └── 8개 엔드포인트
│
├── /opt/shopping-shorts/
│   ├── config/settings.json         ← 설정
│   ├── workspace/                   ← 다운로드/클리닝/TTS/출력
│   └── remotion-shopping-shorts/    ← Remotion 프로젝트
│
└── Telegram ← 제어 + 보고 채널
```

OpenClaw 에이전트가 SKILL.md를 읽고:
1. 셸 명령 실행 (yt-dlp, ffmpeg, npx remotion)
2. curl로 n8n Webhook 호출 (쿠팡 API, 배포, Sheets)
3. API 직접 호출 (OpenAI, Supertone TTS)
4. Telegram으로 진행 상황 보고
이 모든 것을 **자연어 지침**에 따라 자율적으로 수행합니다.
