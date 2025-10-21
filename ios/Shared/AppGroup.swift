// ios/Shared/AppGroup.swift
import Foundation

enum AppGroup {
    // Debe coincidir con el App Group configurado en ambos targets (app y extensión)
    static let identifier = "group.walletlyai"

    static var userDefaults: UserDefaults? {
        return UserDefaults(suiteName: identifier)
    }
}
