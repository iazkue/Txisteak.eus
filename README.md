# Txisteak.eus - Euskal Txisteen Ataria

Txisteak.eus euskal txisteak partekatu, irakurri eta bozkatzeko plataforma modernoa da. Proiektu honek umore ona zabaltzea eta euskarazko txiste bilduma dibertigarri bat sortzea du helburu.

## 🚀 Ezaugarriak

- **Txiste Ausartak**: Aurkitu ausazko txisteak modu dinamikoan.
- **Sailkapenak**:
  - **Txiste Onenak**: Botoen bidezko sailkapen orokorra.
  - **Hileroko Onenak**: Azken 31 egunetako txisterik baloratuenak.
  - **Txistegile Onenak**: Txiste gehien eta balorazio onena duten erabiltzaileak.
- **Bozkaketa Sistema**: Txisteak gustuko dituzun ala ez adierazteko aukera (Gora/Behera).
- **Txiste Bidalketa**: Erabiltzaileek beren txisteak bidal ditzakete komunitatearekin partekatzeko.

## 🛠️ Teknologia Kerrua (Tech Stack)

### Frontend
- **Framework**: React 19 + Vite
- **Hizkuntza**: TypeScript
- **Estiloak**: Tailwind CSS 4
- **Animazioak**: Framer Motion
- **Ikonoak**: Lucide React

### Backend
- **Server**: Node.js + Express
- **Hizkuntza**: TypeScript
- **Datu-basea**: PostgreSQL (Node-Postgres)
- **Deployment**: Vercel-erako optimizatua

## 💻 Tokiko Garapena (Local Setup)

### Aurrebaldintzak
- Node.js (v18 edo berriagoa)
- PostgreSQL instantzia bat

### Instalazioa

1. **Dependentziak instalatu**:
   ```bash
   npm install
   ```

2. **Ingurune-aldagaiak konfiguratu**:
   Sortu `.env` fitxategi bat erroan (edo erabili `.env.local`) eta gehitu honako hauek:
   ```env
   DATABASE_URL=zure_postgresql_url_a
   GEMINI_API_KEY=zure_gemini_api_key_a (aukerazkoa, AI bidezko moderaziorako bada)
   NODE_ENV=development
   ```

3. **Datu-basearen hasieratzea**:
   Zerbitzaria lehen aldiz abiaraztean, automatikoki sortuko ditu beharrezko taulak (`jokes` eta `votes`).

4. **Aplikazioa abiarazi**:
   ```bash
   npm run dev
   ```
   Zerbitzaria `http://localhost:3000` helbidean egongo da martxan.

## 📊 Datu-basearen Eskema

### `jokes` taula
- `id`: Serial (PK)
- `testua`: Text
- `email`, `izena`, `abizenak`, `pueblo`: Bidaltzailearen datuak
- `boto_positiboak`, `boto_negatiboak`: Integer
- `puntuazioa`: Float (Bonderatutako batazbestekoa)
- `created_at`: Timestamp

### `votes` taula
- `id`: Serial (PK)
- `joke_id`: Reference to jokes
- `vote_type`: 'gora' edo 'behera'
- `ip_address`: Text (Boto bikoitzak ekiditeko)
- `created_at`: Timestamp

## 📁 Proiektuaren Egitura

- `/api`: Backend zerbitzariaren kodea (Express).
- `/components`: React osagaiak.
- `/services`: Fronteko API deiak.
- `App.tsx`: Aplikazioaren sarrera puntu nagusia.
- `server.ts`: Garapeneko zerbitzariaren konfigurazioa.

---
© 2026 Txisteak.eus - Iñaki
