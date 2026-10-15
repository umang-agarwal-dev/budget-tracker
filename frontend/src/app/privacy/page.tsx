import type { Metadata } from "next";
import Legal, { Contact } from "@/components/Legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="15 October 2026">
      <p>Pocket stores what you enter so the app can work. We don&apos;t sell your data, show ads, or track you across other websites.</p>

      <h2>What we store</h2>
      <ul>
        <li><b>Account:</b> your name and email, and a one-way scrambled (hashed) password. If you use Google sign-in, we receive your Google name and email, never your Google password.</li>
        <li><b>Your money data:</b> budgets, expenses, savings goals, and the groups you create or join (names, amounts and notes).</li>
        <li><b>Technical data:</b> basic server logs such as IP address and request time, kept by our hosting providers for security and debugging, and used for rate limiting.</li>
      </ul>

      <h2>What stays on your device</h2>
      <p>Your login token, theme, group passes and profile photo are saved in your browser. The profile photo is never uploaded.</p>

      <h2>AI tips</h2>
      <p>When you ask for a tip, we send summary figures (your budget, spending totals, top categories and goal amounts) to Google&apos;s Gemini service to write it. We don&apos;t send your notes, name or email.</p>

      <h2>Who helps us run Pocket</h2>
      <ul>
        <li>Vercel hosts the website.</li>
        <li>Render hosts the server.</li>
        <li>Neon hosts the database (Singapore region).</li>
        <li>Google provides sign-in and the Gemini service.</li>
      </ul>
      <p>They process data only to provide their service to us.</p>

      <h2>Groups</h2>
      <p>People in a group can see that group&apos;s member names, expenses and settlement. Share invite links only with people you trust.</p>

      <h2>Your choices</h2>
      <ul>
        <li><b>See and export:</b> Settings, Export expenses (CSV).</li>
        <li><b>Correct:</b> change your name in Settings.</li>
        <li><b>Delete:</b> Settings, Delete account. This removes your account and the data linked to it, including groups you created (they disappear for other members too). Provider backups may take a short time to expire.</li>
      </ul>

      <h2>Security</h2>
      <p>Data travels over HTTPS and passwords are hashed. No system is perfectly secure, so please use a strong, unique password.</p>

      <h2>Children</h2>
      <p>Pocket is not meant for children under 13.</p>

      <h2>Changes</h2>
      <p>If this policy changes, we&apos;ll update the date above.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <Contact />.</p>
    </Legal>
  );
}
