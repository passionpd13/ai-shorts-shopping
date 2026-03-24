# 처음부터 끝까지 — 실전 시작 가이드

> 이 가이드를 따라하면 "쇼핑 쇼츠 자동 생산 시스템"이 실제로 돌아갑니다.
> 예상 소요 시간: 1일차 3~4시간(세팅) + 2일차 1시간(첫 쇼츠) + 3일차~ 자동

---

## 전체 로드맵 (어떤 순서로?)

```
1일차: 계정 만들기 (2시간)
  ↓
2일차: 서버 세팅 (1시간)
  ↓
3일차: 파이프라인 테스트 (1시간)
  ↓
4일차~: 자동 운영
```

왜 이 순서인가?
- API 키 발급이 **가장 오래 걸리는 병목**입니다 (TikTok 심사 2~4주)
- 나머지는 키만 있으면 30분이면 끝납니다
- 그래서 **계정 만들기를 제일 먼저** 합니다

---

## 1일차: 계정 만들기 (가장 중요!)

### Step 1-1: 지금 당장 해야 하는 것 (10분)

이 4개는 **즉시 발급**되고, 파이프라인의 핵심입니다.

#### Anthropic API Key (대본 검수용)
```
1. https://console.anthropic.com 접속
2. 회원가입 (구글 로그인 가능)
3. Settings → API Keys → Create Key
4. sk-ant-... 으로 시작하는 키 복사
5. 결제 수단 등록 (후불제, $5부터)
```
**메모장에 저장: `ANTHROPIC_API_KEY=sk-ant-...`**

#### OpenAI API Key (Whisper 타임스탬프용)
```
1. https://platform.openai.com 접속
2. 회원가입
3. API Keys → Create new secret key
4. sk-... 으로 시작하는 키 복사
5. 결제 수단 등록 (후불제, $5부터)
```
**메모장에 저장: `OPENAI_API_KEY=sk-...`**

#### Telegram Bot (제어+알림 채널)
```
1. 텔레그램 앱에서 @BotFather 검색
2. /newbot 입력
3. 봇 이름 입력: 쇼핑쇼츠봇
4. 봇 유저네임 입력: shopping_shorts_12345_bot (고유해야 함)
5. HTTP API Token 복사 (숫자:영문 형식)

6. 생성된 봇에게 아무 메시지 전송 (봇 활성화)
7. 브라우저에서 열기:
   https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates
8. 응답에서 "chat":{"id":숫자} 부분의 숫자가 CHAT_ID
```
**메모장에 저장:**
```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF...
TELEGRAM_CHAT_ID=987654321
```

#### 쿠팡 파트너스 (수익화)
```
1. https://partners.coupang.com 접속
2. 회원가입 (사업자 없어도 개인 가입 가능)
3. 로그인 → 도구 → API 관리
4. Access Key / Secret Key 복사
```
**메모장에 저장:**
```
COUPANG_ACCESS_KEY=...
COUPANG_SECRET_KEY=...
```

---

### Step 1-2: 오늘 신청하고 기다려야 하는 것

#### TikTok Developer (2~4주 심사)
```
1. https://developers.tiktok.com 접속
2. 회원가입 → Manage apps → Create app
3. 앱 이름: Shopping Shorts Automation
4. Products에서 "Content Posting API" 추가
5. Scopes: video.publish, video.upload
6. 심사 제출

※ 심사 통과 전까지 TikTok은 비공개(SELF_ONLY)로만 업로드 가능
※ 나머지 3개 플랫폼(YT/IG/FB)으로 먼저 운영 가능
```

#### Instagram 비즈니스 계정 전환 (30분)
```
1. Instagram 앱 → 설정 → 계정 → 프로페셔널 계정으로 전환
2. "비즈니스" 선택 (크리에이터 아님!)
3. Facebook 페이지 연결 (없으면 새로 생성)
   - 페이지 이름: [채널명] (예: Gpters 쇼핑)

4. https://developers.facebook.com 접속
5. My Apps → Create App → Business
6. 앱에 Products 추가: Instagram Graph API
7. Instagram Graph API → Generate Token
8. Page 선택 → 권한 체크:
   - instagram_basic
   - instagram_content_publish
   - pages_show_list
   - pages_read_engagement
9. Generate 클릭 → 단기 토큰 복사

10. 장기 토큰으로 변환 (60일):
    브라우저에서:
    https://graph.facebook.com/v19.0/oauth/access_token?
    grant_type=fb_exchange_token&
    client_id={APP_ID}&
    client_secret={APP_SECRET}&
    fb_exchange_token={단기토큰}
11. 응답의 access_token이 장기 토큰
```
**메모장에 저장:**
```
INSTAGRAM_BUSINESS_ID=17841400...
INSTAGRAM_ACCESS_TOKEN=EAAG...
FACEBOOK_PAGE_ID=10000...
FACEBOOK_PAGE_TOKEN=EAAG...
```

#### YouTube API (OAuth2, 30분)
```
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성: shopping-shorts
3. APIs & Services → Enable APIs:
   - YouTube Data API v3
   - Google Sheets API
4. OAuth consent screen 설정:
   - User Type: External
   - 앱 이름, 이메일 입력
   - Scopes 추가:
     youtube.upload, youtube.readonly
     spreadsheets, spreadsheets.readonly
5. Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Redirect URI: http://서버IP:5678/rest/oauth2-credential/callback
   (n8n의 OAuth2 콜백 URL — 서버 세팅 후 설정)
6. Client ID + Client Secret 복사
```
**메모장에 저장:**
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

#### Google Sheets (5분)
```
1. Google Sheets에서 새 스프레드시트 생성
2. 시트 이름: deployments
3. 첫 행(헤더):
   date | productId | productName | categoryId | commentKeyword |
   inpockLink | youtubeUrl | instagramUrl | tiktokUrl | facebookUrl |
   deployStatus | scriptScore | views | comments | clicks | commission
4. URL에서 스프레드시트 ID 복사:
   https://docs.google.com/spreadsheets/d/{이_부분}/edit
```
**메모장에 저장: `GOOGLE_SHEETS_ID=1abc...`**

#### GhostCut (자막 제거, 5분)
```
1. https://ghostcut.com 접속
2. 회원가입
3. API 메뉴 → API Key 발급
```
**메모장에 저장: `GHOSTCUT_API_KEY=...`**

#### Supertone TTS (한국어 음성, 5분)
```
1. https://supertone.ai 접속
2. 회원가입
3. API → API Key 발급
```
**메모장에 저장: `SUPERTONE_API_KEY=...`**

#### 인포크 (수익화 DM, 10분)
```
1. https://inpock.co.kr 접속
2. 회원가입
3. 인포크링크 생성 (프로필 링크)
4. 쿠팡 파트너스 연동 (파트너스 탭)
5. 매니저 플랜 구독 (5,900원/월 — DM 자동화 필수)
```

---

### Step 1-3: 메모장 최종 정리

이 시점에서 메모장에 아래 값들이 모두 있어야 합니다:

```
# === 즉시 발급 (오늘 완료) ===
ANTHROPIC_API_KEY=sk-ant-...          ✅
OPENAI_API_KEY=sk-...                 ✅
TELEGRAM_BOT_TOKEN=123:ABC...         ✅
TELEGRAM_CHAT_ID=987654321            ✅
COUPANG_ACCESS_KEY=...                ✅
COUPANG_SECRET_KEY=...                ✅

# === 오늘 발급 가능 (30분~1시간) ===
GHOSTCUT_API_KEY=...                  ✅
SUPERTONE_API_KEY=...                 ✅
GOOGLE_SHEETS_ID=...                  ✅
INSTAGRAM_BUSINESS_ID=...             ✅
INSTAGRAM_ACCESS_TOKEN=...            ✅
FACEBOOK_PAGE_ID=...                  ✅
FACEBOOK_PAGE_TOKEN=...               ✅

# === 서버 세팅 후 완료 ===
YOUTUBE_ACCESS_TOKEN=                 (n8n OAuth2에서 설정)
TIKTOK_ACCESS_TOKEN=                  (심사 후)
```

**최소 4개만 있으면 파이프라인 테스트가 가능합니다:**
ANTHROPIC_API_KEY, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

---

## 2일차: 서버 세팅

### Step 2-1: VPS 생성 (10분)

**추천: Hetzner CX32** (4vCPU / 8GB / 80GB NVMe, ~$5.39/월)

```
1. https://console.hetzner.cloud 접속
2. 회원가입 + 결제 수단 등록
3. 새 프로젝트 → 서버 추가
4. 설정:
   - Location: Ashburn (미국) 또는 Falkenstein (독일)
   - OS: Ubuntu 24.04
   - Type: CX32
   - SSH Key: 로컬에서 생성 후 등록
     ssh-keygen -t ed25519 -C "shorts-server"
     cat ~/.ssh/id_ed25519.pub  → 이 값을 복사해서 붙여넣기
5. Create & Buy
6. IP 주소 메모
```

**대안:**
- 무료 테스트: Oracle Cloud Free Tier (4ARM/24GB, 서울 리전)
- 한국 빠른 접속: Contabo 일본 ($8~12/월)

### Step 2-2: 서버 기본 설정 (15분)

```bash
# 서버 접속
ssh root@서버IP

# 시스템 업데이트
apt update && apt upgrade -y

# 타임존
timedatectl set-timezone Asia/Seoul

# 스왑 메모리 (Remotion 렌더링용)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Docker 설치
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# 방화벽
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5678/tcp
ufw --force enable
```

### Step 2-3: 프로젝트 배포 (10분)

```bash
# 프로젝트 클론
cd /opt
git clone https://github.com/passionpd13/ai-shorts-shopping.git shopping-shorts
cd /opt/shopping-shorts

# 브랜치 체크아웃
git checkout claude/remotion-video-integration-HDztM

# .env 파일 생성
cp .env.example .env
nano .env
# → 1일차에 메모장에 저장한 모든 키를 여기에 붙여넣기!

# 워크스페이스 생성
mkdir -p workspace/{downloads,cleaned,tts,output,logs}
```

### Step 2-4: Docker 빌드 + 시작 (10분)

```bash
# 빌드 (최초 5~10분)
docker compose build

# 시작
docker compose up -d

# 상태 확인
docker compose ps
# → shorts-n8n, shorts-worker, shorts-nginx 3개 모두 running이면 성공
```

### Step 2-5: n8n 워크플로우 설정 (20분)

```
1. 브라우저: http://서버IP:5678
2. 로그인 (ID: .env의 N8N_USER, PW: N8N_PASSWORD)
3. 첫 접속 시 Owner 계정 생성

4. Workflows → Import from File
   → /opt/shopping-shorts/n8n/workflow-shopping-shorts.json

5. Credentials 설정:
   - YouTube: Credentials → New → Google OAuth2
     → Client ID + Secret 입력
     → Redirect URI가 맞는지 확인
     → Sign in with Google → 권한 허용
   - Sheets: 같은 Google OAuth2를 공유

6. 워크플로우 Active 토글 ON
7. Webhook URL 확인: http://서버IP:5678/webhook/shopping-shorts/...
```

### Step 2-6: OpenClaw 설치 (15분)

```bash
# Worker 컨테이너에 접속
docker exec -it shorts-worker bash

# OpenClaw 설치 (컨테이너 안에서)
npm install -g @openclaw/cli

# 온보딩
openclaw
# 질문 답변:
# 1. AI 모델: Anthropic Claude → API 키 입력
# 2. 채널: Telegram → 봇 토큰 입력
# 3. 이름: 쇼핑쇼츠봇

# 스킬 복사
cp -r /opt/shopping-shorts/openclaw-skills/* ~/.openclaw/skills/

# 스킬 확인
ls ~/.openclaw/skills/
# → 7개 폴더가 보이면 성공

# 컨테이너 나가기
exit
```

### Step 2-7: 연결 테스트 (10분)

```bash
# 텔레그램 테스트
docker exec shorts-worker bash /opt/shopping-shorts/scripts/test-telegram.sh
# → 텔레그램에 메시지가 오면 성공

# n8n Webhook 테스트
docker exec shorts-worker curl -sf http://n8n:5678/webhook/shopping-shorts/sheets-record \
  -H "Content-Type: application/json" \
  -d '{"action":"read_product_ids"}'
# → JSON 응답이 오면 성공

# Worker 도구 확인
docker exec shorts-worker ffmpeg -version | head -1
docker exec shorts-worker yt-dlp --version
docker exec shorts-worker node -v
# → 버전이 출력되면 성공

# 전체 헬스 체크
bash /opt/shopping-shorts/scripts/health-check.sh
```

---

## 3일차: 첫 쇼츠 만들기

### Step 3-1: 텔레그램에서 파이프라인 실행

텔레그램 앱에서 봇에게 이렇게 보내세요:

```
쇼핑 쇼츠 파이프라인을 시작해줘
```

OpenClaw이 6단계를 순차로 실행하면서 텔레그램으로 보고합니다:
```
🎬 쇼핑 쇼츠 파이프라인 시작

✓ Step 1: 핸디 무선청소기 선정 (카테고리: 생활)
✓ Step 2: 대본 8점/10 (144자)
✓ Step 3: 영상 소싱 (1080x1920, 45초)
✓ Step 4: 클리닝 완료 (GhostCut)
✓ Step 5: 렌더링 완료 (40초, 12MB)
✓ Step 6: 3/4 플랫폼 배포 성공

🏁 파이프라인 완료! 소요시간: 8분
```

### Step 3-2: 에러가 나면?

| 에러 | 원인 | 해결 |
|------|------|------|
| Step 1 "API 응답 없음" | 쿠팡 API 키 오류 | .env에서 키 재확인 |
| Step 3 "영상 소싱 실패" | yt-dlp 차단 | `docker exec shorts-worker yt-dlp -U` |
| Step 4 "GhostCut 타임아웃" | API 키/크레딧 | GhostCut 대시보드에서 잔액 확인 |
| Step 5 "Remotion 렌더 실패" | 메모리 부족 | 스왑 확인: `free -h` |
| Step 6 "YouTube 403" | OAuth 만료 | n8n에서 재연결 |

### Step 3-3: 인포크 DM 설정 (수동, 5분)

쇼츠가 Instagram에 올라간 후:
```
1. 인포크 매니저 앱 접속
2. 해당 릴스 게시물 선택
3. 키워드 설정: "청소" (대본의 댓글 키워드)
4. DM 메시지 작성:
   "청소에 관심이 있으시군요! 제가 직접 써본 제품 정보 보내드릴게요 👇"
5. 버튼 추가: [상품 보러가기] → 인포크링크 URL
6. 활성화 ON
```

### Step 3-4: 첫 쇼츠 확인

```
- YouTube Shorts에서 영상 확인
- Instagram Reels에서 영상 확인
- 다른 계정으로 댓글에 "청소" 작성 → DM이 오는지 확인
- Google Sheets에 배포 기록이 저장됐는지 확인
```

---

## 4일차~: 자동 운영

### 자동 스케줄
Docker Cron이 자동으로 실행합니다:
- **매일 09:00** → 쇼츠 1개 자동 생산 + 배포
- **매일 22:00** → 성과 분석 + 텔레그램 보고

### 매일 해야 하는 것 (5분)
```
1. 텔레그램 보고 확인 (자동으로 옴)
2. 인포크 매니저에서 새 릴스에 키워드 DM 설정 (수동)
3. 끝!
```

### 주 1회 해야 하는 것 (10분)
```
1. Google Sheets에서 성과 확인 (조회수, 댓글수, 클릭수)
2. 커미션 수익 확인 (쿠팡 파트너스 대시보드)
3. 디스크 정리: bash scripts/health-check.sh
```

### 2개월마다 해야 하는 것
```
1. Instagram 장기 토큰 갱신 (60일 만료)
   → Meta Developer에서 토큰 재발급 → .env 업데이트
2. docker compose restart
```

---

## 비용 정리

| 항목 | 월 비용 | 비고 |
|------|---------|------|
| VPS (Hetzner CX32) | ~$5.39 | 4vCPU / 8GB |
| Anthropic API | ~$3~5 | 대본 검수 (하루 1~2회) |
| OpenAI API | ~$1~2 | Whisper 타임스탬프 |
| Supertone TTS | ~$5~10 | 하루 1개 기준 |
| GhostCut | ~$10~20 | 자막 제거 크레딧 |
| 인포크 매니저 | 5,900원 | DM 자동화 필수 |
| **합계** | **~$30~45/월** | 약 4~6만원 |

**손익분기점:** 쿠팡 파트너스 커미션 3%라면, 월 150~200만원 매출 유도 시 수익화.
초기에는 팔로워/조회수 성장이 목표이고, 3개월부터 수익 기대.

---

## 핵심 요약: 오늘 당장 할 것 3가지

```
1️⃣  Anthropic + OpenAI API 키 발급 (10분)
2️⃣  Telegram Bot 생성 (5분)
3️⃣  TikTok Developer 심사 신청 (10분, 2~4주 대기)
```

이 3개를 오늘 하면, 내일 서버를 세팅하고 모레 첫 쇼츠를 생산할 수 있습니다.
