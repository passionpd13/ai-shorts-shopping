---
name: shopping-shorts-cleaner
description: 영상에서 자막/워터마크를 제거(GhostCut→Pixelbin 폴백)하고 원본 음성을 스트립합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 영상 클리닝

## When to Use This Skill
- "이 영상에서 자막이랑 워터마크 제거해줘"
- 파이프라인 Step 4로 호출될 때

## 작업 디렉토리
```
/opt/shopping-shorts/workspace/cleaned/
```

## Instructions

### 1. GhostCut API로 자막+워터마크 제거
n8n Webhook을 통해 GhostCut에 작업을 제출:
```bash
TASK=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/ghostcut-clean" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoPath\": \"[소스 영상 절대경로]\",
    \"options\": {
      \"needChineseOcclude\": 1,
      \"needCrop\": 0,
      \"music\": 2
    }
  }")
echo "$TASK"
TASK_ID=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin).get('taskId',''))")
echo "Task ID: $TASK_ID"
```

### 2. 결과 폴링 (비동기 대기)
10초 간격, 최대 30회 (5분):
```bash
for i in $(seq 1 30); do
  sleep 10
  STATUS=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/ghostcut-clean" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"check_status\",\"taskId\":\"${TASK_ID}\"}")

  COMPLETED=$(echo "$STATUS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))")

  if [ "$COMPLETED" = "completed" ]; then
    CLEAN_URL=$(echo "$STATUS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('resultUrl',''))")
    echo "GhostCut 완료: $CLEAN_URL"

    # 결과 다운로드
    TIMESTAMP=$(date +%s)
    curl -sf -o "/opt/shopping-shorts/workspace/cleaned/ghostcut_${TIMESTAMP}.mp4" "$CLEAN_URL"
    break
  fi

  echo "대기 중... ($i/30)"
done
```

### 3. 폴백: GhostCut 실패 시 Pixelbin
GhostCut이 타임아웃이거나 에러면:
```bash
FALLBACK=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/ghostcut-clean" \
  -H "Content-Type: application/json" \
  -d "{\"videoPath\":\"[소스영상경로]\",\"provider\":\"pixelbin\"}")
echo "$FALLBACK"
```

Pixelbin도 실패하면 원본 영상을 그대로 사용 (자막 잔존 가능).

### 4. 음성 제거 (FFmpeg)
클리닝된 영상(또는 원본)에서 오디오를 완전 제거:
```bash
TIMESTAMP=$(date +%s)
INPUT="[클린영상 또는 원본]"
OUTPUT="/opt/shopping-shorts/workspace/cleaned/mute_${TIMESTAMP}.mp4"

# copy 모드 먼저 시도 (빠름)
ffmpeg -y -i "$INPUT" -an -c:v copy "$OUTPUT" 2>/dev/null

# copy 실패 시 재인코딩
if [ $? -ne 0 ]; then
  ffmpeg -y -i "$INPUT" -an -c:v libx264 -preset fast -crf 23 "$OUTPUT"
fi
```

### 5. 결과 검증
```bash
ffprobe -v quiet -print_format json -show_format -show_streams "$OUTPUT" | \
  python3 -c "
import json,sys
d=json.load(sys.stdin)
has_video = any(s['codec_type']=='video' for s in d.get('streams',[]))
has_audio = any(s['codec_type']=='audio' for s in d.get('streams',[]))
dur = float(d.get('format',{}).get('duration',0))
print(f'Video: {has_video}, Audio: {has_audio}, Duration: {dur:.1f}s')
assert has_video and not has_audio and dur > 5, 'Validation failed'
print('PASS')
"
```

### 6. 결과 보고
```
클리닝 완료
파일: [무음 영상 절대경로]
길이: [N]초
방법: [GhostCut / Pixelbin / 원본유지]
음성: 제거됨
```
