export const emailService = {
  sendAdminSignupEmail: async (email: string, org: string) => {
    console.log(`[EMAIL] Sending admin signup notification to hi@metacogna.ai for ${email} (${org})`);
    // Mock email sending
    return true;
  },
  sendUserAccessEmail: async (email: string) => {
    console.log(`[EMAIL] Sending access granted email to ${email}`);
    // Mock email sending
    return true;
  }
};
