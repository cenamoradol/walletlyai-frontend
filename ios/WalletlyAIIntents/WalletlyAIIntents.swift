//
//  WalletlyAIIntents.swift
//  WalletlyAIIntents
//
//  Created by Chriss on 20/10/25.
//

import AppIntents

struct WalletlyAIIntents: AppIntent {
    static var title: LocalizedStringResource { "WalletlyAIIntents" }
    
    func perform() async throws -> some IntentResult {
        return .result()
    }
}
