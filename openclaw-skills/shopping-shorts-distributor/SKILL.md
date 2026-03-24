---
name: shopping-shorts-distributor
description: 4개 플랫폼(YouTube/Instagram/TikTok/Facebook)에 병렬 배포하고, 성과를 분석합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 배포 + 성과 분석

## When to Use This Skill
- "이 쇼츠를 플랫폼에 올려줘"
- "오늘 쇼츠 성과 분석해줘"
- 파이프라인 Step 6 (배포 모드)
- 매일 22:00 트리거 (분석 모드)

## 법적 필수 문구
모든 플랫폼 설명/캡션에 반드시 포함:
```
이 포스팅은 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다.
```

---

## 배포 모드

### 1. YouTube Shorts
```bash
YT_RESULT=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/deploy-youtube" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "[영상 절대경로]",
    "title": "[제목] #shorts",
    "description": "[YouTube 설명]\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다.",
    "tags": ["키워드1","키워드2","키워드3","쇼핑","추천"],
    "categoryId": "22",
    "privacyStatus": "public",
    "shorts": true
  }')
echo "$YT_RESULT"
```

### 2. Instagram Reels
```bash
IG_RESULT=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/deploy-instagram" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "[영상 절대경로]",
    "title": "[제목]",
    "caption": "[캡션]\n\n#쇼핑 #추천 #리뷰 #쇼츠\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다.",
    "mediaType": "REELS",
    "shareToFeed": true
  }')
echo "$IG_RESULT"
```

### 3. TikTok
```bash
TT_RESULT=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/deploy-tiktok" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "[영상 절대경로]",
    "caption": "[제목] #쇼핑 #추천",
    "privacyLevel": "SELF_ONLY",
    "disableComment": false
  }')
echo "$TT_RESULT"
```
> TikTok Content Posting API 심사 전까지 `privacyLevel: "SELF_ONLY"` (비공개)

### 4. Facebook Reels
```bash
FB_RESULT=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/deploy-facebook" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "[영상 절대경로]",
    "title": "[제목]",
    "description": "[설명]\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다.",
    "published": true
  }')
echo "$FB_RESULT"
```

각 플랫폼 실패 시 **5초 후 1회 재시도**. 재시도도 실패하면 해당 플랫폼만 스킵.

### 5. Google Sheets 기록
```bash
curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/sheets-record" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "write_deployment",
    "data": {
      "date": "'$(date +%Y-%m-%d)'",
      "productId": "[상품ID]",
      "productName": "[상품명]",
      "categoryId": "[카테고리]",
      "commentKeyword": "[키워드]",
      "inpockLink": "https://inpock.co.kr/[계정]",
      "youtubeUrl": "[YT URL 또는 실패]",
      "instagramUrl": "[IG URL 또는 실패]",
      "tiktokUrl": "[TT URL 또는 실패]",
      "facebookUrl": "[FB URL 또는 실패]",
      "deployStatus": "[성공수]/4",
      "scriptScore": [검수점수]
    }
  }'
```

### 6. 텔레그램 최종 보고
```bash
curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "parse_mode=HTML" \
  -d "text=🎬 <b>쇼츠 배포 완료! ([N]/4)</b>

상품: [상품명]
대본 점수: [N]/10
키워드: \"[키워드]\"

○ YouTube: [URL]
○ Instagram: [URL]
○ TikTok: [URL 또는 사유]
○ Facebook: [URL]

📌 인포크 매니저에서 키워드 DM 설정하세요
키워드: \"[키워드]\""
```

---

## 분석 모드

"성과 분석해줘" 또는 22:00 트리거 시 실행.

### 1. 성과 데이터 수집
```bash
PERF=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/sheets-record" \
  -H "Content-Type: application/json" \
  -d '{"action":"read_performance","days":7}')
echo "$PERF"
```

### 2. 분석 + 보고
수집된 데이터를 분석하여 텔레그램으로 보고:

```
📊 [일간 성과 리포트]

오늘 배포: [N]개 쇼츠
━━━━━━━━━━━━━━━
[상품명]: 조회 [N] / 댓글 [N] / 클릭 [N]

[7일 트렌드]
총 조회수: [N]
총 댓글: [N]
추정 커미션: [N]원

[인사이트]
가장 성과 좋은 카테고리: [카테고리]
패턴: [설명]

[내일 추천]
카테고리: [추천]
이유: [설명]
```

데이터 3일 미만: "아직 데이터가 부족합니다. 3일 이상 운영 후 분석이 가능합니다."
