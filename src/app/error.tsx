'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="container empty-page"><h1>A small delay.</h1><p>Something went wrong loading this page. Please try again.</p><button className="button" onClick={reset}>Try again</button><a className="text-link" href="/">Back to home</a></div>; }
