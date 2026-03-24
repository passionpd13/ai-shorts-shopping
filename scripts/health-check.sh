#!/bin/bash
# 전체 시스템 헬스 체크

echo "🏥 쇼핑 쇼츠 시스템 헬스 체크"
echo "================================"
echo ""

# Docker services
echo "🐳 Docker 서비스 상태:"
docker compose ps 2>/dev/null || echo "  ❌ Docker Compose를 찾을 수 없습니다"
echo ""

# n8n
echo "📡 n8n Webhook 테스트:"
N8N_CODE=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null || echo "000")
echo "  n8n HTTP: $N8N_CODE"

# Worker tools
echo ""
echo "🔧 Worker 도구 확인:"
for tool in node ffmpeg yt-dlp chromium python3; do
    VER=$(docker exec shorts-worker $tool --version 2>/dev/null | head -1 || echo "NOT FOUND")
    echo "  $tool: $VER"
done

# Disk usage
echo ""
echo "💾 디스크 사용량:"
docker exec shorts-worker du -sh /opt/shopping-shorts/workspace/*/ 2>/dev/null || echo "  워커 컨테이너 접근 불가"

# Environment
echo ""
echo "🔑 환경 변수 (Worker):"
for var in N8N_BASE_URL ANTHROPIC_API_KEY OPENAI_API_KEY SUPERTONE_API_KEY TELEGRAM_BOT_TOKEN; do
    VAL=$(docker exec shorts-worker printenv $var 2>/dev/null)
    if [ -n "$VAL" ]; then
        echo "  ✓ $var 설정됨"
    else
        echo "  ❌ $var 미설정"
    fi
done

# Recent logs
echo ""
echo "📋 최근 로그 (마지막 5줄):"
docker exec shorts-worker tail -5 /opt/shopping-shorts/workspace/logs/cron.log 2>/dev/null || echo "  아직 로그 없음"

echo ""
echo "================================"
echo "헬스 체크 완료: $(date '+%Y-%m-%d %H:%M:%S')"
