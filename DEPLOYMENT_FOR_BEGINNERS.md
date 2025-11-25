# 🌟 완전 초보자를 위한 웹 배포 가이드

> 개발 경험이 전혀 없어도 따라할 수 있는 단계별 가이드입니다.

---

## 📚 기본 개념 이해하기

### 터미널이란?

**터미널(Terminal)**은 컴퓨터에게 명령어로 지시할 수 있는 창입니다.

**비유로 이해하기:**
- 일반 프로그램: 마우스로 클릭하는 방식 (예: 파일 탐색기)
- 터미널: 키보드로 명령어를 입력하는 방식 (예: 명령 프롬프트)

**왜 사용하나요?**
- 개발자들이 자주 사용하는 도구
- Git, 배포 등은 터미널로 해야 함
- 처음엔 어렵지만 익숙해지면 빠름

---

## 🖥️ Windows에서 터미널 열기

### 방법 1: PowerShell (권장)

1. **Windows 키 누르기** (키보드 왼쪽 하단)
2. **"powershell" 입력**
3. **"Windows PowerShell" 클릭**

또는

1. **Windows 키 + R** 동시에 누르기
2. **"powershell" 입력**
3. **Enter 키 누르기**

### 방법 2: 명령 프롬프트 (CMD)

1. **Windows 키 누르기**
2. **"cmd" 입력**
3. **"명령 프롬프트" 클릭**

### 터미널 창 확인

터미널이 열리면 다음과 같은 화면이 보입니다:

```
PS C:\Users\사용자명>
```

또는

```
C:\Users\사용자명>
```

이것이 터미널입니다! 여기에 명령어를 입력합니다.

---

## 📂 기본 터미널 명령어

### 1. 현재 위치 확인하기

**명령어:**
```bash
pwd
```

또는 (Windows PowerShell)
```powershell
Get-Location
```

**또는 간단하게:**
```bash
cd
```

**의미:** 지금 어느 폴더에 있는지 보여줍니다.

**예시 결과:**
```
C:\Users\김지훈\Desktop
```

---

### 2. 폴더 이동하기

**명령어:**
```bash
cd 폴더이름
```

**의미:** 다른 폴더로 이동합니다.

**예시:**
```bash
cd Desktop
```
→ 바탕화면 폴더로 이동

```bash
cd "AI 자동화"
```
→ "AI 자동화" 폴더로 이동 (띄어쓰기가 있으면 따옴표 필요)

**특수 명령어:**
```bash
cd ..
```
→ 상위 폴더로 이동 (뒤로 가기)

```bash
cd \
```
→ C 드라이브 최상위로 이동

---

### 3. 폴더 안의 파일 보기

**명령어:**
```bash
dir
```

또는 (PowerShell)
```powershell
ls
```

**의미:** 현재 폴더에 있는 파일과 폴더 목록을 보여줍니다.

**예시 결과:**
```
    디렉터리: C:\Users\김지훈\Desktop

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        2024-01-15     10:30                AI 자동화
d-----        2024-01-15     11:00                고도화 작업
```

`d-----`는 폴더, 파일은 길이(Size)가 표시됩니다.

---

### 4. 프로젝트 폴더로 이동하기

**목표:** 프로젝트가 있는 폴더로 이동

**단계별 예시:**

```bash
# 1. 바탕화면으로 이동
cd Desktop

# 2. "AI 자동화" 폴더로 이동
cd "AI 자동화"

# 3. "고도화 작업" 폴더로 이동
cd "고도화 작업"
```

**한 번에 이동하기:**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
```

**팁:** 폴더 경로를 복사해서 붙여넣으면 됩니다!

---

## 🔧 Git 설치 확인하기

### Git이 설치되어 있는지 확인

터미널에서 다음 명령어 입력:

```bash
git --version
```

**결과 확인:**

✅ **설치되어 있으면:**
```
git version 2.40.0
```
→ 버전 번호가 보이면 설치됨!

❌ **설치되어 있지 않으면:**
```
'git'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```
→ Git 설치 필요

### Git 설치하기 (필요한 경우)

⚠️ **이 오류가 나오면 Git 설치가 필요합니다:**
```
'git'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```

**자세한 설치 방법은 `GIT_INSTALLATION_GUIDE.md` 파일을 참고하세요!**

**빠른 설치 방법:**

1. **브라우저에서 접속:**
   - https://git-scm.com/download/win
   - 자동으로 다운로드가 시작됩니다

2. **설치 파일 실행:**
   - 다운로드 폴더에서 `Git-2.xx.x-64-bit.exe` 파일 더블클릭

3. **설치:**
   - "Next" 버튼을 계속 클릭 (기본 설정으로 설치)
   - ⚠️ **중요:** "PATH 환경 변수" 설정에서
     - "Git from the command line and also from 3rd-party software" 선택
   - 설치 완료

4. **터미널 재시작:**
   - 기존 터미널 창 완전히 닫기
   - 새로 PowerShell 열기

5. **재확인:**
   ```bash
   git --version
   ```
   - 버전 번호가 보이면 성공! (예: `git version 2.40.0`)

---

## 📝 Git 사용하기 (초보자용)

### Git이란?

**Git**은 코드 버전 관리 도구입니다.

**비유:**
- Google 드라이브처럼 코드를 저장하고 공유하는 도구
- 변경 이력을 추적할 수 있음
- 여러 사람이 함께 작업할 수 있음

### Git 기본 명령어

#### 1. Git 초기화

**의미:** 현재 폴더를 Git 저장소로 만듭니다.

**명령어:**
```bash
git init
```

**실행 위치:** 프로젝트 폴더 안에서 실행

**예시:**
```bash
# 프로젝트 폴더로 이동
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"

# Git 초기화
git init
```

**결과:**
```
Initialized empty Git repository in C:/Users/.../.git/
```

---

#### 2. 파일 추가하기

**의미:** 변경된 파일들을 Git이 추적하도록 추가합니다.

**명령어:**
```bash
git add .
```

**의미:**
- `git add`: 파일 추가 명령어
- `.`: 현재 폴더의 모든 파일 (점 하나)

**예시:**
```bash
git add .
```

**결과:** 아무 메시지가 없으면 정상입니다.

---

#### 3. 커밋하기 (저장하기)

**의미:** 변경사항을 저장합니다. (사진 찍는 것과 비슷)

**명령어:**
```bash
git commit -m "메시지"
```

**의미:**
- `git commit`: 저장 명령어
- `-m`: 메시지를 함께 입력
- `"메시지"`: 무엇을 변경했는지 설명

**예시:**
```bash
git commit -m "Initial commit: Global Business Hub"
```

**결과:**
```
[main (root-commit) abc1234] Initial commit: Global Business Hub
 50 files changed, 5000 insertions(+)
```

---

## 🌐 GitHub 사용하기

### GitHub란?

**GitHub**는 코드를 저장하고 공유하는 웹사이트입니다.

**비유:**
- Google 드라이브의 코드 버전
- 다른 사람들과 코드를 공유할 수 있음
- 웹 배포를 위해 필요함

### GitHub 계정 만들기

1. **브라우저에서 접속:**
   - https://github.com

2. **회원가입:**
   - "Sign up" 클릭
   - 사용자명, 이메일, 비밀번호 입력
   - 이메일 인증 완료

3. **로그인:**
   - "Sign in" 클릭
   - 계정 정보 입력

---

### GitHub에 저장소 만들기

**저장소(Repository)** = 프로젝트를 저장하는 공간

**단계:**

1. **GitHub 웹사이트 접속**
   - https://github.com 로그인

2. **새 저장소 만들기**
   - 우측 상단 **"+"** 아이콘 클릭
   - **"New repository"** 클릭

3. **저장소 정보 입력**
   - **Repository name**: `global-business-hub` (원하는 이름)
   - **Description**: "글로벌 비즈니스 통합 허브" (선택사항)
   - **Public** 또는 **Private** 선택
     - Public: 누구나 볼 수 있음
     - Private: 나만 볼 수 있음
   - ⚠️ **"Initialize this repository with a README" 체크 해제**
     - (이미 파일이 있으므로 체크하면 안 됨!)

4. **"Create repository" 클릭**

5. **다음 화면 확인**
   - GitHub가 명령어를 보여줍니다
   - 이 명령어들을 복사해둡니다

---

### 로컬 코드를 GitHub에 업로드하기

**목표:** 컴퓨터에 있는 코드를 GitHub 웹사이트에 올리기

#### 단계 1: 원격 저장소 연결

**의미:** GitHub 저장소 주소를 컴퓨터에 등록

**명령어:**
```bash
git remote add origin https://github.com/사용자명/global-business-hub.git
```

**주의사항:**
- `사용자명`을 본인의 GitHub 사용자명으로 변경!
- 예: 사용자명이 `jihunkim`이면
  ```bash
  git remote add origin https://github.com/jihunkim/global-business-hub.git
  ```

**실행:**
1. 터미널 열기
2. 프로젝트 폴더로 이동
3. 위 명령어 입력 (사용자명 변경 후)
4. Enter 키 누르기

**확인:**
```bash
git remote -v
```

**결과:**
```
origin  https://github.com/사용자명/global-business-hub.git (fetch)
origin  https://github.com/사용자명/global-business-hub.git (push)
```
→ 이렇게 보이면 성공!

---

#### 단계 2: 브랜치 이름 확인

**의미:** 코드의 버전 이름을 확인하고 변경

**명령어:**
```bash
git branch -M main
```

**실행:**
1. 터미널에 입력
2. Enter 키 누르기

**결과:** 아무 메시지가 없으면 정상입니다.

---

#### 단계 3: GitHub에 업로드

**의미:** 실제로 코드를 GitHub에 올리기

**명령어:**
```bash
git push -u origin main
```

**실행:**
1. 터미널에 입력
2. Enter 키 누르기

**처음 실행 시:**
- GitHub 로그인 창이 나타날 수 있습니다
- 브라우저에서 로그인하거나
- Personal Access Token 사용 (아래 참고)

**성공 확인:**
터미널에 다음과 같은 메시지가 보이면 성공:
```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
...
To https://github.com/사용자명/global-business-hub.git
 * [new branch]      main -> main
```

**GitHub 웹사이트에서 확인:**
- 저장소 페이지로 이동
- `frontend`, `backend` 폴더가 보이면 성공!

---

## 🔐 GitHub 인증 (Personal Access Token)

### 왜 필요한가요?

GitHub에 업로드할 때 비밀번호 대신 사용하는 보안 키입니다.

### 토큰 만들기

1. **GitHub 웹사이트 접속**
   - https://github.com 로그인

2. **설정으로 이동**
   - 우측 상단 프로필 사진 클릭
   - **"Settings"** 클릭

3. **Developer settings**
   - 왼쪽 메뉴 맨 아래 **"Developer settings"** 클릭

4. **Personal access tokens**
   - **"Personal access tokens"** 클릭
   - **"Tokens (classic)"** 클릭

5. **새 토큰 생성**
   - **"Generate new token"** 클릭
   - **"Generate new token (classic)"** 클릭

6. **토큰 설정**
   - **Note**: `배포용 토큰` (원하는 이름)
   - **Expiration**: `90 days` (원하는 기간)
   - **Select scopes**: `repo` 체크 (모든 항목 체크됨)

7. **생성**
   - 맨 아래 **"Generate token"** 클릭

8. **토큰 복사**
   - ⚠️ **이 화면에서만 볼 수 있으므로 반드시 복사!**
   - `ghp_xxxxxxxxxxxxxxxxxxxx` 형태의 긴 문자열

### 토큰 사용하기

`git push` 실행 시:
- Username: GitHub 사용자명 입력
- Password: 비밀번호 대신 **토큰 붙여넣기**

---

## 📋 전체 실행 순서 요약

### 준비 단계

1. ✅ 터미널 열기 (PowerShell)
2. ✅ Git 설치 확인 (`git --version`)
3. ✅ GitHub 계정 만들기
4. ✅ Personal Access Token 만들기

### 실행 단계

**1. 프로젝트 폴더로 이동**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
```

**2. Git 초기화**
```bash
git init
```

**3. 파일 추가**
```bash
git add .
```

**4. 커밋**
```bash
git commit -m "Initial commit: Global Business Hub"
```

**5. GitHub 저장소 만들기** (웹사이트에서)

**6. 원격 저장소 연결** (사용자명 변경!)
```bash
git remote add origin https://github.com/사용자명/global-business-hub.git
```

**7. 브랜치 이름 변경**
```bash
git branch -M main
```

**8. GitHub에 업로드**
```bash
git push -u origin main
```
→ 사용자명과 토큰 입력

---

## ❓ 자주 묻는 질문

### Q1: 터미널에서 한글 입력이 안 돼요

**해결:**
- 영문으로만 입력하거나
- 복사-붙여넣기 사용

### Q2: 명령어를 잘못 입력했어요

**해결:**
- `Ctrl + C` 누르면 취소됨
- 다시 올바른 명령어 입력

### Q3: "command not found" 오류가 나요

**해결:**
- 명령어 철자 확인
- 대소문자 확인
- Git이 설치되어 있는지 확인

### Q4: 폴더 경로에 한글이 있어도 되나요?

**해결:**
- 되지만, 따옴표로 감싸야 함
- 예: `cd "AI 자동화"`

### Q5: GitHub에 업로드가 안 돼요

**해결:**
- Personal Access Token 사용했는지 확인
- 사용자명이 올바른지 확인
- 인터넷 연결 확인

---

## 🎯 다음 단계

GitHub에 코드가 업로드되면:
1. ✅ Vercel로 프론트엔드 배포
2. ✅ Railway로 백엔드 배포
3. ✅ 환경 변수 설정

다음 가이드를 참고하세요:
- `DEPLOYMENT_STEP_BY_STEP.md` (2단계부터)

---

## 💡 팁

- **복사-붙여넣기 활용:** 명령어는 복사해서 붙여넣으면 됩니다
- **오류 메시지 읽기:** 오류가 나면 메시지를 읽어보세요 (영어지만 힌트가 있습니다)
- **차근차근:** 한 단계씩 천천히 진행하세요
- **저장:** 중요한 단계마다 결과를 확인하세요

