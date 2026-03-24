#!/bin/bash
# 텔레그램 연결 테스트

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 설정되지 않았습니다"
    exit 1
fi

RESULT=$(curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=✅ 쇼핑 쇼츠 시스템 연결 테스트 성공! ($(date '+%Y-%m-%d %H:%M'))" \
    2>&1)

if echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d.get('ok')" 2>/dev/null; then
    echo "✅ 텔레그램 메시지 전송 성공"
else
    echo "❌ 전송 실패: $RESULT"
    exit 1
fi
