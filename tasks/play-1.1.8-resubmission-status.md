# Play Store — Resubmission 1.1.8 (fix prominent disclosure)

**Stato al 29 giugno 2026: 1.1.8 INVIATA IN REVISIONE — in attesa di risposta Google (fino a ~7 giorni, ~entro 6 luglio 2026).**

---

## Il problema (perché siamo qui)

Google Play ha **rifiutato la 1.1.7 (versionCode 20)** il 20 giugno per
*"Prominent Disclosure and Consent Requirement: Inadequate Prominent Disclosure"*
(policy User Data): la disclosure in-app non spiegava adeguatamente l'uso dei dati di posizione.

- Lo screenshot-prova di Google (`IN_APP_EXPERIENCE-1778.png`) mostrava la **schermata Impostazioni** etichettata **"Version 1.0.1 / Build 2"** — cioè una **build vecchia**, non quella inviata.
- Versione **live** sul Play Store fino a oggi: **1.1.4-beta (code 12)** — le release 1.1.5 (17) e 1.1.7 (20) non sono mai andate live.

## Cosa è stato fatto in questa sessione

1. **Codice** — aggiunta clausola "background" alla disclosure full-screen (`foreground_location_disclosure_intro`) in **EN / IT / FR**.
   Ora recita: *"...collects and uses your device location, including in the background while a tour is active, ..."*
   - Commit **`8df1de9`** su branch **`fix/prominent-disclosure-1.1.8`** (pushato).
   - **PR #1**: https://github.com/gigiorda84/walkspace-app/pull/1 (NON ancora mergiata su main).
2. **Build** — AAB release firmato **1.1.8 / versionCode 21** (firma CN=Bandite). Su Desktop: `SonicWalkscape-1.1.8-release.aab`.
3. **Play Console** — l'AAB 1.1.8 è stato caricato nella bozza release 21, note di rilascio it-IT compilate, roll-out 100% tutti i paesi.
   - L'utente ha **inviato (Submit) tutte e 3 le modifiche in sospeso**:
     1. Production 21 (1.1.8) — full rollout
     2. Closed testing — Pause track
     3. App content — Complete Data safety questionnaire
   - Risultato: pagina Policy status mostra **"Update in review"**.

## Stato appello (separato dalla review)

- Appello **già inviato** il 21 giu: ticket **`2-1603000040833`**, tesi "build sbagliata esaminata (1.0.1/Build 2)".
- **Il Play Console NON permette di allegare video all'appello** (modulo solo testo).
- Decisione presa: **aspettare la revisione** della 1.1.8 (via principale). Video usato solo se Google lo chiede.

## Materiali pronti sul Desktop (prova, se Google la chiede)

- `SonicWalkscape-prominent-disclosure-1.1.8.mp4` — video ~85s: primo avvio → onboarding → disclosure full-screen EN (con "background"). Registrato su Galaxy A03s.
- `SWK-prova-1_settings-EN-v1.1.8.png` — Impostazioni EN, versione 1.1.8/21, con disclosure.
- `SWK-prova-2_disclosure-fullscreen-EN.png` — disclosure full-screen EN.
- `SWK-appeal-text-EN.md` — testo appello in inglese con timestamp del video.
- Backup video: `...-v1-NObackground.mp4`, `...-FULL-backup.mp4` (cancellabili).

## ➡️ COSA FARE QUANDO ARRIVA LA RISPOSTA

Controllare: **email gc.giorda@gmail.com** + **Play Console → Publishing overview / Policy status**.

### Se APPROVATA ✅
- La 1.1.8 va live al 100% (sostituisce la 1.1.4-beta). Problema chiuso.
- Mergiare la **PR #1** su `main`.
- (Facoltativo) chiudere/ritirare l'appello se ancora aperto.

### Se RESPINTA di nuovo ❌
- Leggere il **nuovo** motivo (potrebbe essere diverso, NON più la disclosure).
- Se ancora "prominent disclosure": attivare **"Get support"** (policy specialists) e fornire il **video** — prima caricarlo su Google Drive / YouTube (non in elenco) per avere un link condivisibile (il modulo non accetta upload).
- Verificare che il **Data safety questionnaire** sia coerente con la dichiarazione di raccolta posizione in background.

## Pendenze minori
- Galaxy A03s ha installata la **1.1.8 debug** (build di test, non firmata con chiave release): rimuovere per non confonderla.
- Impostazioni device già ripristinate (stay-on off, timeout 30s).
