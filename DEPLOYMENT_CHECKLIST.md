# 실전 배포 가이드 — VPS 추천 + 첫 배포 체크리스트

> 서버 선택 → 설치 → API 키 → 첫 쇼츠 생산까지 전체 과정

---

## Part 1: VPS 추천

### 추천 1위: Hetzner CX32 (가성비 최강)

| 항목 | 스펙 |
|------|------|
| vCPU | 4코어 (AMD) |
| RAM | 8GB |
| 디스크 | 80GB NVMe SSD |
| 트래픽 | 20TB |
| 가격 | 약 $5.39/월 (€4.99) |
| 위치 | 독일, 핀란드, 미국(Ashburn/Hillsboro) |

선택 이유: 가격 대비 성능이 압도적입니다. 같은 4코어/8GB 구성이 DigitalOcean에서 $48/월입니다.
NVMe SSD라 FFmpeg/Remotion 렌더링 시 디스크 I/O가 빠릅니다.
미국 Ashburn 데이터센터를 선택하면 YouTube/TikTok API 레이턴시가 좋습니다.

### 추천 2위: Contabo Cloud VPS M

| 항목 | 스펙 |
|------|------|
| vCPU | 6코어 |
| RAM | 16GB |
| 디스크 | 200GB NVMe |
| 트래픽 | 32TB |
| 가격 | 약 $8~12/월 |
| 위치 | 독일, 미국, 영국, 일본, 싱가포르, 호주 |

선택 이유: RAM이 넉넉해서 Remotion + Chromium이 동시에 돌아도 여유 있습니다.
일본 데이터센터가 있어서 한국에서의 SSH 접속 레이턴시가 짧습니다.
단, CPU 오버셀링이 Hetzner보다 심해서 실제 렌더링 속도는 Hetzner가 더 빠를 수 있습니다.

### 추천 3위: Oracle Cloud Free Tier (무료!)

| 항목 | 스펙 |
|------|------|
| vCPU | 4코어 (ARM Ampere A1) |
| RAM | 24GB |
| 디스크 | 200GB |
| 트래픽 | 10TB |
| 가격 | 무료 (평생 프리 티어) |
| 위치 | 서울, 춘천, 도쿄 등 |

선택 이유: 완전 무료입니다. 서울 리전이 있어서 레이턴시 최소.
ARM 아키텍처라 Docker 이미지가 arm64여야 합니다 (n8n은 arm64 지원함).
단, 인스턴스 생성이 어렵고(경쟁), 계정 정지 위험이 있습니다.
테스트용으로 먼저 써보고, 안정화되면 Hetzner로 이전하는 전략을 권장합니다.

### 결론

| 상황 | 추천 VPS | 월 비용 |
|------|---------|--------|
| 처음 테스트 | Oracle Free Tier | 무료 |
| 안정적 운영 | Hetzner CX32 | ~$5.39/월 |
| 여유 있게 | Contabo Cloud VPS M | ~$10/월 |
| 한국 접속 빠르게 | Contabo 일본 or Oracle 서울 | $0~$10/월 |

→ Hetzner CX32를 기본 추천합니다. 월 $5 수준에서 Remotion 렌더링까지 충분합니다.

---

## Part 2: 첫 배포 체크리스트

### Phase 0: 사전 준비 (서버 접속 전)

```
[ ] TikTok Content Posting API 심사 신청 완료 (2~4주 대기)
[ ] OpenAI API Key 발급 완료
[ ] Anthropic API Key 발급 완료
[ ] Telegram Bot 생성 + Token + Chat ID 확인
[ ] 쿠팡 파트너스 가입 + API 키 발급
[ ] Instagram 비즈니스 계정 전환 완료
[ ] Facebook 페이지 생성 + Instagram 연결
[ ] 인포크 가입 + 매니저 플랜 구독
[ ] .env 파일에 채울 값들 메모장에 정리
```

### Phase 1: 서버 생성 (10분)

```
[ ] Hetzner 계정 생성 → Cloud Console 접속
[ ] 새 서버 생성:
    - 위치: Ashburn (미국) 또는 Falkenstein (독일)
    - OS: Ubuntu 24.04
    - 타입: CX32 (4vCPU, 8GB, 80GB)
    - SSH Key 추가 (또는 비밀번호 설정)
[ ] 서버 IP 메모
[ ] SSH 접속 테스트: ssh root@서버IP
```

### Phase 2: 기본 설정 (15분)

```bash
# 서버 접속
ssh root@서버IP

# 시스템 업데이트
apt update && apt upgrade -y

# 타임존 설정
timedatectl set-timezone Asia/Seoul

# 스왑 메모리 추가 (Remotion 렌더링 시 안전)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Docker 설치
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Docker Compose 확인
docker compose version

# 방화벽 설정
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5678/tcp  # n8n (초기 설정용, 나중에 닫아도 됨)
ufw enable
```

체크:
```
[ ] SSH 접속 성공
[ ] Docker 설치 완료: docker --version
[ ] 스왑 활성화: free -h로 확인
[ ] 방화벽 설정 완료
```

### Phase 3: 프로젝트 업로드 + 설치 (20분)

```bash
# 프로젝트 디렉토리 생성
mkdir -p /opt/shopping-shorts
cd /opt/shopping-shorts

# 로컬에서 서버로 파일 전송 (로컬 터미널에서)
scp shopping-shorts-server-complete.tar.gz root@서버IP:/opt/shopping-shorts/

# 서버에서 압축 해제
cd /opt/shopping-shorts
tar xzf shopping-shorts-server-complete.tar.gz

# .env 파일 생성
cp .env.example .env
nano .env
# → 모든 API 키 입력!

# 원클릭 설치 실행
chmod +x scripts/install.sh
bash scripts/install.sh
```

체크:
```
[ ] tar 압축 해제 완료
[ ] .env 파일에 모든 키 입력 완료
[ ] docker compose build 성공 (에러 없음)
[ ] docker compose up -d 성공
[ ] docker compose ps → 3개 서비스 모두 running
```

### Phase 4: n8n 설정 (20분)

```
[ ] 브라우저에서 http://서버IP:5678 접속
[ ] n8n 로그인 (ID/PW: .env에 설정한 값)
[ ] Workflows → Import from File → n8n-openclaw-webhooks-v6.json
[ ] Credentials 설정:
    [ ] YouTube OAuth2 → Sign in with Google → 권한 허용
    [ ] Google Sheets OAuth2 → 같은 Google 계정으로 연결
[ ] 워크플로우 Active 켜기 (우상단 토글)
[ ] Webhook URL 확인: http://서버IP:5678/webhook/shopping-shorts/...
```

### Phase 5: 동작 확인 테스트 (30분)

```bash
# 1. n8n Webhook 테스트
curl -X POST http://localhost:5678/webhook/shopping-shorts/sheets-record \
  -H "Content-Type: application/json" \
  -d '{"action":"read_product_ids"}'
# → 응답이 오면 성공

# 2. Worker 컨테이너 상태 확인
docker exec shorts-worker node -v          # Node.js 버전
docker exec shorts-worker ffmpeg -version   # FFmpeg
docker exec shorts-worker yt-dlp --version  # yt-dlp
docker exec shorts-worker chromium --version # Chromium

# 3. Remotion 렌더 테스트 (기본 props로)
docker exec shorts-worker bash -c "cd /opt/remotion-shopping-shorts && npx remotion render ShoppingShorts /workspace/output/test.mp4 --log=verbose" 2>&1 | tail -20

# 4. 텔레그램 알림 테스트
docker exec shorts-worker bash -c 'curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=서버 테스트 성공!"'
```

체크:
```
[ ] Sheets Webhook 응답 성공
[ ] Worker 컨테이너 도구 모두 작동
[ ] Remotion 렌더 테스트 성공 (또는 props 없어서 에러 — 정상)
[ ] 텔레그램 알림 수신 확인
```

### Phase 6: 첫 쇼츠 생산 (수동) (5~10분)

```bash
# 전체 파이프라인 수동 실행
docker exec shorts-worker node /opt/openclaw-shopping-shorts/orchestrator.mjs

# 특정 스킬만 테스트하고 싶으면:
# Skill 1만: 상품 선정
docker exec shorts-worker node /opt/openclaw-shopping-shorts/orchestrator.mjs --from=1

# 텔레그램으로 진행 상황이 실시간으로 보고됩니다
```

체크:
```
[ ] Skill 1: 상품 선정 완료 (텔레그램 보고)
[ ] Skill 2: 대본 생성 + 검수 통과
[ ] Skill 3: TikTok 영상 다운로드 완료
[ ] Skill 4: GhostCut 클리닝 완료
[ ] Skill 5: TTS + Remotion 렌더링 완료
[ ] Skill 6: 플랫폼 배포 완료 (최소 1개 성공)
[ ] Google Sheets에 배포 기록 저장됨
[ ] 텔레그램으로 최종 보고 수신
```

### Phase 7: 인포크 DM 연결 (10분)

```
[ ] 업로드된 릴스 게시물 확인
[ ] 인포크 매니저 → 해당 게시물 선택
[ ] 키워드 설정 (예: "청소")
[ ] 팔로워/비팔로워 DM 메시지 작성
[ ] CTA 버튼: 인포크링크 URL
[ ] 활성화
[ ] 테스트: 다른 계정에서 키워드 댓글 → DM 수신 확인
```

### Phase 8: 자동 스케줄 확인 (다음 날)

```
[ ] 다음 날 09:00에 자동 실행되는지 확인
[ ] 텔레그램으로 파이프라인 시작 알림 수신
[ ] 완료 후 결과 보고 수신
[ ] 22:00에 성과 분석 실행되는지 확인
[ ] Cron 로그 확인: docker exec shorts-worker cat /workspace/logs/production.log
```

---

## Part 3: 트러블슈팅 빠른 참조

| 증상 | 원인 | 해결 |
|------|------|------|
| docker build 실패 | 네트워크/의존성 | `docker compose build --no-cache worker` |
| n8n 접속 안 됨 | 포트/방화벽 | `ufw allow 5678` + `docker logs n8n` |
| Remotion 렌더 에러 | Chromium/메모리 | 스왑 확인 + `--concurrency=1` |
| yt-dlp 다운 실패 | 버전/차단 | `docker exec shorts-worker yt-dlp -U` |
| GhostCut 콜백 안 옴 | URL 접근 불가 | `N8N_WEBHOOK_URL`이 외부 접근 가능한지 확인 |
| YouTube 업로드 403 | OAuth 만료 | n8n Credentials에서 재연결 |
| Instagram 업로드 실패 | 토큰 만료(60일) | 장기 토큰 갱신 |
| 한국어 깨짐 | 폰트 누락 | `docker exec shorts-worker fc-list \| grep -i noto` |
| 메모리 부족 | 8GB 초과 | 스왑 추가 또는 VPS 업그레이드 |
| 디스크 부족 | 영상 누적 | `find /workspace -name "*.mp4" -mtime +7 -delete` |

---

## Part 4: SSL 설정 (프로덕션용)

GhostCut 콜백이 외부에서 접근해야 하므로, 도메인 + HTTPS 설정을 권장합니다.

```bash
# 1. 도메인 A레코드 → 서버 IP 연결
# 예: n8n.mydomain.com → 서버IP

# 2. Certbot 설치 + 인증서 발급
apt install -y certbot
certbot certonly --standalone -d n8n.mydomain.com

# 3. 인증서 파일을 nginx 디렉토리에 복사
mkdir -p /opt/shopping-shorts/nginx/ssl
cp /etc/letsencrypt/live/n8n.mydomain.com/fullchain.pem /opt/shopping-shorts/nginx/ssl/
cp /etc/letsencrypt/live/n8n.mydomain.com/privkey.pem /opt/shopping-shorts/nginx/ssl/

# 4. nginx.conf에서 HTTPS 블록 주석 해제
nano /opt/shopping-shorts/nginx/nginx.conf

# 5. .env 업데이트
# N8N_WEBHOOK_URL=https://n8n.mydomain.com

# 6. 재시작
docker compose restart nginx
docker compose restart n8n

# 7. 인증서 자동 갱신 (90일마다)
crontab -e
# 추가: 0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/n8n.mydomain.com/*.pem /opt/shopping-shorts/nginx/ssl/ && docker compose restart nginx
```

---

## Part 5: 운영 명령어 모음

```bash
# 전체 서비스 상태
docker compose ps

# 로그 보기
docker compose logs -f
docker logs -f n8n
docker logs -f shorts-worker

# 수동 파이프라인 실행
docker exec shorts-worker node /opt/openclaw-shopping-shorts/orchestrator.mjs

# 성과 분석만
docker exec shorts-worker node /opt/openclaw-shopping-shorts/orchestrator.mjs --analyze

# 특정 스킬부터 재시작
docker exec shorts-worker node /opt/openclaw-shopping-shorts/orchestrator.mjs --from=3

# yt-dlp 업데이트
docker exec shorts-worker yt-dlp -U

# 디스크 정리
docker exec shorts-worker find /workspace -name "*.mp4" -mtime +7 -delete
docker system prune -f

# 서비스 재시작
docker compose restart
docker compose down && docker compose up -d

# 워커 이미지 재빌드 (코드 변경 시)
docker compose build worker && docker compose up -d worker
```
