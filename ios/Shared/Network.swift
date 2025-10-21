// ios/Shared/Network.swift
import Foundation

struct Network {
    static let baseURL = "https://TU_BACKEND" // <-- cambia a tu backend, igual que ENV.BASE_URL

    static func postSaveTransaction(text: String, token: String?) async throws {
        guard let url = URL(string: "\(baseURL)/ai/save-transaction") else {
            throw NSError(domain: "WalletIA", code: -1, userInfo: [NSLocalizedDescriptionKey: "URL inválida"])
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let body: [String: Any] = ["text": text]
        req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw NSError(domain: "WalletIA", code: -2, userInfo: [NSLocalizedDescriptionKey: "Respuesta HTTP no válida"])
        }
    }
}
