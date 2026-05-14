/** Stable names for PostHog funnels (configure funnel in PostHog UI with these in order). */
export const POSTHOG_EVENTS = {
  homepageViewed: 'homepage_viewed',
  fleetSearch: 'fleet_search',
  vehicleDetailOpened: 'vehicle_detail_opened',
  bookingAttempt: 'booking_attempt',
  bookingCompleted: 'booking_completed',
  loginPageViewed: 'login_page_viewed',
  authMethodStarted: 'auth_method_started',
  loginCompleted: 'login_completed',
  kycSubmissionSuccess: 'kyc_submission_success',
  adminAction: 'admin_action',
  adminOpsDismiss: 'admin_ops_alert_dismissed',
} as const

export const BOOKING_FUNNEL = 'booking_conversion' as const
