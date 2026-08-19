import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getNextReads,
  getPublishedArticleBySlug,
  getPublishedArticleParams,
  isArticleCategory,
} from "@/lib/articles";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { ArticleBody } from "@/components/article/ArticleBody";
import { SourceCitation } from "@/components/article/SourceCitation";
import { LazyYoutubeEmbed } from "@/components/article/LazyYoutubeEmbed";
import { CommentList } from "@/components/article/CommentList";
import { NextReads } from "@/components/article/NextReads";

type ArticlePageParams = {
  category: string;
  slug: string;
};

// 발행된 글만 빌드 시점에 정적 페이지로 생성함 (기능명세서 A-01, 렌더링: SSG)
export async function generateStaticParams() {
  const params = await getPublishedArticleParams();
  return params.map(({ category, slug }) => ({ category, slug }));
}

async function loadArticle(params: ArticlePageParams) {
  if (!isArticleCategory(params.category)) {
    return null;
  }

  const article = await getPublishedArticleBySlug(params.slug);

  if (!article) {
    return null;
  }

  // URL의 category가 실제 글의 category와 다르면 같은 글이 여러 주소를 갖게 되므로 404 처리함.
  if (article.category !== params.category) {
    return null;
  }

  return article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ArticlePageParams>;
}): Promise<Metadata> {
  const article = await loadArticle(await params);

  if (!article) {
    return {};
  }

  const canonicalPath = `/library/${article.category}/${article.slug}`;

  return {
    title: `${article.question} - 비버마을`,
    description: article.summary ?? undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: article.youtube_video_id
      ? {
          images: [
            `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`,
          ],
        }
      : undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<ArticlePageParams>;
}) {
  const article = await loadArticle(await params);

  if (!article) {
    notFound();
  }

  const nextReads = await getNextReads(article.category, article.id);

  // FAQPage 구조화 데이터. 반응(comments)은 포함하지 않음 — docs/결정사항.md H 참고.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: article.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: article.summary ?? article.content,
        },
      },
    ],
  };

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="flex flex-col gap-2">
        <span className="w-fit rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {CATEGORY_LABELS[article.category]}
        </span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {article.question}
        </h1>
      </header>

      <ArticleBody content={article.content} />

      <SourceCitation article={article} />

      {article.youtube_video_id && (
        <LazyYoutubeEmbed youtubeVideoId={article.youtube_video_id} />
      )}

      <CommentList targetId={article.id} />

      <NextReads articles={nextReads} />
    </article>
  );
}
