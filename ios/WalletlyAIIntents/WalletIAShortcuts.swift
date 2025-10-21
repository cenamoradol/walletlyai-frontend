// ios/WalletlyAIIntents/WalletIAShortcuts.swift
import AppIntents

struct WalletIAShortcuts: AppShortcutsProvider {
    static var shortcutTileColor: ShortcutTileColor = .blue

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: SaveTransactionIntent(),
            phrases: [
                "Guardar SMS en \(.applicationName)",
                "Registrar transacción con \(.applicationName)",
                "Enviar SMS a \(.applicationName)"
            ],
            shortTitle: "Guardar SMS",
            systemImageName: "tray.and.arrow.down"
        )
    }
}
