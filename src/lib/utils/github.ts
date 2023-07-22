import { arch, platform } from "@tauri-apps/api/os";

export interface ReleaseInfo {
  releaseType: "official" | "unofficial" | "devel";
  version: string;
  date: string | undefined;
  githubLink: string | undefined;
  downloadUrl: string | undefined;
  isDownloaded: boolean;
  pendingAction: boolean;
}

function isIntelMacOsRelease(
  platform: string,
  architecture: string,
  assetName: string
): boolean {
  return (
    platform === "darwin" &&
    architecture === "x86_64" &&
    assetName.startsWith("opengoal-macos-intel-v")
  );
}

// TODO - go back and fix old asset names so windows/linux can be simplified
function isWindowsRelease(
  platform: string,
  architecture: string,
  assetName: string
): boolean {
  return (
    platform === "win32" &&
    (assetName.startsWith("opengoal-windows-v") ||
      (assetName.startsWith("opengoal-v") && assetName.includes("windows")))
  );
}

function isLinuxRelease(
  platform: string,
  architecture: string,
  assetName: string
): boolean {
  return (
    platform === "linux" &&
    (assetName.startsWith("opengoal-linux-v") ||
      (assetName.startsWith("opengoal-v") && assetName.includes("linux")))
  );
}

async function getDownloadLinkForCurrentPlatform(
  release: any
): Promise<string | undefined> {
  const platformName = await platform();
  const archName = await arch();
  for (const asset of release.assets) {
    if (isIntelMacOsRelease(platformName, archName, asset.name)) {
      return asset.browser_download_url;
    } else if (isWindowsRelease(platformName, archName, asset.name)) {
      return asset.browser_download_url;
    } else if (isLinuxRelease(platformName, archName, asset.name)) {
      return asset.browser_download_url;
    }
  }
  return undefined;
}

export async function listOfficialReleases(): Promise<ReleaseInfo[]> {
  let releases = [];
  // TODO - handle rate limiting
  // TODO - long term - handle pagination (more than 100 releases)
  const resp = await fetch(
    "https://api.github.com/repos/open-goal/jak-project/releases?per_page=100"
  );
  // TODO - handle error
  const githubReleases = await resp.json();

  for (const release of githubReleases) {
    releases.push({
      releaseType: "official",
      version: release.tag_name,
      date: release.published_at,
      githubLink: release.html_url,
      downloadUrl: await getDownloadLinkForCurrentPlatform(release),
      isDownloaded: false,
      pendingAction: false,
    });
  }

  return releases.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestOfficialRelease(): Promise<ReleaseInfo> {
  // TODO - handle rate limiting
  const resp = await fetch(
    "https://api.github.com/repos/open-goal/jak-project/releases/latest"
  );
  // TODO - handle error
  const githubRelease = await resp.json();
  return {
    releaseType: "official",
    version: githubRelease.tag_name,
    date: githubRelease.published_at,
    githubLink: githubRelease.html_url,
    downloadUrl: await getDownloadLinkForCurrentPlatform(githubRelease),
    isDownloaded: false,
    pendingAction: false,
  };
}
