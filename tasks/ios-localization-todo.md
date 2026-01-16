# iOS App Localization Plan

## Goal
Make the iOS app available in Italian, English, and French with:
- Default language matching phone's system language
- Settings drawer with language switcher, location toggle, notifications toggle, and app credits
- All UI text translated to the selected language

## Current State
- DiscoveryView already has a settings button (top right) that opens SettingsView as a sheet
- SettingsView already has language selection, notifications toggle, and about section
- All UI strings are hardcoded in English
- UserPreferencesManager stores `preferredLanguage` (default: "it")

## Todo

### Phase 1: Create Localization Infrastructure
- [ ] 1.1 Create `LocalizedStrings.swift` - a centralized localization system with all UI strings in 3 languages
- [ ] 1.2 Update `UserPreferencesManager` to detect phone's system language on first launch

### Phase 2: Update Settings View
- [ ] 2.1 Add Location permission toggle to SettingsView
- [ ] 2.2 Add app credits section at the bottom of SettingsView
- [ ] 2.3 Update SettingsView to use localized strings

### Phase 3: Localize All Views
- [ ] 3.1 Localize WelcomeView (About, Start Exploring, Connect buttons)
- [ ] 3.2 Localize DiscoveryView (Discover, Loading, Error messages)
- [ ] 3.3 Localize TourDetailView (Start Tour)
- [ ] 3.4 Localize TourSetupSheet (Audio Language, Subtitles, Download sections)
- [ ] 3.5 Localize TourCompletionView (Tour Completed, stats labels, action buttons)
- [ ] 3.6 Localize FollowUsModal (Connect, Newsletter text)
- [ ] 3.7 Localize AboutModal section headers

### Phase 4: Testing
- [ ] 4.1 Verify language switching works correctly
- [ ] 4.2 Ensure all screens display properly in all 3 languages

## Strings to Translate

### WelcomeView
| Key | English | Italian | French |
|-----|---------|---------|--------|
| about | About | Informazioni | À propos |
| startExploring | Start Exploring | Inizia a Esplorare | Commencer |
| connect | Connect | Connettiti | Se connecter |

### DiscoveryView
| Key | English | Italian | French |
|-----|---------|---------|--------|
| discover | Discover | Scopri | Découvrir |
| loadingTours | Loading tours... | Caricamento tour... | Chargement... |
| errorLoadingTours | Error loading tours | Errore caricamento | Erreur de chargement |
| retry | Retry | Riprova | Réessayer |
| noToursFound | No tours found | Nessun tour trovato | Aucun tour trouvé |

### SettingsView
| Key | English | Italian | French |
|-----|---------|---------|--------|
| settings | Settings | Impostazioni | Paramètres |
| language | Language | Lingua | Langue |
| location | Location | Posizione | Localisation |
| enableLocation | Enable Location | Attiva Posizione | Activer la localisation |
| locationDescription | Required for GPS-triggered audio | Necessario per l'audio GPS | Requis pour l'audio GPS |
| audio | Audio | Audio | Audio |
| autoDownload | Auto-download Tours | Download automatico | Téléchargement auto |
| autoDownloadDesc | Automatically download tours for offline playback | Scarica automaticamente i tour | Télécharger automatiquement |
| notifications | Notifications | Notifiche | Notifications |
| enableNotifications | Enable Notifications | Attiva Notifiche | Activer les notifications |
| notificationsDesc | Receive updates about new tours | Ricevi aggiornamenti sui nuovi tour | Recevoir des mises à jour |
| about | About | Informazioni | À propos |
| version | Version | Versione | Version |
| build | Build | Build | Build |
| done | Done | Fatto | Terminé |
| credits | Credits | Crediti | Crédits |
| creditsText | Developed by BANDITE Artivism | Sviluppato da BANDITE Artivism | Développé par BANDITE Artivism |

### TourDetailView
| Key | English | Italian | French |
|-----|---------|---------|--------|
| startTour | Start Tour | Inizia Tour | Commencer |

### TourSetupSheet
| Key | English | Italian | French |
|-----|---------|---------|--------|
| audioLanguage | Audio Language | Lingua Audio | Langue audio |
| chooseLanguage | Choose your preferred audio language | Scegli la lingua preferita | Choisissez la langue |
| subtitles | Subtitles | Sottotitoli | Sous-titres |
| enableSubtitles | Would you like to enable subtitles? | Vuoi attivare i sottotitoli? | Activer les sous-titres? |
| on | On | Attivo | Activé |
| off | Off | Disattivo | Désactivé |
| showSubtitles | Show subtitles during audio playback | Mostra sottotitoli durante l'audio | Afficher les sous-titres |
| noSubtitles | No subtitles | Nessun sottotitolo | Sans sous-titres |
| downloadTour | Download Tour | Scarica Tour | Télécharger |
| downloadRec | Download (Recommended) | Download (Consigliato) | Télécharger (Recommandé) |
| saveOffline | Save tour for offline use | Salva per uso offline | Sauvegarder hors ligne |
| streamOnly | Stream Only | Solo Streaming | Streaming seul |
| requiresInternet | Requires internet connection | Richiede connessione internet | Connexion internet requise |
| downloading | Downloading Tour | Download in corso | Téléchargement en cours |
| downloadFailed | Download Failed | Download fallito | Échec du téléchargement |
| retry | Retry | Riprova | Réessayer |
| skip | Skip | Salta | Passer |
| back | Back | Indietro | Retour |

### TourCompletionView
| Key | English | Italian | French |
|-----|---------|---------|--------|
| tourCompleted | Tour Completed! | Tour Completato! | Tour Terminé! |
| points | points | punti | points |
| km | km | km | km |
| min | min | min | min |
| busInfo | Bus Info | Info Bus | Info Bus |
| followUs | Follow Us | Seguici | Suivez-nous |
| support | Support | Supporta | Soutenir |
| returnToDiscovery | Return to Discovery | Torna ai Tour | Retour |

### FollowUsModal
| Key | English | Italian | French |
|-----|---------|---------|--------|
| connect | Connect | Connettiti | Se connecter |
| newsletter | Newsletter | Newsletter | Newsletter |
| stayUpdated | Stay updated with our latest tours and events | Rimani aggiornato sui nostri tour | Restez informé de nos tours |

## Review

### Summary of Changes

**Files Created:**
1. `LocalizedStrings.swift` - Centralized localization system with all UI strings in Italian, English, and French

**Files Modified:**
1. `UserPreferencesManager.swift` - Added system language detection on first launch
2. `SettingsView.swift` - Added location toggle, credits section, and localized all strings
3. `WelcomeView.swift` - Localized "About", "Start Exploring", "Connect" buttons
4. `DiscoveryView.swift` - Localized navigation title, loading, error messages
5. `TourDetailView.swift` - Localized "Start Tour" button
6. `TourSetupSheet.swift` - Localized all setup wizard text (audio language, subtitles, download)
7. `TourCompletionView.swift` - Localized completion screen and stats labels
8. `FollowUsModal.swift` (in TourCompletionView) - Localized "Connect", "Newsletter" text

### Key Features Implemented:
- App language defaults to phone's system language (if Italian, French, or English; otherwise Italian)
- Settings drawer allows user to switch app language
- Settings drawer includes location permission toggle (opens system settings if denied)
- Settings drawer shows app credits with BANDITE logo at the bottom
- All UI text throughout the app is now localized in 3 languages

### How It Works:
1. `LocalizedStrings.shared` is a singleton that provides localized strings
2. It reads the current language from `UserPreferencesManager.shared.preferredLanguage`
3. Each view uses `private var strings: LocalizedStrings { LocalizedStrings.shared }` to access strings
4. When user changes language in Settings, the preference is saved and UI updates

### Testing Notes:
- Test language switching in Settings to verify all screens update
- Test first launch with different system languages (Italian, French, English, other)
- Verify location toggle opens system settings when permission is denied
- Check credits section displays correctly at bottom of Settings
