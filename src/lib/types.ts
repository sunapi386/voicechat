// src/lib/types.ts
export type MessageRole =
  | "clinician"
  | "patient"
  | "assistant"
  | "tool"
  | "user";
export type MessageType = "original" | "translation" | "info";
export type Language = "en" | "es" | "zh";
export function isValidLanguage(lang: string): lang is Language {
  return ["en", "es", "zh"].includes(lang);
}
export const translations = {
  en: {
    conversationSummary: "Conversation Summary",
    summary: "Summary",
    detectedActions: "Detected Actions",
    noActionsDetected: "No actions were detected in this conversation",
    noSummaryAvailable: "No summary available",
    exportTranscript: "Export Transcript",
    backToHome: "Back to Home",
    loading: "Loading summary...",
    exportSuccess: "Transcript exported successfully",
    exportError: "Failed to export transcript",
    // Action types
    lab_order: "Lab Order",
    follow_up: "Follow-up Appointment",
    // Add more translations as needed
  },
  es: {
    conversationSummary: "Resumen de la Conversación",
    summary: "Resumen",
    detectedActions: "Acciones Detectadas",
    noActionsDetected: "No se detectaron acciones en esta conversación",
    noSummaryAvailable: "Resumen no disponible",
    exportTranscript: "Exportar Transcripción",
    backToHome: "Volver al Inicio",
    loading: "Cargando resumen...",
    exportSuccess: "Transcripción exportada exitosamente",
    exportError: "Error al exportar la transcripción",
    // Action types
    lab_order: "Orden de Laboratorio",
    follow_up: "Cita de Seguimiento",
    // Add more translations as needed
  },
  zh: {
    conversationSummary: "对话摘要",
    summary: "摘要",
    detectedActions: "检测到的操作",
    noActionsDetected: "未在此对话中检测到任何操作",
    noSummaryAvailable: "暂无摘要",
    exportTranscript: "导出记录",
    backToHome: "返回首页",
    loading: "正在加载摘要...",
    exportSuccess: "记录导出成功",
    exportError: "导出记录失败",
    // Action types
    lab_order: "化验单",
    follow_up: "复诊预约",
    // Add more translations as needed
  },
} as const;

export type Translations = typeof translations;
