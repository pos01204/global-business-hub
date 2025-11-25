# 🚀 Git 저장소부터 웹 배포까지 완전 가이드

> ⚠️ **개발 경험이 없으시다면 먼저 `DEPLOYMENT_FOR_BEGINNERS.md` 파일을 읽어주세요!**
> 터미널 사용법부터 Git 기본 개념까지 초보자를 위한 상세한 설명이 있습니다.

## 📋 전체 프로세스 개요

1. Git 저장소 초기화 및 GitHub 업로드
2. Vercel로 프론트엔드 배포
3. Railway로 백엔드 배포
4. 환경 변수 설정 및 연결

---

## 1단계: Git 저장소 생성 및 GitHub 업로드

### 1-1. Git 저장소 초기화

프로젝트 루트 디렉토리에서:

```bash
# Git 초기화
git init

# .gitignore 확인 (이미 있다면 스킵)
# .gitignore 파일이 있는지 확인
```

### 1-2. 모든 파일 추가 및 커밋

```bash
# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Global Business Hub"
```

### 1-3. GitHub 저장소 생성

1. **GitHub 접속**
   - https://github.com 접속
   - 로그인

2. **새 저장소 생성**
   - 우측 상단 "+" → "New repository" 클릭
   - Repository name: `global-business-hub` (원하는 이름)
   - Description: "글로벌 비즈니스 통합 허브"
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 파일이 있으므로)
   - "Create repository" 클릭

3. **GitHub에서 제공하는 명령어 복사** (아래와 유사):
   ```bash
   git remote add origin https://github.com/your-username/global-business-hub.git
   git branch -M main
   git push -u origin main
   ```

### 1-4. 로컬 저장소를 GitHub에 푸시

이 단계는 로컬 컴퓨터에 있는 코드를 GitHub 웹사이트에 업로드하는 과정입니다.

#### 단계별 설명

**1. 원격 저장소 연결하기**

GitHub에서 저장소를 만들면, GitHub가 다음과 같은 URL을 제공합니다:
```
https://github.com/your-username/global-business-hub.git
```

이 URL을 로컬 Git에 "원격 저장소(remote)"로 등록해야 합니다.

터미널에서 실행:
```bash
git remote add origin https://github.com/your-username/global-business-hub.git
```

**의미:**
- `git remote add`: 원격 저장소를 추가하라는 명령어
- `origin`: 원격 저장소의 별명 (일반적으로 origin 사용)
- `https://github.com/...`: GitHub에서 제공한 실제 URL

**주의:** `your-username`을 본인의 GitHub 사용자명으로 변경하세요!

**확인 방법:**
```bash
git remote -v
```
이 명령어를 실행하면 연결된 원격 저장소가 표시됩니다.

---

**2. 브랜치 이름 확인 및 변경**

GitHub는 기본적으로 `main` 브랜치를 사용합니다. 로컬이 `master`를 사용 중일 수 있으므로 확인합니다.

터미널에서 실행:
```bash
git branch -M main
```

**의미:**
- `git branch`: 브랜치 관련 명령어
- `-M`: 브랜치 이름을 강제로 변경 (대문자 M)
- `main`: 변경할 브랜치 이름

**현재 브랜치 확인:**
```bash
git branch
```
현재 브랜치 앞에 `*` 표시가 있습니다.

---

**3. GitHub에 코드 업로드하기**

이제 실제로 코드를 GitHub에 업로드합니다.

터미널에서 실행:
```bash
git push -u origin main
```

**의미:**
- `git push`: 로컬 코드를 원격 저장소에 업로드
- `-u`: upstream 설정 (다음부터는 `git push`만 입력해도 됨)
- `origin`: 업로드할 원격 저장소 (위에서 설정한 origin)
- `main`: 업로드할 브랜치 이름

**처음 실행 시:**
- GitHub 로그인 창이 나타날 수 있습니다
- 브라우저에서 로그인하거나, Personal Access Token을 사용하세요

---

#### 전체 명령어 순서 (복사해서 사용)

```bash
# 1단계: 원격 저장소 연결 (URL은 본인의 것으로 변경!)
git remote add origin https://github.com/your-username/global-business-hub.git

# 2단계: 브랜치 이름 확인/변경
git branch -M main

# 3단계: GitHub에 업로드
git push -u origin main
```

#### 성공 확인 방법

1. **터미널에서 확인:**
   ```
   Enumerating objects: XX, done.
   Counting objects: 100% (XX/XX), done.
   ...
   To https://github.com/your-username/global-business-hub.git
    * [new branch]      main -> main
   ```
   위와 같은 메시지가 보이면 성공!

2. **GitHub 웹사이트에서 확인:**
   - GitHub 저장소 페이지로 이동
   - `frontend`, `backend` 폴더가 보이면 성공!
   - 파일 목록이 표시되면 정상적으로 업로드된 것입니다

#### 문제 해결

**오류: "remote origin already exists"**
```bash
# 기존 원격 저장소 제거 후 다시 추가
git remote remove origin
git remote add origin https://github.com/your-username/global-business-hub.git
```

**오류: "authentication failed"**
- GitHub Personal Access Token 필요
- Settings → Developer settings → Personal access tokens → Generate new token
- 권한: `repo` 체크
- 생성된 토큰을 비밀번호 대신 사용

**오류: "branch 'main' does not exist"**
```bash
# 먼저 커밋이 있는지 확인
git log

# 커밋이 없다면 다시 커밋
git add .
git commit -m "Initial commit"
```

---

## 2단계: Vercel로 프론트엔드 배포

### 2-1. Vercel 계정 생성

1. **Vercel 접속**
   - https://vercel.com 접속
   - "Sign Up" 클릭
   - GitHub 계정으로 로그인 (권장)

### 2-2. 프로젝트 가져오기

1. **대시보드에서 "Add New Project" 클릭**

2. **GitHub 저장소 선택**
   - 방금 만든 `global-business-hub` 저장소 선택
   - "Import" 클릭

3. **프로젝트 설정**
   
   **중요: Root Directory 설정**
   - "Root Directory" 옆 "Edit" 클릭
   - `frontend` 입력 (또는 "Browse"로 frontend 폴더 선택)
   - "Continue" 클릭

   **프레임워크 설정**
   - Framework Preset: **Next.js** (자동 감지됨)
   - Build Command: `npm run build` (자동)
   - Output Directory: `.next` (자동)
   - Install Command: `npm install` (자동)

4. **환경 변수 설정 (임시)**
   - "Environment Variables" 섹션 확장
   - 변수 추가:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: http://localhost:3001
     ```
   - (나중에 백엔드 URL로 업데이트할 예정)

5. **배포**
   - "Deploy" 클릭
   - 배포 진행 상황 확인 (약 1-2분 소요)

6. **배포 완료 확인**
   - 배포 완료 후 URL 확인 (예: `https://global-business-hub.vercel.app`)
   - "Visit" 버튼 클릭하여 사이트 확인

---

## 3단계: Railway로 백엔드 배포

### 3-1. Railway 계정 생성

1. **Railway 접속**
   - https://railway.app 접속
   - "Start a New Project" 클릭
   - GitHub 계정으로 로그인

### 3-2. 프로젝트 생성

1. **"New Project" 클릭**

2. **"Deploy from GitHub repo" 선택**

3. **저장소 선택**
   - 방금 만든 `global-business-hub` 저장소 선택

### 3-3. 서비스 추가

1. **"Add Service" → "GitHub Repo" 클릭**

2. **저장소 다시 선택** (이미 선택되어 있을 수 있음)

3. **설정 확인**
   - Railway가 자동으로 감지하지만, 확인 필요:
   - **Root Directory**: `backend` 설정
     - Settings → Root Directory → `backend` 입력

### 3-4. 환경 변수 설정

1. **"Variables" 탭 클릭**

2. **필수 환경 변수 추가:**

   ```
   PORT=3001
   NODE_ENV=production
   ```

3. **선택적 환경 변수 (기능별):**

   **OpenAI API (퍼포먼스 마케터 기능):**
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

   **Google Sheets API (대시보드 데이터):**
   ```
   GOOGLE_SHEETS_API_KEY=your-google-sheets-api-key
   GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
   ```

   **CORS 설정 (프론트엔드 URL):**
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
   (Vercel에서 받은 프론트엔드 URL 입력)

### 3-5. 도메인 생성

1. **"Settings" 탭 클릭**

2. **"Generate Domain" 클릭**
   - Railway가 자동으로 도메인 생성
   - 예: `global-business-hub-production.up.railway.app`

3. **도메인 복사** (나중에 사용)

### 3-6. 배포 확인

1. **"Deployments" 탭에서 배포 상태 확인**
   - "Building" → "Deploying" → "Active" 순서로 진행

2. **배포 완료 후 테스트**
   - 브라우저에서 다음 URL 접속:
     ```
     https://your-backend.railway.app/health
     ```
   - `{"status":"ok","message":"Global Business Hub API is running"}` 응답 확인

---

## 4단계: 프론트엔드와 백엔드 연결

### 4-1. Vercel 환경 변수 업데이트

1. **Vercel 대시보드로 돌아가기**
   - 프로젝트 선택

2. **Settings → Environment Variables**

3. **기존 환경 변수 수정**
   - `NEXT_PUBLIC_API_URL` 찾기
   - Value를 Railway 백엔드 URL로 변경:
     ```
     https://your-backend.railway.app
     ```
   - "Save" 클릭

4. **재배포**
   - "Deployments" 탭으로 이동
   - 최신 배포 옆 "..." 메뉴 → "Redeploy" 클릭
   - 또는 GitHub에 푸시하면 자동 재배포됨

### 4-2. 최종 테스트

1. **프론트엔드 사이트 접속**
   - Vercel URL 접속 (예: `https://global-business-hub.vercel.app`)

2. **기능 테스트**
   - 대시보드 로드 확인
   - 브라우저 개발자 도구(F12) → Network 탭에서 API 호출 확인
   - 오류 없이 데이터가 로드되는지 확인

---

## 🔧 문제 해결

### 문제 1: Root Directory에서 frontend가 보이지 않음

**원인:** 프로젝트가 monorepo 구조가 아닐 수 있음

**해결 방법:**

**옵션 A: Root Directory 설정**
- Vercel/Railway에서 "Root Directory"를 `frontend` 또는 `backend`로 명시적으로 설정

**옵션 B: 별도 저장소 사용 (권장)**
- 프론트엔드와 백엔드를 별도 저장소로 분리
- 각각 독립적으로 배포

**옵션 C: 프로젝트 구조 확인**
```bash
# 현재 디렉토리 구조 확인
ls -la
# frontend와 backend 폴더가 있는지 확인
```

### 문제 2: 빌드 오류

**확인 사항:**
1. 로컬에서 빌드 테스트:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. 빌드 로그 확인
3. 의존성 문제 확인

### 문제 3: CORS 오류

**해결:**
1. Railway 환경 변수에 `FRONTEND_URL` 추가
2. 백엔드 재배포
3. 프론트엔드 재배포

### 문제 4: 환경 변수가 적용되지 않음

**해결:**
1. 환경 변수 이름 확인 (대소문자 정확히)
2. 재배포 필요 (환경 변수 변경 시)
3. 빌드 시점 변수인지 런타임 변수인지 확인

---

## 📝 체크리스트

### Git 및 GitHub
- [ ] Git 저장소 초기화 (`git init`)
- [ ] 파일 추가 및 커밋 (`git add .`, `git commit`)
- [ ] GitHub 저장소 생성
- [ ] 원격 저장소 연결 (`git remote add origin`)
- [ ] GitHub에 푸시 (`git push`)

### 프론트엔드 배포 (Vercel)
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `frontend` 설정
- [ ] 환경 변수 설정 (`NEXT_PUBLIC_API_URL`)
- [ ] 배포 완료 확인

### 백엔드 배포 (Railway)
- [ ] Railway 계정 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `backend` 설정
- [ ] 환경 변수 설정 (PORT, NODE_ENV 등)
- [ ] 도메인 생성
- [ ] 배포 완료 확인

### 연결 및 테스트
- [ ] 프론트엔드 환경 변수 업데이트 (백엔드 URL)
- [ ] 재배포 완료
- [ ] 사이트 접속 테스트
- [ ] 기능 테스트

---

## 💡 팁

### 자동 배포
- GitHub에 푸시하면 Vercel과 Railway가 자동으로 재배포
- 환경 변수는 수동으로 설정 필요

### 무료 티어 제한
- **Vercel**: 무제한 (개인 프로젝트)
- **Railway**: $5 크레딧/월 (충분함)
- **Render**: 15분 비활성 시 슬리프 모드

### 보안
- 환경 변수는 절대 Git에 커밋하지 않기
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인

---

## 🎯 다음 단계

배포 완료 후:
1. 팀원들에게 URL 공유
2. 모니터링 설정 (선택사항)
3. 커스텀 도메인 설정 (선택사항)

