# 변경 사항 반영 및 배포 가이드

## 📋 변경 사항 반영 절차

### 1. 현재 변경 사항 확인

```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
git status
```

### 2. 변경된 파일 확인

```bash
# 변경된 파일 목록 확인
git status --short

# 변경 내용 확인
git diff
```

### 3. 변경 사항 스테이징 (추가)

```bash
# 모든 변경 사항 추가
git add .

# 또는 특정 파일만 추가
git add frontend/app/marketer/page.tsx
git add backend/src/services/openaiService.ts
git add frontend/lib/api.ts
```

### 4. 커밋 (변경 사항 저장)

```bash
# 커밋 메시지와 함께 커밋
git commit -m "이미지 업로드 기반 콘텐츠 생성 기능 구현"

# 또는 더 상세한 메시지
git commit -m "feat: 이미지 업로드 및 AI 분석 기능 추가

- OpenAI Vision API 통합
- 이미지 분석 서비스 구현
- 프론트엔드 이미지 업로드 UI 추가
- 이미지 기반 마케팅 카피 자동 생성"
```

### 5. 원격 저장소에 푸시

```bash
# 현재 브랜치에 푸시
git push

# 또는 특정 브랜치에 푸시
git push origin main
# 또는
git push origin master
```

---

## 🚀 배포 프로세스

### Frontend 배포 (Vercel)

Vercel은 GitHub와 연동되어 있으면 자동으로 배포됩니다.

1. **자동 배포 (권장)**
   - `git push` 후 Vercel이 자동으로 감지
   - 빌드 및 배포 자동 실행
   - 배포 상태는 Vercel 대시보드에서 확인

2. **수동 배포**
   - Vercel 대시보드 접속
   - 프로젝트 선택 → Deployments → Redeploy

3. **환경 변수 확인**
   - Vercel Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` 확인 (백엔드 URL)

### Backend 배포 (Railway)

Railway도 GitHub와 연동되어 있으면 자동으로 배포됩니다.

1. **자동 배포 (권장)**
   - `git push` 후 Railway가 자동으로 감지
   - 빌드 및 배포 자동 실행
   - 배포 상태는 Railway 대시보드에서 확인

2. **수동 배포**
   - Railway 대시보드 접속
   - 프로젝트 선택 → Deployments → Redeploy

3. **환경 변수 확인**
   - Railway Variables에서 확인:
     - `PORT` (기본값: 3001)
     - `NODE_ENV` (production)
     - `FRONTEND_URL` (프론트엔드 URL)
     - `OPENAI_API_KEY` (OpenAI API 키)
     - `GOOGLE_SHEETS_SPREADSHEET_ID`
     - `GOOGLE_SHEETS_CLIENT_EMAIL`
     - `GOOGLE_SHEETS_PRIVATE_KEY`

---

## 🔍 배포 전 체크리스트

### Frontend 체크리스트

- [ ] `NEXT_PUBLIC_API_URL` 환경 변수 설정 확인
- [ ] TypeScript 오류 없음 (`npm run type-check`)
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 로컬에서 정상 작동 확인 (`npm run dev`)

### Backend 체크리스트

- [ ] 모든 환경 변수 설정 확인
- [ ] TypeScript 컴파일 오류 없음 (`npm run build`)
- [ ] 로컬에서 정상 작동 확인 (`npm run dev`)
- [ ] API 엔드포인트 테스트

---

## 📝 일반적인 Git 워크플로우

### 1. 작업 시작 전

```bash
# 최신 코드 가져오기
git pull origin main

# 또는 현재 브랜치
git pull
```

### 2. 작업 중

```bash
# 변경 사항 확인
git status

# 변경 내용 확인
git diff
```

### 3. 작업 완료 후

```bash
# 변경 사항 추가
git add .

# 커밋
git commit -m "작업 내용 설명"

# 푸시
git push
```

---

## ⚠️ 주의사항

1. **커밋 전 확인**
   - 변경 사항을 다시 한 번 확인
   - 불필요한 파일이 포함되지 않았는지 확인
   - `.env` 파일은 절대 커밋하지 않기

2. **커밋 메시지**
   - 명확하고 간결하게 작성
   - 무엇을 변경했는지 설명
   - 예: "feat: 이미지 업로드 기능 추가"

3. **배포 전 테스트**
   - 로컬에서 충분히 테스트
   - 빌드 오류 확인
   - 환경 변수 확인

---

## 🐛 문제 해결

### Git 오류

```bash
# 충돌 해결
git pull origin main
# 충돌 발생 시 파일 수정 후
git add .
git commit -m "충돌 해결"
git push
```

### 배포 실패

1. **Vercel 빌드 실패**
   - 빌드 로그 확인
   - TypeScript 오류 확인
   - 환경 변수 확인

2. **Railway 배포 실패**
   - 배포 로그 확인
   - Node.js 버전 확인
   - 환경 변수 확인
   - `nixpacks.toml` 확인

---

## 📚 유용한 Git 명령어

```bash
# 변경 사항 되돌리기 (아직 커밋 전)
git checkout -- 파일명

# 마지막 커밋 취소 (변경 사항 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (변경 사항 삭제)
git reset --hard HEAD~1

# 브랜치 목록 확인
git branch

# 원격 저장소 확인
git remote -v

# 커밋 히스토리 확인
git log --oneline
```

---

## 🎯 빠른 배포 명령어

```bash
# 한 번에 모든 작업 수행
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
git add .
git commit -m "변경 사항 반영"
git push
```

이후 Vercel과 Railway가 자동으로 배포를 시작합니다.





