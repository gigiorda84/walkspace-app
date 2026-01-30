import SwiftUI

struct WelcomeView: View {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var preferencesManager = UserPreferencesManager.shared
    @State private var showDiscovery = false
    @State private var showOnboarding = false
    @State private var showAbout = false
    @State private var showConnect = false
    @State private var showSettings = false

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        ZStack {
            // Background - dark purple
            Color.brandPurple
                .ignoresSafeArea(.container, edges: .all)

            VStack(spacing: 40) {
                Spacer()

                // Logo and title
                VStack(spacing: 20) {
                    Image("BanditeLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 200, height: 200)
                        .padding(.top, 30)

                    Text("Sonic WalkScape")
                        .font(.system(size: 40, weight: .bold))
                        .tracking(-1)  // Tight letter spacing
                        .foregroundColor(.brandCream)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 20)

                    Text("BANDITE _ Artivism")
                        .font(.system(size: 22, weight: .medium))
                        .foregroundColor(.brandYellow)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Spacer()

                // Action buttons
                VStack(spacing: 16) {
                    // About button
                    Button(action: {
                        showAbout = true
                    }) {
                        Text(strings.about)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.brandCream)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.brandSurfacePurple.opacity(0.3))
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(Color.brandBorderPurple, lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, 32)

                    // Start Exploring button
                    Button(action: {
                        locationManager.requestPermission()
                        showOnboarding = true
                    }) {
                        HStack {
                            Text(strings.startExploring)
                            Image(systemName: "arrow.right")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .primaryCTAButton()
                    }
                    .padding(.horizontal, 32)

                    // Connect button
                    Button(action: {
                        showConnect = true
                    }) {
                        Text(strings.connect)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.brandCream)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.brandSurfacePurple.opacity(0.3))
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(Color.brandBorderPurple, lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, 32)
                }
                .padding(.bottom, 60)
            }

            // Settings button (top-right)
            VStack {
                HStack {
                    Spacer()
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.brandYellow)
                            .frame(width: 60, height: 60)
                    }
                    .padding(.trailing, 16)
                    .padding(.top, 16)
                }
                Spacer()
            }
        }
        .fullScreenCover(isPresented: $showOnboarding) {
            OnboardingCarouselView(onComplete: {
                showOnboarding = false
                showDiscovery = true
            })
        }
        .fullScreenCover(isPresented: $showDiscovery) {
            DiscoveryView()
                .environment(\.dismissToRoot, {
                    showDiscovery = false
                })
        }
        .sheet(isPresented: $showAbout) {
            AboutModal()
        }
        .sheet(isPresented: $showConnect) {
            FollowUsModal()
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
    }
}

// MARK: - About Modal

struct AboutModal: View {
    @Environment(\.dismiss) private var dismiss

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    private var currentLanguage: String {
        UserPreferencesManager.shared.preferredLanguage
    }

    private var aboutText: String {
        switch currentLanguage {
        case "it":
            return """
BANDITE è un collettivo fondato nel 2023 da Valentina Bosio e Simona Sala, due artiste le cui esperienze di ricerca e creazione si incontrano al confine tra arte e attivismo. Il loro lavoro nasce da un approccio antropologico al teatro fisico e si muove fluidamente tra teatro, danza, arti visive, video e tecnologie multimediali. L'obiettivo è quello di superare i linguaggi performativi tradizionali, intrecciando codici espressivi diversi per restituire al teatro la sua natura di spazio collettivo, un luogo di riflessione e di confronto con le complessità del presente.

L'urgenza è quella di osservare e raccontare ciò che resta ai margini, le storie e le identità invisibili o dimenticate dalle narrazioni ufficiali. Il percorso di BANDITE si fonda su un'idea di arte come pratica di attraversamento, capace di unire territori, linguaggi e comunità. Il collettivo cerca costantemente di costruire spazi di dialogo tra corpi e memorie, tra dimensione reale e digitale, tra presente e ancestrale. L'obiettivo non è rappresentare, ma attivare, generare esperienze in cui il pubblico diventa parte di un rito collettivo di ascolto, consapevolezza e trasmissione.

BANDITE è il cuore pulsante dell'associazione Resonavisse: un'associazione culturale ideata per essere uno spazio vivo di esplorazione, creazione e condivisione. Un campo aperto, in continua trasformazione, dove praticare l'arte come incontro, intuizione e possibilità.
"""
        case "fr":
            return """
BANDITE est un collectif fondé en 2023 par Valentina Bosio et Simona Sala, deux artistes dont les parcours de recherche et de création se rencontrent à la croisée de l'art et de l'activisme. Leur travail naît d'une approche anthropologique du théâtre physique et se déploie de manière fluide entre théâtre, danse, arts visuels, vidéo et technologies multimédias. L'objectif est de dépasser les langages performatifs traditionnels en tissant différents codes expressifs pour restituer au théâtre sa nature d'espace collectif : un lieu de réflexion et de confrontation avec les complexités du présent.

L'urgence est d'observer et de raconter ce qui demeure en marge, les histoires et identités invisibles ou oubliées par les récits officiels. Le parcours de BANDITE se fonde sur une idée de l'art comme pratique de traversée, capable d'unir territoires, langages et communautés. Le collectif cherche constamment à construire des espaces de dialogue entre corps et mémoires, entre dimension réelle et digitale, entre présent et ancestral. L'objectif n'est pas de représenter, mais d'activer : générer des expériences dans lesquelles le public devient partie prenante d'un rituel collectif d'écoute, de conscience et de transmission.

BANDITE est le coeur battant de l'association Resonavisse: une association culturelle pensée comme un espace vivant d'exploration, de création et de partage. Un champ ouvert, en transformation continue, où pratiquer l'art comme rencontre, intuition et possibilité.
"""
        default: // English
            return """
BANDITE is a collective founded in 2023 by Valentina Bosio and Simona Sala, two artists whose paths of research and creation meet at the crossroads of art and activism. Their work stems from an anthropological approach to physical theatre and moves fluidly between theatre, dance, visual arts, video, and multimedia technologies. Their aim is to go beyond traditional performative languages, intertwining different expressive codes to return theatre to its nature as a collective space — a place of reflection and confrontation with the complexities of the present.

The urgency is to observe and recount what remains at the margins, the stories and identities rendered invisible or forgotten by official narratives. BANDITE's work is grounded in the idea of art as a practice of crossing — capable of connecting territories, languages, and communities. The collective constantly seeks to build spaces of dialogue between bodies and memories, between the real and the digital, between the present and the ancestral. The goal is not to represent but to activate, to generate experiences in which the audience becomes part of a collective ritual of listening, awareness, and transmission.

BANDITE is the beating heart of Resonavisse, a cultural association created as a living space for exploration, creation, and sharing — an open field in constant transformation, where art can be practiced as encounter, intuition, and possibility.
"""
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.brandPurple.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Logo
                        Image("BanditeLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 150, height: 150)
                            .padding(.top, 20)

                        // About text in current language
                        Text(aboutText)
                            .font(.system(size: 15))
                            .foregroundColor(.brandCream)
                            .lineSpacing(6)
                            .padding(20)
                            .background(Color.brandSurfacePurple)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.brandBorderPurple, lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(strings.about)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}

#Preview {
    WelcomeView()
}
