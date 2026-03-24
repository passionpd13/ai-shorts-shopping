---
name: shopping-shorts-sourcer
description: TikTok에서 상품 관련 영상을 검색하고 다운로드합니다. 키워드 3개를 순차 시도하고 품질을 자동 검증합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 영상 소싱

## When to Use This Skill
- "TikTok에서 [키워드] 영상 찾아줘"
- 파이프라인 Step 3로 호출될 때

## 작업 디렉토리
```
/opt/shopping-shorts/workspace/downloads/
```

## Instructions

### 1. 키워드 순차 검색
대본 스킬에서 받은 검색 키워드 3개를 순서대로 시도하세요.

```bash
KEYWORD="[키워드1]"
DOWNLOAD_DIR="/opt/shopping-shorts/workspace/downloads"
TIMESTAMP=$(date +%s)

yt-dlp "ytsearch3:${KEYWORD} 리뷰" \
  --no-playlist \
  --max-downloads 3 \
  -f "best[height>=720]" \
  -o "${DOWNLOAD_DIR}/source_${TIMESTAMP}_%(autonumber)s.%(ext)s" \
  --no-warnings \
  --socket-timeout 30 \
  --retries 3 \
  2>&1
```

결과 확인:
```bash
ls -la ${DOWNLOAD_DIR}/source_${TIMESTAMP}_*.* 2>/dev/null
```

다운로드된 파일이 없으면 다음 키워드로 시도하세요.

### 2. 품질 검증
다운로드된 각 영상을 FFprobe로 확인:
```bash
for f in ${DOWNLOAD_DIR}/source_${TIMESTAMP}_*.*; do
  echo "=== $f ==="
  ffprobe -v quiet -print_format json -show_format -show_streams "$f" 2>/dev/null | \
    python3 -c "
import json,sys
d=json.load(sys.stdin)
for s in d.get('streams',[]):
  if s.get('codec_type')=='video':
    w,h=int(s.get('width',0)),int(s.get('height',0))
    dur=float(d.get('format',{}).get('duration',0))
    ok='PASS' if min(w,h)>=720 and 15<=dur<=180 else 'FAIL'
    print(f'{w}x{h} {dur:.1f}s {ok}')
"
done
```

합격 기준:
| 항목 | 기준 |
|------|------|
| 해상도 | min(width, height) >= 720 |
| 길이 | 15초 ~ 180초 |
| 비디오 스트림 | 존재해야 함 |

### 3. 최적 영상 선택
- 여러 개 합격 시: 해상도가 가장 높은 것 선택
- 합격 영상 없으면: 다음 키워드로 이동
- 불합격 파일 삭제:
```bash
rm -f "${DOWNLOAD_DIR}/source_${TIMESTAMP}_불합격파일.mp4"
```

### 4. 결과 보고
```
영상 소싱 완료
파일: [파일 절대경로]
해상도: [W]x[H]
길이: [N]초
사용 키워드: [키워드]
```

### 5. 전체 실패 시
3개 키워드 모두 적합한 영상을 못 찾으면:
```
영상 소싱 실패: 3개 키워드 모두 적합한 영상 없음
키워드: [키워드1], [키워드2], [키워드3]
→ 이 상품을 스킵합니다.
```
다운로드된 파일 모두 정리:
```bash
rm -f ${DOWNLOAD_DIR}/source_${TIMESTAMP}_*.*
```
