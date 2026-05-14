import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
  },
  createText: {
    color: '#22C55E',
  },
  accountText: {
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    marginLeft: 16,
  },
  errorDot: {
    color: '#EF4444',
    fontSize: 20,
    lineHeight: 20,
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '400',
  },
  roleContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioActive: {
    borderColor: '#22C55E',
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#22C55E',
  },
  signUpButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
  },
  loginLink: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
});

