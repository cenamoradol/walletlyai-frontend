//
//  WalletluAIIntents.swift
//  WalletluAIIntents
//
//  Created by Chriss on 21/10/25.
//

import AppIntents

struct WalletluAIIntents: AppIntent {
    static var title: LocalizedStringResource { "WalletluAIIntents" }
    
    func perform() async throws -> some IntentResult {
        return .result()
    }
}
