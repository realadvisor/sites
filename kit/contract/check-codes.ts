// Stable codes for the kit checks' findings the CRM shows in the publish
// dialog. The kit writes its findings in English for the agent; the CRM
// translates the ones with a code and shows the English message (with the
// finding's `rule` as its heading) for the rest.
//
// A finding is { message, where?, rule?, code?, params? }; code and params
// only when the message is one of these (the English message stays):
//   legal_page_missing     { path }    the legal notice or privacy page is missing

export type FindingCode = 'legal_page_missing';

export type FindingParams = Record<string, string | number | string[]>;

/** The code and params of a kit finding the CRM can translate, or null. */
export const findingCodeOf = (
  message: string,
  where?: string,
): { code: FindingCode; params: FindingParams } | null => {
  if (
    (where === '/legal' || where === '/privacy') &&
    /^HTTP 404\b/.test(message)
  ) {
    return { code: 'legal_page_missing', params: { path: where } };
  }
  return null;
};
