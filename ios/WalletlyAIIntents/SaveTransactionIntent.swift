// ios/WalletlyAIIntents/SaveTransactionIntent.swift
import AppIntents
import Foundation

struct SaveTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Guardar SMS en WalletIA"
    static var description = IntentDescription("Envía el texto del SMS del banco a WalletIA para registrar la transacción.")

    @Parameter(title: "Texto del SMS")
    var text: String

    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        // 1) Lee el token desde UserDefaults del App Group
        let token: String? = AppGroup.userDefaults?.dictionary(forKey: "auth")?["token"] as? String

        // 2) Llama al backend
        try await Network.postSaveTransaction(text: text, token: token)

        // 3) Devuelve éxito al Atajo
        return .result()
    }
}
