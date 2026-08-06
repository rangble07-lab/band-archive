# BAND Hub

**사이트 하나**에서 여러 사람이 각자 밴드 페이지를 만드는 허브입니다.  
(사본 배포 / Use this template 불필요)

| 주소 | 용도 |
|------|------|
| `/` | 허브 — 페이지 만들기 / 열기 |
| `/p/내주소` | 공개 페이지 (남에게 이 링크) |
| `/p/내주소/edit` | 본인만 PIN으로 편집 |

BandBackup처럼 **방문자는 가입·배포 없이** 허브에 들어와 페이지만 만들면 됩니다.  
운영자(당신)만 Supabase + Vercel을 **한 번** 연결하면 됩니다.

---

## 사용자 흐름 (쉬움)

1. 허브 주소 접속  
2. **내 페이지 만들기** → 주소(`cozy`) + PIN  
3. 밴드·사진 편집  
4. 남에게 `https://허브주소/p/cozy` 만 공유  

---

## 운영자: 배포 (한 번만)

### 1) Supabase

1. [Supabase](https://supabase.com) 무료 프로젝트 생성  
2. SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) **전체 실행**  
3. Settings → API 에서 URL / anon key 복사  

> 예전에 단일 페이지용 테이블을 썼다면, 허브용 `schema.sql`이 `pages` 기준입니다.  
> 충돌 시 새 프로젝트를 쓰거나 옛 `profile` 테이블을 정리하세요.

### 2) 환경 변수

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

PIN은 사람마다 페이지 만들 때 정합니다. (`VITE_EDIT_PIN` 없음)

### 3) Vercel

1. 이 repo를 Vercel에 Import  
2. 위 환경 변수 2개 추가  
3. Deploy  
4. 나온 주소를 허브 링크로 공유  

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rangble07-lab/band-archive&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Supabase%20keys%20for%20BAND%20Hub&project-name=band-archive&repository-name=band-archive)

---

## 로컬 시험 (Supabase 없이)

```bash
npm install
npm run dev
```

- http://localhost:5173 → 허브  
- 페이지는 **이 브라우저 localStorage**에만 저장 (남과 공유 불가)  
- 공유하려면 Supabase 연결 필수  

---

## 보안 (개인용 MVP)

- PIN은 해시로 저장되고, **편집 UI**를 막습니다.  
- DB는 허브 MVP로 anon read/write를 허용합니다.  
- service_role 키는 넣지 마세요.  

---

## 스크립트

```bash
npm run dev
npm run build
npm run preview
```
