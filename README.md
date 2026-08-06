# BAND Archive (Template)

다녀온 메신저 밴드를 **공개 링크로 보여주는** 미니 웹앱 템플릿입니다.  
구글 시트 **사본 만들기**처럼, 이 저장소를 복사한 뒤 **자기 Supabase + 자기 Vercel**로 배포하면 됩니다.

| 페이지 | 주소 | 용도 |
|--------|------|------|
| 공개 | `/` | 남에게 보여줄 페이지 |
| 편집 | `/edit` | 본인만 PIN으로 수정 (모바일 가능) |

---

## 다른 사람이 쓰는 방법 (사본)

### A. GitHub 템플릿으로 복사 (권장)

1. 이 저장소 상단 **Use this template** → **Create a new repository**
2. [Supabase](https://supabase.com) 무료 프로젝트 생성
3. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) **전체 실행**
4. Settings → API 에서 **Project URL** / **anon public** 키 복사
5. 아래 **Deploy** 버튼으로 Vercel 배포 (또는 Vercel에서 Import)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rangble07-lab/band-archive&env=VITE_EDIT_PIN,VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=PIN%20and%20Supabase%20keys%20for%20your%20own%20BAND%20page&envLink=https://github.com/rangble07-lab/band-archive&project-name=band-archive&repository-name=band-archive)

배포 시 환경 변수:

| 변수 | 설명 |
|------|------|
| `VITE_EDIT_PIN` | 편집용 PIN (본인만 아는 값) |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

6. 배포 후
   - 공개: `https://your-app.vercel.app`
   - 편집: `https://your-app.vercel.app/edit`

데이터·사진·PIN은 **사람마다 완전히 분리**됩니다.

### B. 로컬에서 먼저 시험

```bash
npm install
cp .env.example .env.local
# VITE_EDIT_PIN 수정
npm run dev
```

- 공개: http://localhost:5173  
- 편집: http://localhost:5173/edit  

Supabase 키 없이 쓰면 **이 기기 localStorage**에만 저장됩니다.  
남과 같은 내용을 공유하려면 Supabase + Vercel이 필요합니다.

---

## 화면 구성

| 구역 | 내용 |
|------|------|
| 헤더 | BAND, 이름(@핸들) 연공계, 소개 |
| 처음이라면 | 접기 공지 |
| 밴드 목록 | 더 캐스트 / 솔라 씨 · 밴드명·낯·@ · 커버\|낯 |
| 기타 연락처 | Main / Sub / 기타 |

---

## 보안 (개인용 MVP)

- PIN은 **편집 화면**만 막습니다.
- `schema.sql`은 개인 아카이브용으로 anon read/write를 허용합니다.
- **service_role 키는 넣지 마세요.** PIN·anon key는 커밋하지 마세요.

---

## 스크립트

```bash
npm run dev
npm run build
npm run preview
```

---

## 템플릿 운영자 안내

저장소를 Template으로 공개하는 방법은 [`docs/PUBLISH_AS_TEMPLATE.md`](docs/PUBLISH_AS_TEMPLATE.md) 를 보세요.
