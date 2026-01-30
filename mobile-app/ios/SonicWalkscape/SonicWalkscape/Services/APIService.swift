import Foundation
import Network

enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case invalidResponse
    case timeout
    case offline
    case serverError(Int)
    case notFound
    case forbidden

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError:
            return "Failed to parse server response"
        case .invalidResponse:
            return "Invalid server response"
        case .timeout:
            return "Request timed out. Please check your connection."
        case .offline:
            return "No internet connection. Please check your network."
        case .serverError(let code):
            return "Server error (\(code)). Please try again later."
        case .notFound:
            return "Resource not found"
        case .forbidden:
            return "Access denied. This tour may require a voucher."
        }
    }
}

class APIService {
    static let shared = APIService()

    private let session: URLSession
    private let maxRetries = 3
    private let retryDelay: TimeInterval = 1.0

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
    }

    func fetchTours() async throws -> [Tour] {
        let urlString = "\(Constants.API.fullURL)/tours"

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        return try await performRequest(url: url, retries: maxRetries)
    }

    func fetchTourDetails(tourId: String, language: String = "en") async throws -> TourDetailResponse {
        let urlString = "\(Constants.API.fullURL)/tours/\(tourId)?language=\(language)"

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        return try await performRequest(url: url, retries: maxRetries)
    }

    private func performRequest<T: Decodable>(url: URL, retries: Int) async throws -> T {
        var lastError: Error?

        for attempt in 0..<retries {
            do {
                let (data, response) = try await session.data(from: url)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }

                // Handle HTTP status codes
                switch httpResponse.statusCode {
                case 200...299:
                    // Success - decode and return
                    let decoder = JSONDecoder()
                    return try decoder.decode(T.self, from: data)
                case 403:
                    throw APIError.forbidden
                case 404:
                    throw APIError.notFound
                case 500...599:
                    throw APIError.serverError(httpResponse.statusCode)
                default:
                    throw APIError.invalidResponse
                }

            } catch let error as DecodingError {
                throw APIError.decodingError(error)
            } catch let error as APIError {
                // Don't retry on client errors (403, 404)
                if case .forbidden = error { throw error }
                if case .notFound = error { throw error }
                lastError = error
            } catch let urlError as URLError {
                // Check for specific network errors
                switch urlError.code {
                case .notConnectedToInternet, .networkConnectionLost:
                    throw APIError.offline
                case .timedOut:
                    throw APIError.timeout
                default:
                    lastError = APIError.networkError(urlError)
                }
            } catch {
                lastError = APIError.networkError(error)
            }

            // Wait before retrying (except on last attempt)
            if attempt < retries - 1 {
                try await Task.sleep(nanoseconds: UInt64(retryDelay * Double(attempt + 1) * 1_000_000_000))
            }
        }

        // All retries failed
        throw lastError ?? APIError.networkError(NSError(domain: "Unknown", code: -1))
    }

    func fetchTourPoints(tourId: String, language: String = "en") async throws -> [TourPoint] {
        let urlString = "\(Constants.API.fullURL)/tours/\(tourId)/points?language=\(language)"

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        return try await performRequest(url: url, retries: maxRetries)
    }

    func fetchTourManifest(tourId: String, language: String = "en") async throws -> TourManifest {
        let urlString = "\(Constants.API.fullURL)/tours/\(tourId)/manifest?language=\(language)"

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        return try await performRequest(url: url, retries: maxRetries)
    }

    // Submit feedback/newsletter signup
    func submitFeedback(email: String?, name: String?, feedback: String?, subscribeToNewsletter: Bool) async throws {
        let urlString = "\(Constants.API.fullURL)/feedback"

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: Any] = ["subscribeToNewsletter": subscribeToNewsletter]
        if let email = email?.trimmingCharacters(in: .whitespacesAndNewlines), !email.isEmpty { body["email"] = email }
        if let name = name?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty { body["name"] = name }
        if let feedback = feedback?.trimmingCharacters(in: .whitespacesAndNewlines), !feedback.isEmpty { body["feedback"] = feedback }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        print("📤 Feedback request body: \(body)")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if let responseString = String(data: data, encoding: .utf8) {
            print("📥 Feedback response (\(httpResponse.statusCode)): \(responseString)")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
    }

    // Check network connectivity
    func isConnected() -> Bool {
        let monitor = NWPathMonitor()
        var isConnected = false

        monitor.pathUpdateHandler = { path in
            isConnected = path.status == .satisfied
        }

        let queue = DispatchQueue(label: "NetworkMonitor")
        monitor.start(queue: queue)

        // Give it a moment to update
        Thread.sleep(forTimeInterval: 0.1)
        monitor.cancel()

        return isConnected
    }
}
