type ChangeCompanyStatus = (options: {
  data: { companyId: string; suspend: boolean };
}) => Promise<unknown>;

export async function activateCompanyManually(companyId: string, changeStatus: ChangeCompanyStatus) {
  await changeStatus({ data: { companyId, suspend: false } });
}