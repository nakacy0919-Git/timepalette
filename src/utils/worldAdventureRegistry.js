const adventureModules = import.meta.glob(
  '../data/world-adventure/**/*.json',
  { eager: true },
);

const unwrap = (module) => module?.default ?? module ?? {};

export const getWorldAdventureDomainPackage = (countryCode, domainId) => {
  const country = String(countryCode || '').trim().toLowerCase();
  const domain = String(domainId || '').trim();

  if (!country || !domain) return null;

  for (const [path, module] of Object.entries(adventureModules)) {
    const normalizedPath = path.replaceAll('\\', '/');
    if (!normalizedPath.includes(`/world-adventure/${domain}/`)) continue;

    const packageData = unwrap(module)?.[country];
    if (
      packageData?.countryCode?.toLowerCase() === country &&
      packageData?.domain === domain &&
      Array.isArray(packageData?.missions)
    ) {
      return packageData;
    }
  }

  return null;
};
