import SwiftUI

struct TourCardView: View {
    let tour: Tour

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                // Show video trailer if available, otherwise show image
                if let trailerUrl = tour.coverTrailerUrl, let url = URL(string: trailerUrl) {
                    VideoPlayerView(videoURL: url)
                } else if let imageUrl = tour.fullCoverImageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.brandDark)
                    }
                } else {
                    Rectangle()
                        .fill(Color.brandDark)
                        .overlay(
                            Image(systemName: "photo")
                                .font(.largeTitle)
                                .foregroundColor(.brandMuted)
                        )
                }

                if tour.isProtected {
                    Image(systemName: "lock.fill")
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.brandYellow)
                        .clipShape(Circle())
                        .padding(8)
                }
            }
            .frame(height: 200)
            .clipped()
            .cornerRadius(12)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(tour.displayTitle)
                        .font(.system(size: 18, weight: .bold))
                        .tracking(-0.5)
                        .foregroundColor(.brandCream)
                        .lineLimit(1)

                    Spacer()

                    if !tour.languages.isEmpty {
                        HStack(spacing: 4) {
                            ForEach(tour.languages.prefix(3), id: \.self) { lang in
                                Text(lang.uppercased())
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.brandYellow.opacity(0.3))
                                    .foregroundColor(.brandYellow)
                                    .cornerRadius(4)
                            }
                        }
                    }
                }

                HStack(spacing: 4) {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.caption)
                    Text(tour.city)
                        .font(.caption)
                }
                .foregroundColor(.brandMuted)

                Text(tour.displayDescription)
                    .font(.subheadline)
                    .foregroundColor(.brandMuted)
                    .lineLimit(2)

                HStack(spacing: 16) {
                    Label("\(tour.durationMinutes) min", systemImage: "clock")
                    Label(String(format: "%.1f km", tour.distanceKm), systemImage: "map")
                }
                .font(.caption)
                .foregroundColor(.brandMuted)
            }
        }
        .padding()
        .background(Color.brandSurfacePurple.opacity(0.5))
        .cornerRadius(24)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.brandBorderPurple, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.3), radius: 12, x: 0, y: 6)
    }
}

#Preview {
    TourCardView(tour: Tour(
        id: "1",
        slug: "historic-downtown",
        title: ["en": "Historic Downtown Walk"],
        descriptionPreview: ["en": "Explore the rich history of our city center with immersive audio stories from local historians."],
        completionMessage: nil,
        city: "Demo City",
        durationMinutes: 60,
        distanceKm: 2.5,
        languages: ["en"],
        isProtected: false,
        coverImageUrl: "https://picsum.photos/400/300",
        routePolyline: nil
    ))
    .padding()
}
