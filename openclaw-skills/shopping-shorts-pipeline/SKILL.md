---
name: shopping-shorts-pipeline
description: 쇼핑 쇼츠 자동화 파이프라인 오케스트레이터. "쇼핑 쇼츠 파이프라인 시작", "오늘 쇼츠 만들어줘" 등의 요청에 반응합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 자동화 파이프라인 오케스트레이터

## When to Use This Skill
사용자가 다음과 같이 요청할 때:
- "쇼핑 쇼츠 파이프라인을 시작해줘"
- "오늘 쇼츠 만들어줘"
- "쇼핑 쇼츠 생산해줘"
- 매일 09:00 cron 트리거

## Overview
6단계 파이프라인을 순서대로 실행합니다. 각 단계의 출력이 다음 단계의 입력이 됩니다.

## 환경 변수 확인
실행 전 반드시 `/opt/shopping-shorts/config/settings.json` 파일과 환경 변수를 확인하세요:
```bash
cat /opt/shopping-shorts/config/settings.json
echo "N8N: $N8N_BASE_URL"
echo "ANTHROPIC: ${ANTHROPIC_API_KEY:0:10}..."
echo "OPENAI: ${OPENAI_API_KEY:0:10}..."
```

## Pipeline Steps

### Step 1: 상품 스카우트 (shopping-shorts-scout)
쿠팡 베스트에서 오늘의 상품을 자율 선정합니다.

**입력:** 없음 (과거 성과 데이터 자동 참조)
**출력:** 상품명, 카테고리, 검색 키워드 3개, 댓글 키워드

이 스킬을 호출하고 결과를 변수에 저장하세요:
```
PRODUCT_NAME="[상품명]"
CATEGORY="[카테고리]"
SEARCH_KEYWORDS="[키워드1, 키워드2, 키워드3]"
COMMENT_KEYWORD="[댓글키워드]"
```

### Step 2: 대본 작성 (shopping-shorts-writer)
40초 쇼핑 대본을 생성하고 자체 검수합니다.

**입력:** Step 1의 상품 정보
**출력:** 대본 텍스트, 검수 점수, 메타데이터

```
SCRIPT_TEXT="[대본 전체]"
SCRIPT_SCORE=[점수]
YT_TITLE="[YouTube 제목]"
IG_CAPTION="[Instagram 캡션]"
```

### Step 3: 영상 소싱 (shopping-shorts-sourcer)
TikTok에서 상품 관련 영상을 다운로드합니다.

**입력:** Step 2의 검색 키워드
**출력:** 다운로드된 영상 경로

```
SOURCE_VIDEO="[영상 파일 경로]"
```

### Step 4: 영상 클리닝 (shopping-shorts-cleaner)
자막/워터마크 제거 + 음성 스트립.

**입력:** Step 3의 영상 파일
**출력:** 무음 클린 영상 경로

```
CLEAN_VIDEO="[클린 영상 경로]"
```

### Step 5: 영상 제작 (shopping-shorts-producer)
TTS + Whisper 타임스탬프 + Remotion 렌더링.

**입력:** Step 2의 대본 + Step 4의 클린 영상
**출력:** 완성된 쇼츠 MP4

```
FINAL_VIDEO="[최종 MP4 경로]"
```

### Step 6: 배포 (shopping-shorts-distributor)
4개 플랫폼 배포 + Sheets 기록 + 텔레그램 보고.

**입력:** Step 5의 영상 + Step 2의 메타데이터
**출력:** 배포 URL들

## 진행 보고
각 단계 완료 시 텔레그램으로 보고하세요:
```bash
curl -sf "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=✓ Step N 완료: [요약]"
```

보고 형식:
```
🎬 쇼핑 쇼츠 파이프라인 시작

✓ Step 1: [상품명] 선정 (카테고리: [카테고리])
✓ Step 2: 대본 [X]점/10 ([Y]자)
✓ Step 3: 영상 소싱 ([해상도], [길이]초)
✓ Step 4: 클리닝 완료 ([방법])
✓ Step 5: 렌더링 완료 ([길이]초, [크기]MB)
✓ Step 6: [N]/4 플랫폼 배포 성공

🏁 파이프라인 완료! 소요시간: [N]분
```

## 에러 처리
- 각 단계 실패 → 1회 재시도
- 2회 연속 실패 → 텔레그램으로 에러 보고 후 중단
- Step 1 실패 → 카테고리 확장 후 재시도
- Step 3 실패 → 이 상품 스킵, Step 1부터 새 상품으로
- `--from=N` 플래그로 특정 단계부터 재시작 가능

## 성과 분석 모드
"성과 분석해줘" 또는 매일 22:00 트리거 시:
```
shopping-shorts-distributor 스킬의 분석 모드를 실행하세요.
```

## 작업 디렉토리
```
/opt/shopping-shorts/workspace/
├── downloads/    ← Step 3 다운로드
├── cleaned/      ← Step 4 클리닝 결과
├── tts/          ← Step 5 TTS + 타임스탬프
├── output/       ← Step 5 최종 영상
└── logs/         ← 실행 로그
```

매 실행 시작 전에 이전 작업물을 정리하세요:
```bash
find /opt/shopping-shorts/workspace/downloads -name "*.mp4" -mtime +3 -delete 2>/dev/null
find /opt/shopping-shorts/workspace/cleaned -name "*.mp4" -mtime +3 -delete 2>/dev/null
find /opt/shopping-shorts/workspace/tts -name "*.mp3" -mtime +3 -delete 2>/dev/null
```
