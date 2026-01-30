//
//  LocalizedStrings.swift
//  SonicWalkscape
//
//  Centralized localization system for UI strings
//

import Foundation

class LocalizedStrings {
    static let shared = LocalizedStrings()

    private init() {}

    private var currentLanguage: String {
        UserPreferencesManager.shared.preferredLanguage
    }

    // MARK: - Helper

    private func localized(_ en: String, _ it: String, _ fr: String) -> String {
        switch currentLanguage {
        case "it": return it
        case "fr": return fr
        default: return en
        }
    }

    // MARK: - Welcome View

    var about: String { localized("About", "Chi siamo", "À propos") }
    var startExploring: String { localized("Start Exploring", "Inizia a esplorare", "Commencer") }
    var connect: String { localized("Connect", "Contattaci", "Se connecter") }

    // MARK: - Discovery View

    var discover: String { localized("Discover", "Scopri", "Découvrir") }
    var loadingTours: String { localized("Loading tours...", "Caricamento tour...", "Chargement des tours...") }
    var errorLoadingTours: String { localized("Error loading tours", "Errore nel caricamento", "Erreur de chargement") }
    var retry: String { localized("Retry", "Riprova", "Réessayer") }
    var noToursFound: String { localized("No tours found", "Nessun tour trovato", "Aucun tour trouvé") }

    // MARK: - Settings View

    var settings: String { localized("Settings", "Impostazioni", "Paramètres") }
    var language: String { localized("Language", "Lingua", "Langue") }
    var location: String { localized("Location", "Posizione", "Localisation") }
    var enableLocation: String { localized("Enable Location", "Attiva Posizione", "Activer la localisation") }
    var locationDescription: String { localized("Required for GPS-triggered audio playback", "Necessario per la riproduzione audio GPS", "Requis pour la lecture audio GPS") }
    var audio: String { localized("Audio", "Audio", "Audio") }
    var autoDownloadTours: String { localized("Auto-download Tours", "Download Automatico", "Téléchargement auto") }
    var autoDownloadDescription: String { localized("Automatically download tours for offline playback", "Scarica automaticamente i tour per l'uso offline", "Télécharger automatiquement les tours") }
    var allToursDownloaded: String { localized("All tours downloaded", "Tutti i tour scaricati", "Tous les tours téléchargés") }
    var notifications: String { localized("Notifications", "Notifiche", "Notifications") }
    var enableNotifications: String { localized("Enable Notifications", "Attiva Notifiche", "Activer les notifications") }
    var notificationsDescription: String { localized("Receive updates about new tours and features", "Ricevi aggiornamenti sui nuovi tour", "Recevoir des mises à jour sur les tours") }
    var aboutSection: String { localized("About", "Informazioni", "À propos") }
    var version: String { localized("Version", "Versione", "Version") }
    var build: String { localized("Build", "Build", "Build") }
    var done: String { localized("Done", "Fatto", "Terminé") }
    var credits: String { localized("Credits", "Crediti", "Crédits") }
    var developedBy: String { localized("Developed by BANDITE Artivism", "Sviluppato da BANDITE Artivism", "Développé par BANDITE Artivism") }
    var appDescription: String { localized("Sonic walking tours for cultural exploration", "Tour sonori per l'esplorazione culturale", "Promenades sonores pour l'exploration culturelle") }
    var getInTouch: String { localized("Get in touch if you want to use this app for your project", "Contattaci se vuoi usare questa app per il tuo progetto", "Contactez-nous si vous souhaitez utiliser cette app pour votre projet") }

    // MARK: - Tour Detail View

    var startTour: String { localized("Start Tour", "Inizia Tour", "Commencer") }

    // MARK: - Difficulty Levels

    var difficultyEasy: String { localized("Easy", "Facile", "Facile") }
    var difficultyModerate: String { localized("Moderate", "Medio", "Moyen") }
    var difficultyChallenging: String { localized("Challenging", "Difficile", "Difficile") }

    func localizedDifficulty(_ rawValue: String) -> String {
        switch rawValue.lowercased() {
        case "medio": return difficultyModerate
        case "difficile": return difficultyChallenging
        default: return difficultyEasy
        }
    }

    // MARK: - Tour Setup Sheet

    var audioLanguage: String { localized("Audio Language", "Lingua Audio", "Langue audio") }
    var chooseAudioLanguage: String { localized("Choose your preferred audio language", "Scegli la lingua audio preferita", "Choisissez la langue audio") }
    var subtitles: String { localized("Subtitles", "Sottotitoli", "Sous-titres") }
    var enableSubtitlesQuestion: String { localized("Would you like to enable subtitles?", "Vuoi attivare i sottotitoli?", "Voulez-vous activer les sous-titres?") }
    var on: String { localized("On", "Attivo", "Activé") }
    var off: String { localized("Off", "Disattivo", "Désactivé") }
    var showSubtitlesDuringPlayback: String { localized("Show subtitles during audio playback", "Mostra sottotitoli durante la riproduzione", "Afficher les sous-titres pendant la lecture") }
    var noSubtitles: String { localized("No subtitles", "Nessun sottotitolo", "Sans sous-titres") }
    var downloadTour: String { localized("Download Tour", "Scarica Tour", "Télécharger le tour") }
    var downloadRecommendation: String { localized("We recommend downloading the tour for the best experience, especially in areas with poor connectivity.", "Ti consigliamo di scaricare il tour per un'esperienza migliore, specialmente in zone con scarsa connettività.", "Nous recommandons de télécharger le tour pour une meilleure expérience, surtout dans les zones à faible connectivité.") }
    var downloadRecommended: String { localized("Download (Recommended)", "Download (Consigliato)", "Télécharger (Recommandé)") }
    var saveForOffline: String { localized("Save tour for offline use", "Salva il tour per l'uso offline", "Sauvegarder pour une utilisation hors ligne") }
    var streamOnly: String { localized("Stream Only", "Solo Streaming", "Streaming uniquement") }
    var requiresInternet: String { localized("Requires internet connection", "Richiede connessione internet", "Nécessite une connexion internet") }
    var downloadingTour: String { localized("Downloading Tour", "Download in corso", "Téléchargement en cours") }
    var pleaseWait: String { localized("Please wait while we download the tour content...", "Attendere il download del contenuto...", "Veuillez patienter pendant le téléchargement...") }
    var downloadFailed: String { localized("Download Failed", "Download Fallito", "Échec du téléchargement") }
    var skip: String { localized("Skip", "Salta", "Passer") }
    var back: String { localized("Back", "Indietro", "Retour") }

    // MARK: - Tour Completion View

    var tourCompleted: String { localized("Tour Completed!", "Tour Completato!", "Tour Terminé!") }
    var points: String { localized("points", "punti", "points") }
    var km: String { localized("km", "km", "km") }
    var min: String { localized("min", "min", "min") }
    var busInfo: String { localized("Bus Info", "Info Bus", "Info Bus") }
    var followUs: String { localized("Follow Us", "Seguici", "Suivez-nous") }
    var support: String { localized("Support", "Supporta", "Soutenir") }
    var returnToDiscovery: String { localized("Return to Discovery", "Torna ai Tour", "Retour aux tours") }
    var returnToHome: String { localized("Return to home", "Torna alla home", "Retour à l'accueil") }

    // MARK: - Follow Us Modal

    var newsletter: String { localized("Newsletter", "Newsletter", "Newsletter") }
    var stayUpdated: String { localized("Stay updated with our latest tours and events", "Rimani aggiornato sui nostri tour e eventi", "Restez informé de nos derniers tours et événements") }

    // MARK: - Newsletter Form

    var email: String { localized("Email", "Email", "Email") }
    var nameOptional: String { localized("Name (optional)", "Nome (opzionale)", "Nom (facultatif)") }
    var feedbackOptional: String { localized("Your feedback (optional)", "Il tuo feedback (opzionale)", "Votre avis (facultatif)") }
    var subscribeNewsletter: String { localized("Subscribe to newsletter", "Iscrivimi alla newsletter", "S'abonner à la newsletter") }
    var submit: String { localized("Submit", "Invia", "Envoyer") }
    var thankYou: String { localized("Thank you!", "Grazie!", "Merci!") }
    var messageSent: String { localized("Your message has been sent.", "Il tuo messaggio è stato inviato.", "Votre message a été envoyé.") }
    var sendAnother: String { localized("Send another message", "Invia un altro messaggio", "Envoyer un autre message") }
    var emailRequired: String { localized("Email required to subscribe to newsletter", "Email richiesta per iscriversi alla newsletter", "Email requis pour s'abonner à la newsletter") }
    var submitError: String { localized("Error sending. Please try again.", "Errore durante l'invio. Riprova.", "Erreur lors de l'envoi. Veuillez réessayer.") }

    // MARK: - About Modal

    var english: String { "English" }
    var italiano: String { "Italiano" }
    var francais: String { "Français" }

    // MARK: - Onboarding Carousel

    var continueButton: String { localized("Continue", "Continua", "Continuer") }

    // Slide 1: How it works
    var onboardingTitle1: String { localized("How it works", "Come funziona", "Comment ça marche") }
    var onboardingText1a: String { localized("Sonic Walkscape is a simple walk on mountain trails.", "Sonic Walkscape è una camminata semplice su sentieri di montagna.", "Sonic Walkscape est une promenade simple sur des sentiers de montagne.") }
    var onboardingText1b: String { localized("You will hear audio tracks that activate automatically by following the map of the chosen tour.", "Ascolterai tracce audio che si attivano automaticamente seguendo la mappa del tour scelto.", "Vous entendrez des pistes audio qui s'activent automatiquement en suivant la carte du tour choisi.") }
    var onboardingText1c: String { localized("You might hear silences: they are part of the experience.", "Potresti ascoltare dei silenzi: fanno parte dell'esperienza.", "Vous pourriez entendre des silences: ils font partie de l'expérience.") }

    // Slide 2: Safety first
    var onboardingTitle2: String { localized("Safety first", "Sicurezza prima di tutto", "La sécurité avant tout") }
    var onboardingText2a: String { localized("Check the weather before starting.", "Controlla il meteo prima di iniziare.", "Vérifiez la météo avant de commencer.") }
    var onboardingText2b: String { localized("Wear clothes and shoes suitable for a mountain trail.", "Indossa abiti e scarpe adatte a un sentiero di montagna.", "Portez des vêtements et des chaussures adaptés à un sentier de montagne.") }
    var onboardingText2c: String { localized("In case of snow, bring hiking poles.", "In caso di neve, porta i bastoncini da montagna.", "En cas de neige, apportez des bâtons de randonnée.") }

    // Slide 3: Before you go
    var onboardingTitle3: String { localized("Before you go", "Prima di partire", "Avant de partir") }
    var onboardingText3a: String { localized("Bring headphones or earbuds with you.", "Porta con te cuffie o auricolari.", "Apportez des écouteurs avec vous.") }
    var onboardingText3b: String { localized("Remember: low temperatures drain your phone faster.", "Ricorda: le basse temperature scaricano il telefono più velocemente.", "N'oubliez pas: les basses températures déchargent le téléphone plus rapidement.") }
    var onboardingText3c: String { localized("Continue to the end of the tour and leave us feedback!", "Prosegui fino al termine del tour e lasciaci un feedback!", "Continuez jusqu'à la fin du tour et laissez-nous un commentaire!") }
}
