/** Si es true, muestra ayuda extra en la UI (pasos en dashboard). */
export function isSupabaseAuthRateLimitError(message: string): boolean {
  const m = message.toLowerCase().trim();
  return (
    m.includes("email rate limit exceeded") ||
    m.includes("over_email_send_rate_limit") ||
    (m.includes("rate limit") && (m.includes("email") || m.includes("signup")))
  );
}

/** Traduce errores frecuentes de Supabase Auth a texto útil en desarrollo. */
export function humanizeSupabaseAuthError(message: string): string {
  const m = message.toLowerCase().trim();

  if (m.includes("url and api key are required") || m.includes("required to create a supabase client")) {
    return (
      "Falta la configuración de Supabase en el frontend. Añade NEXT_PUBLIC_SUPABASE_URL y " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) en frontend/.env.local y reinicia el servidor de desarrollo."
    );
  }

  if (isSupabaseAuthRateLimitError(message)) {
    return (
      "Se alcanzó el límite temporal de Supabase para registros o envío de correos (protección contra abuso). " +
      "Espera unos minutos, prueba con otro correo o en el panel: Authentication → Rate Limits (ajústalos en desarrollo). " +
      "Si envías confirmación por correo en cada alta, desactivarla en desarrollo reduce estos bloqueos."
    );
  }

  return message;
}
