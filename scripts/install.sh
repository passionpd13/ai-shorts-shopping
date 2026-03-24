#!/bin/bash
set -e

echo "=========================================="
echo "  쇼핑 쇼츠 자동화 — 설치 스크립트"
echo "=========================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker가 설치되어 있지 않습니다. 먼저 Docker를 설치하세요."; exit 1; }
command -v docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose가 필요합니다."; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "📁 프로젝트 디렉토리: $PROJECT_DIR"

# Check .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다."
        cp .env.example .env
        echo "📝 .env 파일을 열어 API 키를 입력하세요: nano $PROJECT_DIR/.env"
        echo "   입력 후 다시 이 스크립트를 실행하세요."
        exit 0
    else
        echo "❌ .env.example 파일을 찾을 수 없습니다."
        exit 1
    fi
fi

echo ""
echo "🔑 환경 변수 확인 중..."
source .env

MISSING=0
for var in ANTHROPIC_API_KEY OPENAI_API_KEY TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
    if [ -z "${!var}" ]; then
        echo "  ❌ $var 가 비어있습니다"
        MISSING=1
    else
        echo "  ✓ $var 설정됨"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "⚠️  필수 환경 변수가 비어있습니다. .env 파일을 수정하세요."
    echo "   최소 필수: ANTHROPIC_API_KEY, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
    exit 1
fi

# Create workspace directories
echo ""
echo "📂 워크스페이스 디렉토리 생성..."
mkdir -p workspace/{downloads,cleaned,tts,output,logs}
mkdir -p nginx/ssl

# Build and start
echo ""
echo "🐳 Docker 이미지 빌드 중... (최초 5~10분 소요)"
docker compose build --no-cache

echo ""
echo "🚀 서비스 시작..."
docker compose up -d

echo ""
echo "⏳ n8n 시작 대기 중..."
sleep 10

# Health check
echo ""
echo "🏥 헬스 체크..."
N8N_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null || echo "000")
if [ "$N8N_STATUS" = "200" ] || [ "$N8N_STATUS" = "301" ] || [ "$N8N_STATUS" = "302" ]; then
    echo "  ✓ n8n 정상 (HTTP $N8N_STATUS)"
else
    echo "  ⚠️  n8n 응답 없음 (HTTP $N8N_STATUS) — 잠시 후 재시도"
fi

WORKER_STATUS=$(docker inspect -f '{{.State.Running}}' shorts-worker 2>/dev/null || echo "false")
if [ "$WORKER_STATUS" = "true" ]; then
    echo "  ✓ Worker 컨테이너 실행 중"
else
    echo "  ⚠️  Worker 컨테이너가 실행되지 않았습니다"
fi

echo ""
echo "=========================================="
echo "  ✅ 설치 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "  1. n8n 접속: http://localhost:5678"
echo "  2. 워크플로우 임포트: n8n/workflow-shopping-shorts.json"
echo "  3. YouTube/Sheets OAuth2 연결"
echo "  4. 워크플로우 Active 켜기"
echo ""
echo "OpenClaw 스킬 테스트:"
echo "  docker exec -it shorts-worker bash"
echo "  cd /opt/shopping-shorts"
echo ""
echo "텔레그램 알림 테스트:"
echo "  docker exec shorts-worker bash scripts/test-telegram.sh"
echo ""
