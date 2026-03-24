#!/bin/bash
# 쇼핑 쇼츠 성과 분석 트리거 — Cron 22:00에서 호출

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] 성과 분석 트리거 시작"

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=📊 [자동] 오늘 쇼핑 쇼츠 성과를 분석해줘" \
        > /dev/null 2>&1
    echo "[$TIMESTAMP] 분석 트리거 전송 완료"
else
    echo "[$TIMESTAMP] ❌ TELEGRAM 환경 변수 누락"
    exit 1
fi
