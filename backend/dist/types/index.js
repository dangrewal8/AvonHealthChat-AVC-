"use strict";
/**
 * TypeScript Type Definitions
 * Avon Health RAG System Backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// ============================================================================
// Error Types
// ============================================================================
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=index.js.map