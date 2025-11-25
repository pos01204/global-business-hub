# 🔧 Git 설치 가이드 (Windows)

## 오류 메시지 의미

```
'git'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
```

이 메시지는 **Git이 설치되어 있지 않다**는 의미입니다.

---

## ✅ 해결 방법: Git 설치하기

### 방법 1: 공식 웹사이트에서 설치 (권장)

#### 1단계: Git 다운로드

1. **브라우저 열기**
   - Chrome, Edge 등 아무 브라우저나 사용

2. **Git 공식 웹사이트 접속**
   - 주소창에 입력: `https://git-scm.com/download/win`
   - 또는 검색: "git windows download"

3. **자동 다운로드 시작**
   - 웹사이트 접속 시 자동으로 다운로드가 시작됩니다
   - 다운로드 폴더에 `Git-2.xx.x-64-bit.exe` 파일이 생성됩니다

#### 2단계: Git 설치

1. **다운로드한 파일 실행**
   - 다운로드 폴더로 이동
   - `Git-2.xx.x-64-bit.exe` 파일 더블클릭

2. **설치 마법사 시작**
   - "Next" 버튼을 계속 클릭하면 됩니다
   - 대부분 기본 설정으로 설치하면 됩니다

3. **중요한 설정 단계들:**

   **설정 1: 설치 경로**
   - 기본 경로 그대로 두고 "Next"
   - 예: `C:\Program Files\Git`

   **설정 2: 구성 요소 선택**
   - 기본 선택 그대로 두고 "Next"
   - (모두 체크되어 있으면 그대로)

   **설정 3: 기본 편집기 선택**
   - "Use Visual Studio Code as Git's default editor" 선택 (VS Code 사용 시)
   - 또는 "Use Notepad as Git's default editor" (간단하게)
   - "Next"

   **설정 4: 기본 브랜치 이름**
   - "Let Git decide" 선택 (권장)
   - "Next"

   **설정 5: PATH 환경 변수**
   - ⚠️ **중요:** "Git from the command line and also from 3rd-party software" 선택
   - 이렇게 해야 터미널에서 `git` 명령어를 사용할 수 있습니다
   - "Next"

   **설정 6: HTTPS 전송**
   - "Use the OpenSSL library" 선택 (기본값)
   - "Next"

   **설정 7: 줄 끝 처리**
   - "Checkout Windows-style, commit Unix-style line endings" 선택 (기본값)
   - "Next"

   **설정 8: 터미널 에뮬레이터**
   - "Use Windows' default console window" 선택 (기본값)
   - "Next"

   **설정 9: 기본 동작**
   - "Default (fast-forward or merge)" 선택 (기본값)
   - "Next"

   **설정 10: 자격 증명 도우미**
   - "Git Credential Manager" 선택 (기본값)
   - "Next"

   **설정 11: 추가 옵션**
   - 기본 선택 그대로 "Next"

   **설정 12: 실험적 기능**
   - 체크 해제 (기본값)
   - "Install" 클릭

4. **설치 진행**
   - 설치가 진행됩니다 (1-2분 소요)
   - "Finish" 버튼이 나타나면 클릭

#### 3단계: 설치 확인

1. **터미널 재시작**
   - 기존 터미널 창 닫기
   - 새로 PowerShell 열기

2. **Git 버전 확인**
   ```bash
   git --version
   ```

3. **성공 확인**
   - 다음과 같은 메시지가 보이면 성공:
     ```
     git version 2.40.0
     ```
   - 버전 번호가 다를 수 있지만, 숫자가 보이면 정상입니다!

---

### 방법 2: Winget 사용 (Windows 11)

Windows 11을 사용하시는 경우:

1. **터미널 열기** (PowerShell)

2. **다음 명령어 실행:**
   ```powershell
   winget install --id Git.Git -e --source winget
   ```

3. **설치 완료 후 터미널 재시작**

4. **확인:**
   ```bash
   git --version
   ```

---

### 방법 3: Chocolatey 사용 (고급 사용자)

Chocolatey가 설치되어 있는 경우:

1. **터미널 열기** (관리자 권한)

2. **명령어 실행:**
   ```powershell
   choco install git
   ```

3. **터미널 재시작**

---

## 🔍 설치 후 확인

### 1. Git 버전 확인

```bash
git --version
```

**성공 예시:**
```
git version 2.40.0
```

**실패 예시:**
```
'git'은(는) 내부 또는 외부 명령...
```
→ 설치가 제대로 안 되었거나 터미널을 재시작하지 않았습니다

### 2. Git 설정 (선택사항)

처음 한 번만 설정하면 됩니다:

```bash
# 사용자 이름 설정
git config --global user.name "본인이름"

# 이메일 설정
git config --global user.email "your-email@example.com"
```

**예시:**
```bash
git config --global user.name "김지훈"
git config --global user.email "jihun@example.com"
```

**확인:**
```bash
git config --global --list
```

---

## ❓ 문제 해결

### 문제 1: 설치 후에도 "git이 인식되지 않습니다"

**해결 방법:**

1. **터미널 완전히 재시작**
   - 모든 터미널 창 닫기
   - 새로 PowerShell 열기

2. **컴퓨터 재시작** (가장 확실한 방법)
   - 설치 후 환경 변수가 적용되려면 재시작이 필요할 수 있습니다

3. **PATH 환경 변수 확인**
   - Windows 키 → "환경 변수" 검색
   - "시스템 환경 변수 편집" 클릭
   - "환경 변수" 버튼 클릭
   - "시스템 변수"에서 `Path` 찾기
   - 편집 → 다음 경로가 있는지 확인:
     ```
     C:\Program Files\Git\cmd
     ```
   - 없으면 추가

### 문제 2: 설치 파일을 찾을 수 없어요

**해결 방법:**

1. **다시 다운로드**
   - https://git-scm.com/download/win 접속
   - 다운로드가 안 되면 "Click here to download manually" 클릭

2. **다른 브라우저 사용**
   - Chrome, Edge 등 다른 브라우저로 시도

### 문제 3: 설치 중 오류 발생

**해결 방법:**

1. **관리자 권한으로 실행**
   - 설치 파일 우클릭
   - "관리자 권한으로 실행" 선택

2. **바이러스 백신 일시 중지**
   - 일부 백신 프로그램이 설치를 차단할 수 있습니다

3. **이전 버전 제거 후 재설치**
   - 제어판 → 프로그램 제거
   - Git 제거 후 재설치

---

## 📝 설치 후 다음 단계

Git이 설치되면:

1. ✅ `DEPLOYMENT_FOR_BEGINNERS.md` 파일로 돌아가기
2. ✅ Git 초기화부터 다시 시작
3. ✅ GitHub에 코드 업로드

---

## 💡 팁

- **설치 시간:** 약 2-3분 소요
- **디스크 공간:** 약 200MB 필요
- **인터넷 연결:** 다운로드를 위해 필요
- **관리자 권한:** 필요 없음 (일반 사용자로 설치 가능)

---

## 🎯 빠른 요약

1. 브라우저에서 `https://git-scm.com/download/win` 접속
2. 자동 다운로드된 파일 실행
3. "Next" 버튼 계속 클릭 (기본 설정으로 설치)
4. 설치 완료 후 터미널 재시작
5. `git --version` 명령어로 확인

이제 Git을 사용할 수 있습니다! 🎉

