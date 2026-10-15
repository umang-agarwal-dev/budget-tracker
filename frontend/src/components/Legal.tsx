import Link from "next/link";
import Brand from "./Brand";

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function Contact() {
  return EMAIL ? <a href={`mailto:${EMAIL}`}>{EMAIL}</a> : <span>the contact email on our app listing</span>;
}

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="legal">
      <Link href="/" className="back">← Back to Pocket</Link>
      <Brand />
      <h1>{title}</h1>
      <p className="mut">Last updated {updated}</p>
      {children}
    </main>
  );
}
