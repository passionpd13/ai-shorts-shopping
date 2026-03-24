---
name: shopping-shorts-producer
description: TTS 음성 생성 + Whisper 단어별 타임스탬프 + Remotion 렌더링으로 최종 쇼츠 MP4를 제작합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 영상 제작

## When to Use This Skill
- "이 대본으로 영상 만들어줘"
- 파이프라인 Step 5로 호출될 때

## 필요 입력
- 대본 텍스트 (Step 2)
- 무음 클린 영상 경로 (Step 4)
- 댓글 키워드
- 상품명

## 작업 디렉토리
```
/opt/shopping-shorts/workspace/tts/       ← TTS + 타임스탬프
/opt/shopping-shorts/workspace/output/    ← 최종 영상
```

## Instructions

### 1. Supertone TTS 음성 생성
```bash
TIMESTAMP=$(date +%s)
TTS_PATH="/opt/shopping-shorts/workspace/tts/tts_${TIMESTAMP}.mp3"

curl -sf -X POST "https://supertone.ai/api/v1/tts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPERTONE_API_KEY}" \
  -d '{
    "text": "[대본 전체 텍스트 — 타임코드 제외, 순수 텍스트만]",
    "voice": "cheerful",
    "model": "sona-2",
    "speed": 1.05,
    "language": "ko",
    "output_format": "mp3"
  }' \
  --output "$TTS_PATH"
```

TTS 길이 확인:
```bash
TTS_DURATION=$(ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$TTS_PATH")
echo "TTS 길이: ${TTS_DURATION}초"
```

**길이 조절:** 45초 이상이거나 30초 미만이면 speed를 조절해서 재생성:
```
새 speed = (실제길이 / 40) × 1.05
```

### 2. Whisper 단어별 타임스탬프 추출
```bash
TIMESTAMPS_PATH="/opt/shopping-shorts/workspace/tts/timestamps_${TIMESTAMP}.json"

curl -sf -X POST "https://api.openai.com/v1/audio/transcriptions" \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -F file=@"$TTS_PATH" \
  -F model="whisper-1" \
  -F language="ko" \
  -F response_format="verbose_json" \
  -F "timestamp_granularities[]=word" \
  > "$TIMESTAMPS_PATH"
```

결과 확인:
```bash
python3 -c "
import json
d=json.load(open('$TIMESTAMPS_PATH'))
words=d.get('words',[])
print(f'단어 수: {len(words)}')
for w in words[:5]:
    print(f'  {w[\"word\"]} [{w[\"start\"]:.2f}-{w[\"end\"]:.2f}]')
print('...')
"
```

### 3. Remotion 입력 JSON 생성
```bash
REMOTION_INPUT="/opt/shopping-shorts/workspace/output/remotion_input_${TIMESTAMP}.json"

python3 << 'PYEOF'
import json

timestamps = json.load(open("TIMESTAMPS_PATH_PLACEHOLDER"))
words = timestamps.get("words", [])

input_data = {
    "script": "SCRIPT_TEXT_PLACEHOLDER",
    "commentKeyword": "KEYWORD_PLACEHOLDER",
    "productName": "PRODUCT_PLACEHOLDER",
    "timestamps": words,
    "ttsDuration": TTS_DURATION_PLACEHOLDER,
    "ttsPath": "TTS_PATH_PLACEHOLDER",
    "videoPath": "CLEAN_VIDEO_PLACEHOLDER",
    "outputWidth": 1080,
    "outputHeight": 1920,
    "fps": 30
}

with open("REMOTION_INPUT_PLACEHOLDER", "w") as f:
    json.dump(input_data, f, ensure_ascii=False, indent=2)

print(f"Remotion input 생성: {len(words)} words, {input_data['ttsDuration']}s")
PYEOF
```

위 스크립트의 PLACEHOLDER들을 실제 값으로 교체해서 실행하세요.

### 4. Remotion 렌더링
```bash
OUTPUT_PATH="/opt/shopping-shorts/workspace/output/shorts_${TIMESTAMP}.mp4"

cd /opt/shopping-shorts/remotion && \
npx remotion render ShoppingShorts \
  "$OUTPUT_PATH" \
  --props="$REMOTION_INPUT" \
  --codec=h264 \
  --concurrency=2 \
  --log=error \
  2>&1

# 실패 시 concurrency=1로 재시도
if [ $? -ne 0 ]; then
  echo "Remotion 재시도 (concurrency=1)..."
  npx remotion render ShoppingShorts \
    "$OUTPUT_PATH" \
    --props="$REMOTION_INPUT" \
    --codec=h264 \
    --concurrency=1 \
    --log=verbose \
    2>&1
fi
```

### 5. Remotion 실패 시 FFmpeg 폴백
2회 모두 실패하면 FFmpeg로 단순 합성:
```bash
ffmpeg -y \
  -stream_loop -1 -i "[클린영상]" \
  -i "$TTS_PATH" \
  -shortest \
  -c:v libx264 -preset fast -crf 23 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "$OUTPUT_PATH"
```

### 6. 출력 검증
```bash
python3 << 'PYEOF'
import json, subprocess, os

result = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", "OUTPUT_PATH_PLACEHOLDER"],
    capture_output=True, text=True
)
d = json.loads(result.stdout)

has_video = any(s["codec_type"] == "video" for s in d.get("streams", []))
has_audio = any(s["codec_type"] == "audio" for s in d.get("streams", []))
duration = float(d.get("format", {}).get("duration", 0))
size_mb = os.path.getsize("OUTPUT_PATH_PLACEHOLDER") / (1024 * 1024)

print(f"Video: {has_video}, Audio: {has_audio}")
print(f"Duration: {duration:.1f}s, Size: {size_mb:.1f}MB")

assert has_video and has_audio, "Missing streams"
assert duration >= 20, f"Too short: {duration}s"
assert size_mb >= 0.5, f"Too small: {size_mb}MB"
print("PASS")
PYEOF
```

### 7. 결과 보고
```
영상 제작 완료
파일: [출력 절대경로]
길이: [N]초
해상도: 1080x1920
크기: [N]MB
렌더: [Remotion / FFmpeg 폴백]
TTS 길이: [N]초
단어 수: [N]개
```
