import AppIntents
import Foundation

fileprivate enum Config {
    // Cambia por tu backend; mismo host/https que usas en ENV.BASE_URL
    static let baseURL = "https://walletlyai-backend.onrender.com"
}

struct SaveTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Guardar SMS en WalletIA"
    static var description = IntentDescription("Envía el texto del SMS del banco a WalletIA para registrar la transacción.")

    @Parameter(title: "Texto del SMS")
    var text: String

    // No abras la app al ejecutar el atajo
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        guard let url = URL(string: "\(Config.baseURL)/ai/save-transaction") else {
            throw NSError(domain: "WalletIA", code: -1, userInfo: [NSLocalizedDescriptionKey: "URL inválida"])
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Versión SIN token (Personal Team no permite App Groups fácilmente).
        // Cuando actives App Groups, agregaremos Authorization aquí.

        let payload: [String: Any] = ["text": text]
        req.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])

        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw NSError(domain: "WalletIA", code: -2, userInfo: [NSLocalizedDescriptionKey: "Respuesta HTTP no válida"])
        }

        return .result()
    }
}