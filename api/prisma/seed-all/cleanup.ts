import { PrismaClient } from '@prisma/client';

export async function clearDatabase(prisma: PrismaClient) {
  const isIgnorableDeleteError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    return (
      error.message.includes('permission denied') ||
      error.message.includes('does not exist') ||
      (error as { code?: string }).code === 'EPERM'
    );
  };

  const safeDeleteMany = async (label: string, run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      if (isIgnorableDeleteError(error)) {
        console.warn(`[seed:cleanup] Skipping ${label}: ${(error as Error).message}`);
        return;
      }
      throw error;
    }
  };

  await safeDeleteMany('ticketMessage', () => prisma.ticketMessage.deleteMany());
  await safeDeleteMany('supportTicket', () => prisma.supportTicket.deleteMany());
  await safeDeleteMany('message', () => prisma.message.deleteMany());
  await safeDeleteMany('conversation', () => prisma.conversation.deleteMany());
  await safeDeleteMany('viewHistory', () => prisma.viewHistory.deleteMany());
  await safeDeleteMany('favorite', () => prisma.favorite.deleteMany());
  await safeDeleteMany('notification', () => prisma.notification.deleteMany());
  await safeDeleteMany('savedSearch', () => prisma.savedSearch.deleteMany());
  await safeDeleteMany('subscription', () => prisma.subscription.deleteMany());
  await safeDeleteMany('plan', () => prisma.plan.deleteMany());
  await safeDeleteMany('dealerLead', () => prisma.dealerLead.deleteMany());

  await safeDeleteMany('listingWizardState', () => prisma.listingWizardState.deleteMany());
  await safeDeleteMany('listingSeller', () => prisma.listingSeller.deleteMany());
  await safeDeleteMany('sellerContact', () => prisma.sellerContact.deleteMany());
  await safeDeleteMany('listingMedia', () => prisma.listingMedia.deleteMany());
  await safeDeleteMany('listingFact', () => prisma.listingFact.deleteMany());
  await safeDeleteMany('listingAttribute', () => prisma.listingAttribute.deleteMany());
  await safeDeleteMany('listing', () => prisma.listing.deleteMany());

  await safeDeleteMany('companyReview', () => prisma.companyReview.deleteMany());
  await safeDeleteMany('companyBrand', () => prisma.companyBrand.deleteMany());
  await safeDeleteMany('companyActivityType', () => prisma.companyActivityType.deleteMany());
  await safeDeleteMany('companyMedia', () => prisma.companyMedia.deleteMany());
  await safeDeleteMany('companyPhone', () => prisma.companyPhone.deleteMany());
  await safeDeleteMany('companyUser', () => prisma.companyUser.deleteMany());
  await safeDeleteMany('company', () => prisma.company.deleteMany());

  await safeDeleteMany('fieldOption', () => prisma.fieldOption.deleteMany());
  await safeDeleteMany('formField', () => prisma.formField.deleteMany());
  await safeDeleteMany('formTemplate', () => prisma.formTemplate.deleteMany());

  await safeDeleteMany('brandCategory', () => prisma.brandCategory.deleteMany());
  await safeDeleteMany('category', () => prisma.category.deleteMany());
  await safeDeleteMany('marketplace', () => prisma.marketplace.deleteMany());
  await safeDeleteMany('brand', () => prisma.brand.deleteMany());
  await safeDeleteMany('activityType', () => prisma.activityType.deleteMany());
  await safeDeleteMany('city', () => prisma.city.deleteMany());
  await safeDeleteMany('country', () => prisma.country.deleteMany());

  await safeDeleteMany('emailVerificationCode', () => prisma.emailVerificationCode.deleteMany());
  await safeDeleteMany('passwordResetToken', () => prisma.passwordResetToken.deleteMany());
  await safeDeleteMany('session', () => prisma.session.deleteMany());
  await safeDeleteMany('oAuthAccount', () => prisma.oAuthAccount.deleteMany());
  await safeDeleteMany('user', () => prisma.user.deleteMany());
}
