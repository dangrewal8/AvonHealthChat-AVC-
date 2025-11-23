/**
 * Main API Routes - RAG System with Real Avon Health API Data
 */
import { OllamaService } from '../services/ollama.service';
import { AvonHealthService } from '../services/avonhealth.service';
import { ModelManagerService } from '../services/model-manager.service';
declare const router: import("express-serve-static-core").Router;
export declare function initializeServices(ollama: OllamaService, avonHealth: AvonHealthService, modelMgr: ModelManagerService): void;
export default router;
//# sourceMappingURL=api.routes.d.ts.map