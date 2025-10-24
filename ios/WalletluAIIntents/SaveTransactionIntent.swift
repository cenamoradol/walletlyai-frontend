import AppIntents
import Foundation

fileprivate enum Config {
    static let baseURL = "https://walletlyai-backend.onrender.com"   // <- cámbialo
    static let appGroupId = "group.walletlyai"  // <- el mismo que en Capabilities
}

struct SaveTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Guardar SMS en WalletIA"
    static var description = IntentDescription("Envía el texto del SMS del banco a WalletIA para registrar la transacción.")

    @Parameter(title: "Texto del SMS")
    var text: String

    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        guard let url = URL(string: "\(Config.baseURL)/ai/save-transaction") else {
            throw NSError(domain: "WalletIA", code: -1, userInfo: [NSLocalizedDescriptionKey: "URL inválida"])
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // 1) Leer token del App Group
        let token = UserDefaults(suiteName: Config.appGroupId)?
            .dictionary(forKey: "auth")?["token"] as? String

        // 2) Agregar Authorization si hay token
        if let token, !token.isEmpty {
            // si guardas el token sin prefijo:
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            // si ya lo guardaste con "Bearer ..." quita el prefijo de arriba y usa tal cual:
            // req.setValue(token, forHTTPHeaderField: "Authorization")
        }

        let payload: [String: Any] = ["text": text]
        req.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])

        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            // (Opcional) imprime el status para depurar en Console.app
            // os_log("save-transaction status: %d", (resp as? HTTPURLResponse)?.statusCode ?? -1)
            throw NSError(domain: "WalletIA", code: -2, userInfo: [NSLocalizedDescriptionKey: "Respuesta HTTP no válida"])
        }

        return .result()
    }
}
