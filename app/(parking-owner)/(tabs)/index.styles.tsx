import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerGreeting: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ─── Scan QR Button ───
  scanButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  scanButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scanIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scanButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  scanButtonSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // ─── Earnings Summary ───
  earningsSummary: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  earningsHeader: {
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsItem: {
    flex: 1,
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginHorizontal: 16,
  },
  earningsLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  // ─── Metrics ───
  metricsList: {
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // ─── System Status ───
  systemStatus: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  systemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  systemInfo: {
    flex: 1,
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  systemSubtitle: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },

  // ─── Recent Activity ───
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  activityList: {
    gap: 12,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityLeft: {
    flex: 1,
  },
  activityReference: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityFacility: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activityCustomer: {
    fontSize: 13,
    color: '#6B7280',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPaid: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },

  // ─── Empty State ───
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },

  // ─── Report Button ───
  reportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});