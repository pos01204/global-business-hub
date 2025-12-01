# Git 연동 상태 점검 가이드

## 현재 상황
Cursor의 터미널에서 Git 명령어가 작동하지 않는 것으로 보입니다.

## 점검 사항

### 1. Git 설치 확인
```powershell
git --version
where git
```

### 2. Git 저장소 확인
```powershell
Test-Path .git
git rev-parse --git-dir
```

### 3. Git 설정 확인
```powershell
git config --list
git config user.name
git config user.email
```

### 4. 원격 저장소 확인
```powershell
git remote -v
git remote get-url origin
```

### 5. 현재 상태 확인
```powershell
git status
git branch
git log --oneline -5
```

## 가능한 문제점 및 해결 방법

### 문제 1: Git이 설치되지 않음
**해결:** Git을 설치하세요
- https://git-scm.com/download/win 에서 다운로드
- 또는 `winget install Git.Git` 실행

### 문제 2: Git이 PATH에 없음
**해결:** Git 경로를 PATH 환경 변수에 추가
```powershell
# Git 설치 경로 확인
where git
# 일반적으로: C:\Program Files\Git\cmd\git.exe
```

### 문제 3: Git 인증 문제
**해결:** GitHub 인증 설정
```powershell
# Personal Access Token 사용
git config --global credential.helper wincred

# 또는 SSH 키 사용
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 문제 4: 저장소가 초기화되지 않음
**해결:** Git 저장소 초기화
```powershell
git init
git remote add origin https://github.com/pos01204/global-business-hub.git
```

### 문제 5: 권한 문제
**해결:** 관리자 권한으로 실행하거나 권한 확인
```powershell
# 현재 사용자 확인
whoami
# Git 설정 파일 권한 확인
Test-Path $env:USERPROFILE\.gitconfig
```

## 수동 점검 방법

1. **Windows PowerShell을 직접 열어서 확인**
   - `Win + X` → Windows PowerShell 열기
   - 프로젝트 디렉토리로 이동
   - `git status` 실행

2. **Git Bash 사용**
   - Git 설치 시 함께 설치되는 Git Bash 사용
   - 더 표준적인 Git 환경 제공

3. **Cursor 설정 확인**
   - Cursor → Settings → Terminal
   - 기본 터미널이 올바르게 설정되어 있는지 확인

## 권장 해결 순서

1. Git 설치 확인 및 재설치 (필요시)
2. PowerShell에서 직접 Git 명령어 테스트
3. Cursor 터미널 설정 확인
4. Git 인증 재설정
5. 저장소 재연결






