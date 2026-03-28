# TwInvisible

TwInvisible è un’applicazione che permette di “nascondere” contenuti o interazioni su Twitter/X in modo personalizzato, tramite un backend ASP.NET, un frontend web, un’app mobile React Native e un’estensione Chrome che intercetta le richieste in tempo reale.  
Tutto il sistema è orchestrato con **Docker** e **Aspire** per un deployment rapido e scalabile in ambiente locale o cloud.

---

## Indice

- [Architettura generale](#architettura-generale)
- [Backend (.NET + Aspire)](#backend-net--aspire)
- [Frontend Web](#frontend-web)
- [App Mobile (React Native)](#app-mobile-react-native)
- [Estensione Chrome](#estensione-chrome)
- [Vantaggi di Docker e Aspire](#vantaggi-di-docker-e-aspire)
- [Come avviare il progetto](#come-avviare-il-progetto)

---

## Architettura generale

TwInvisible adotta un’architettura **micro‑servizi** leggera, composta da:
<img width="903" height="377" alt="Screenshot 2026-03-28 alle 08 00 00" src="https://github.com/user-attachments/assets/cd3fd097-d5d1-4411-8b91-1c5e8d6f0662" />

- **Backend .NET**: API REST per gestire regole, utenti e configurazioni.
- **Frontend Web**: SPA (React/Vue) per l’interfaccia utente.
- **App Mobile**: React Native per Android e iOS.
- **Estensione Chrome**: intercetta e filtra contenuti direttamente nel browser.

I servizi comunicano tramite **HTTP/REST** e **WebSocket** per gli aggiornamenti in tempo reale; i dati sensibili sono protetti tramite **JWT** e/o OAuth.

---

## Backend (.NET + Aspire)

### Come funziona

Il backend è scritto in **.NET 8** con **ASP.NET Core** e usa **Aspire** per:

- Definire i servizi (API, database, cache).
- Gestire le dipendenze e le connessioni.
- Generare la configurazione Docker Compose.

Espone:
- API CRUD per creare e modificare regole di “invisibilità” (es. filtrare hashtag, account, parole).
- Endpoint di autenticazione/autorizzazione (login, token, ruoli).
- API consumate dal frontend, dall’estensione Chrome e dall’app mobile.

Utilizza **Entity Framework Core** su **PostgreSQL/SQL Server** e **Redis** per cache e sessioni in tempo reale.

### Come avviare il backend

1. Clona il repository:
   ```bash
   git clone https://github.com/Marco-Pagnanini/TwInvisible.git
   cd TwInvisible/Backend
   ```
2. Assicurati di avere:
   - .NET 8 SDK
   - Docker Desktop (se si usa Aspire)
3. Opzione 1 – Avvio locale classico:
   ```bash
   dotnet restore
   dotnet build
   dotnet run
   ```
4. Opzione 2 – Avvio con Aspire (Docker Compose integrato):
   ```bash
   dotnet run --project src/AspireApp
   ```
   Aspire avvierà automaticamente backend, database e Redis in Docker.

---

## Frontend Web

### Come funziona

Il frontend è una **SPA** (React o Vue):

- Permette di creare, modificare e gestire regole di invisibilità.
- Visualizza statistiche (conteggi, tipi di regole applicate).
- Si collega al backend tramite API REST protette da **JWT**.

L’utente può loggarsi dal sito web e sincronizzare le regole su mobile ed estensione.

### Come avviare il frontend

1. Entra nella cartella:
   ```bash
   cd TwInvisible/Frontend
   npm install
   ```
2. Imposta l’URL del backend in `.env`:
   ```env
   VITE_API_URL=http://localhost:5173
   ```
3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
4. Apre il browser su `http://localhost:3000`.

---

## App Mobile (React Native)

### Come funziona

L’app mobile è realizzata in **React Native** per Android e iOS:

- Gestisce le regole di invisibilità direttamente dal telefono.
- Sincronizza regole con il backend.
- Può ricevere notifiche quando vengono rilevati contenuti sensibili.

Usa **axios** per le API REST e **React Navigation** per la navigazione.

### Come avviare l’app mobile

1. Entra nella cartella:
   ```bash
   cd TwInvisible/Mobile
   npm install
   ```
2. Avvia il bundler Metro:
   ```bash
   npx react-native start
   ```
3. Su Android:
   ```bash
   npx react-native run-android
   ```
4. Su iOS (macOS):
   ```bash
   npx react-native run-ios
   ```
   L’app si collega al backend tramite l’URL configurato nel file di configurazione.

---

## Estensione Chrome

### Come funziona

L’estensione Chrome:

- Intercetta le richieste verso Twitter/X o carica i contenuti dal backend.
- Applica regole di filtraggio (account, hashtag, parole chiave).
- Sincronizza le regole dell’utente con il backend quando è loggato.
- Mostra nel popup il numero di contenuti nascosti.

Usa **Manifest V3** con:
- `content_script` per manipolare la pagina.
- `background` service worker per richieste e comunicazione.
- `popup` per configurazione e statistiche.

### Come installare l’estensione

1. Entra nella cartella:
   ```bash
   cd TwInvisible/Extension-Chrome
   npm install
   npm run build
   ```
2. Apri Chrome → `chrome://extensions`.
3. Abilita la modalità **“Sviluppatore”**.
4. Clicca su **“Carica espansione non compressa”** e seleziona la cartella `dist/` o `src/` (a seconda del build).
5. L’estensione sarà attiva su Twitter/X e applicherà le regole in tempo reale.

---

## Vantaggi di Docker e Aspire

### Docker

- **Isolamento**: ogni servizio (backend, database, cache, frontend) in un container separato.
- **Riproducibilità**: lo stesso stack funziona in locale, server e cloud senza modifiche.
- **Scalabilità**: si possono scalare più istanze facilmente con Docker Compose o Kubernetes.

### Aspire

- **Composizione dichiarativa**: definisci i servizi in C# e Aspire genera Docker Compose e configurazioni.
- **Osservabilità integrata**: logging, traccia distribuita e integrazione con strumenti di monitoraggio.
- **Dev‑loop rapido**: avvii tutta l’app con `dotnet run` sfruttando Docker sotto il cofano.

---

## Struttura del progetto

```bash
TwInvisible/
├── Backend/
│   ├── src/Api/               # API REST .NET
│   ├── src/Services/          # Business logic
│   ├── src/Data/              # Entity Framework
│   └── src/AspireApp/         # Orchestrazione con Aspire
│
├── Frontend/                  # SPA web
│   ├── src/
│   └── public/
│
├── Mobile/                    # App React Native
│   ├── src/
│   ├── android/
│   └── ios/
│
├── Extension-Chrome/          # Estensione Chrome
│   ├── src/
│   ├── dist/
│   └── manifest.json
│
└── docker-compose.yml         # Generato/incluso da Aspire
```

---

Se vuoi, dimmi che tecnologia usi esattamente per il frontend (React o Vue) e per il backend (es. PostgreSQL o SQL Server) e posso aggiornare il README con dettagli ancora più precisi.
