---
name: shopping-shorts-scout
description: 쿠팡 베스트 상품을 자율적으로 선정합니다. 과거 성과 데이터를 분석해서 최적의 카테고리와 상품을 선택합니다.
version: 1.0.0
author: passionpd
---

# 쇼핑 쇼츠 상품 스카우트

## When to Use This Skill
- "쿠팡에서 오늘 상품 찾아줘"
- "쇼핑 쇼츠용 상품 선정해줘"
- 파이프라인 Step 1로 호출될 때

## 설정
- n8n Webhook: `${N8N_BASE_URL}/webhook/shopping-shorts/`
- 카테고리: 뷰티(1010), 주방(1013), 생활(1014), 건강(1024), 가전(1019), 패션(1020)

## Instructions

### 1. 과거 성과 데이터 확인
먼저 이전에 어떤 카테고리가 잘 됐는지 확인하세요:
```bash
PERF=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/sheets-record" \
  -H "Content-Type: application/json" \
  -d '{"action":"read_performance","days":30}')
echo "$PERF"
```

응답에서 카테고리별 조회수/댓글수/클릭수를 분석하세요.
- 전환율(클릭/조회)이 높은 카테고리 3개를 우선 선택
- 데이터 없으면(첫 실행) 기본 순서: **생활 → 주방 → 뷰티**

### 2. 쿠팡 베스트 상품 조회
```bash
PRODUCTS=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/coupang-search" \
  -H "Content-Type: application/json" \
  -d '{"action":"best_products","categoryId":"1014","limit":10}')
echo "$PRODUCTS"
```
각 카테고리에서 10개씩 가져옵니다.

### 3. 기존 상품 제외 (중복 방지)
```bash
EXISTING=$(curl -sf -X POST "${N8N_BASE_URL}/webhook/shopping-shorts/sheets-record" \
  -H "Content-Type: application/json" \
  -d '{"action":"read_product_ids"}')
echo "$EXISTING"
```
응답의 productIds와 겹치는 상품을 제외하세요.

### 4. 최적 상품 선택 (자율 판단)
남은 후보 중에서 아래 기준으로 **1개**를 선택하세요:

| 기준 | 가중치 | 설명 |
|------|--------|------|
| 시각적 차이 | 30% | 사용 전/후가 뚜렷해야 대본이 강력함 |
| 가격대 | 25% | 1만~5만원 (충동구매 가능 범위) |
| 리뷰 수 | 25% | 검증된 제품일수록 안전 |
| 영상 소싱 용이성 | 20% | TikTok에 관련 영상이 있을 법한 상품 |

### 5. 댓글 키워드 결정
상품과 관련되면서 일상적인 **1~2글자** 단어:
- 청소기 → "청소"
- 이어폰 → "음악"
- 텀블러 → "커피"
- 비타민 → "건강"
- 크림 → "피부"
- 블렌더 → "요리"
- 조명 → "분위기"

### 6. 결과 출력
```
상품: [상품명]
상품ID: [쿠팡 상품 ID]
카테고리: [카테고리명]
가격대: [X만원대]
선정 이유: [1~2문장]
검색 키워드: [키워드1, 키워드2, 키워드3]
댓글 키워드: [1~2글자]
```

### 7. 실패 시
- 선택 카테고리에 새 상품 없음 → 나머지 카테고리 순차 조회
- 모든 카테고리 소진 → "오늘은 새 상품이 없습니다. 스킵합니다." 보고
- n8n Webhook 응답 없음 → 5초 후 1회 재시도
