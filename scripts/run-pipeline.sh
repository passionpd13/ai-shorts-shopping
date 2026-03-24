#!/bin/bash
# 쇼핑 쇼츠 파이프라인 트리거 — Cron에서 호출
# OpenClaw에게 텔레그램으로 파이프라인 시작 명령을 전송합니다.

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] 파이프라인 트리거 시작"

# 텔레그램으로 OpenClaw에게 명령 전송
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=🎬 [자동] 쇼핑 쇼츠 파이프라인을 지금 시작해줘" \
        > /dev/null 2>&1
    echo "[$TIMESTAMP] 텔레그램 트리거 전송 완료"
else
    echo "[$TIMESTAMP] ❌ TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 설정되지 않았습니다"
    exit 1
fi
