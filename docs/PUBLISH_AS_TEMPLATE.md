# 이 프로젝트를 GitHub Template으로 공개하기

구글 시트 사본처럼 쓰려면, `band-archive`를 **단독 저장소**로 두고 Template로 표시하는 것이 가장 단순합니다.

## 1. 단독 저장소로 올리기

지금 폴더가 `COZY HORROR/band-archive` 안에 있어도 됩니다.  
Template용으로는 **이 폴더 내용이 repo 루트**가 되게 푸시하세요.

예시 (GitHub CLI):

```bash
cd band-archive
git init
git add .
git commit -m "Initial BAND archive template"
gh repo create band-archive --public --source=. --remote=origin --push
```

또는 GitHub 웹에서 빈 repo를 만든 뒤 `band-archive` 내용만 푸시.

## 2. Template 저장소로 표시

1. GitHub repo → **Settings**
2. **Template repository** 체크
3. 저장

이제 방문자가 **Use this template** 버튼으로 사본을 만들 수 있습니다.

## 3. README Deploy 버튼 URL 수정

[`README.md`](../README.md) 안의 아래 자리를 실제 주소로 바꿉니다.

- `YOUR_GITHUB_USER/YOUR_REPO` → 예: `myid/band-archive`

Deploy 버튼 링크 예시:

```text
https://vercel.com/new/clone?repository-url=https://github.com/myid/band-archive&env=VITE_EDIT_PIN,VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&project-name=band-archive&repository-name=band-archive
```

## 4. 다른 사람에게 안내할 한 줄

> 이 저장소에서 **Use this template** → Supabase에 `schema.sql` 실행 → **Deploy** 버튼으로 Vercel 배포 → 공개 링크 공유. 편집은 `/edit` + 본인 PIN.

## 5. 업데이트 배포 (선택)

템플릿을 고친 뒤, 이미 사본을 만든 사람은 **자동으로 반영되지 않습니다.**  
(시트 사본과 동일.) 중요 수정은 릴리즈 노트에 적고, 필요하면 사본 repo에 수동 merge/cherry-pick 하면 됩니다.
