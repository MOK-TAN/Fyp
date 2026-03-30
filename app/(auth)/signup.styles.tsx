import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Styles ───
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroImage: {
    width: width,
    height: 200,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
  },
  greenText: {
    color: '#22C55E',
  },
  darkText: {
    color: '#1a1a1a',
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  generalErrorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  fieldContainer: {
    marginHorizontal: 24,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
    gap: 5,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 24,
    gap: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#22C55E',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roleLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleLabelSelected: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

