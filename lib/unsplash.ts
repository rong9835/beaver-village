const UNSPLASH_APP_NAME = "beaver_village";

export type UnsplashPhoto = {
  imageUrl: string;
  photographerName: string;
  photographerProfileUrl: string;
};

type UnsplashRandomPhotoResponse = {
  urls: { regular: string };
  user: { name: string; links: { html: string } };
};

// 오늘의 비버상식(부가 기능) 카드에 쓸 랜덤 비버 사진.
// Unsplash API 이용 정책상 작가/Unsplash 크레딧 링크(utm 파라미터 포함)를 반드시
// 같이 보여줘야 함 — BeaverFact 컴포넌트에서 photographerProfileUrl로 그 링크를 만듦.
export async function getRandomBeaverPhoto(): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null;
  }

  const requestUrl = new URL("https://api.unsplash.com/photos/random");
  requestUrl.searchParams.set("query", "beaver");
  requestUrl.searchParams.set("content_filter", "high");

  const response = await fetch(requestUrl, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  }).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  const photo: UnsplashRandomPhotoResponse = await response.json();

  return {
    imageUrl: photo.urls.regular,
    photographerName: photo.user.name,
    photographerProfileUrl: `${photo.user.links.html}?utm_source=${UNSPLASH_APP_NAME}&utm_medium=referral`,
  };
}

// Unsplash 홈 크레딧 링크. 사진 작가 크레딧과 함께 항상 같이 보여줘야 함(API 이용 정책).
export const UNSPLASH_HOME_URL = `https://unsplash.com/?utm_source=${UNSPLASH_APP_NAME}&utm_medium=referral`;
