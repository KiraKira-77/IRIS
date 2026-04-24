export async function refreshStandardDialogContext(
  refreshUserInfo: () => Promise<unknown>,
  refreshScopeOptions: () => Promise<unknown>,
) {
  await Promise.all([refreshUserInfo(), refreshScopeOptions()])
}
